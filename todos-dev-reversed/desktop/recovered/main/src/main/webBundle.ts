import { createHash } from 'node:crypto'
import { createWriteStream, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Transform, type Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { t, x } from 'tar'
import type { DesktopWebManifest } from '@tds/types/desktop'

// The web export the shell serves, and how a newer one arrives over the air. Pure (no electron
// import) so it can be tested outside the app; main/updater.ts drives it.
//
// Layout under <userData>/web:
//   <appBuild>/            an export the shell may serve: index.html, _expo/, …, desktop-manifest.json
//   <appBuild>.partial/    one being unpacked, from <appBuild>.partial.tgz
//   current.json           { appBuild } of the directory being served; absent means the bundled export

export const MANIFEST_FILE = 'desktop-manifest.json'
const CURRENT_FILE = 'current.json'
const MAX_BYTES = 64 * 1024 * 1024
// The only gate between a string from the network and a directory name.
const APP_BUILD_RE = /^[0-9a-f]{8,64}$/
const ENTRY_RE = /\/_expo\/static\/js\/web\/entry-([0-9a-f]+)\.js/

export function parseManifest(json: unknown, opts: { allowInsecure?: boolean } = {}): DesktopWebManifest | null {
  if (!json || typeof json !== 'object') return null
  const m = json as Record<string, unknown>
  if (typeof m.appBuild !== 'string' || !APP_BUILD_RE.test(m.appBuild)) return null
  const bridge = m.bridge ?? 0
  if (typeof bridge !== 'number' || !Number.isInteger(bridge) || bridge < 0) return null
  const out: DesktopWebManifest = { appBuild: m.appBuild, exportedAt: typeof m.exportedAt === 'string' ? m.exportedAt : '', bridge }
  if (m.bundle === undefined) return out
  const b = m.bundle as Record<string, unknown> | null
  if (!b || typeof b !== 'object') return null
  const { url, sha256, size } = b
  if (typeof url !== 'string' || !(url.startsWith('https://') || (opts.allowInsecure && url.startsWith('http://')))) return null
  if (typeof sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(sha256)) return null
  if (typeof size !== 'number' || !Number.isInteger(size) || size <= 0 || size > MAX_BYTES) return null
  out.bundle = { url, sha256, size }
  return out
}

export function readManifest(dir: string): DesktopWebManifest | null {
  try {
    return parseManifest(JSON.parse(readFileSync(join(dir, MANIFEST_FILE), 'utf8')))
  } catch {
    return null
  }
}

// An export the shell could serve as `appBuild`: its index.html loads that build's entry chunk, its
// manifest agrees, and it was made against a bridge this shell speaks.
export function isValidBundleDir(dir: string, appBuild: string, bridge: number): boolean {
  let html: string
  try {
    html = readFileSync(join(dir, 'index.html'), 'utf8')
  } catch {
    return false
  }
  if (ENTRY_RE.exec(html)?.[1] !== appBuild) return false
  const m = readManifest(dir)
  return m !== null && m.appBuild === appBuild && m.bridge <= bridge
}

// A freshly installed shell must not revert to an older cached or published web export.
export function isNewerExport(exportedAt: string, bundledExportedAt?: string): boolean {
  const bundledTime = Date.parse(bundledExportedAt ?? '')
  return !Number.isFinite(bundledTime) || Date.parse(exportedAt) > bundledTime
}

// Keep a valid OTA newer than the bundled export; discard stale and unfinished downloads.
export function selectStartupRoot(webDir: string, opts: { bundledBuild: string | null; bundledExportedAt?: string; bridge: number }): { active: string | null; remove: string[] } {
  let current: string | null = null
  try {
    const c = JSON.parse(readFileSync(join(webDir, CURRENT_FILE), 'utf8')) as { appBuild?: unknown }
    if (typeof c.appBuild === 'string' && APP_BUILD_RE.test(c.appBuild)) current = c.appBuild
  } catch {
    // no pointer: the bundled export
  }
  const cached = current ? readManifest(join(webDir, current)) : null
  const active = current && current !== opts.bundledBuild && cached && isNewerExport(cached.exportedAt, opts.bundledExportedAt)
    && isValidBundleDir(join(webDir, current), current, opts.bridge) ? current : null
  let entries: string[] = []
  try {
    entries = readdirSync(webDir)
  } catch {
    // no directory yet
  }
  const keep = active ? [active, CURRENT_FILE] : []
  return { active, remove: entries.filter((e) => !keep.includes(e)).map((e) => join(webDir, e)) }
}

export function writeCurrent(webDir: string, appBuild: string | null): void {
  const target = join(webDir, CURRENT_FILE)
  if (!appBuild) {
    rmSync(target, { force: true })
    return
  }
  mkdirSync(webDir, { recursive: true })
  writeFileSync(`${target}.tmp`, JSON.stringify({ appBuild }))
  renameSync(`${target}.tmp`, target)
}

// Streams a download to disk, checking it against the manifest as it goes; a wrong digest or a
// body running past `size` leaves nothing behind.
export async function storeVerified(body: Readable, file: string, expected: { sha256: string; size: number }): Promise<void> {
  const hash = createHash('sha256')
  let seen = 0
  const check = new Transform({
    transform(chunk: Buffer, _enc, cb) {
      seen += chunk.length
      if (seen > expected.size) return cb(new Error(`bundle runs past ${expected.size} bytes`))
      hash.update(chunk)
      cb(null, chunk)
    },
  })
  try {
    await pipeline(body, check, createWriteStream(file))
    if (seen !== expected.size) throw new Error(`bundle is ${seen} bytes, manifest says ${expected.size}`)
    const digest = hash.digest('hex')
    if (digest !== expected.sha256) throw new Error(`bundle sha256 ${digest}, manifest says ${expected.sha256}`)
  } catch (err) {
    rmSync(file, { force: true })
    throw err
  }
}

export async function extractBundle(tgz: string, dir: string): Promise<void> {
  let bytes = 0
  let entries = 0
  let invalid: string | undefined
  await t({ file: tgz, strict: true, onReadEntry(entry) {
    const path = entry.path
    if (/^[\/\\]/.test(path) || /[\\:\0]/.test(path) || path.split('/').includes('..')) invalid = `Unsafe bundle path: ${path}`
    if (entry.type !== 'File' && entry.type !== 'Directory') invalid = `Unsupported bundle entry: ${entry.type}`
    bytes += entry.size
    if (bytes > 512 * 1024 * 1024 || ++entries > 50_000) invalid = 'Unpacked bundle is too large'
  } })
  if (invalid) throw new Error(invalid)
  mkdirSync(dir, { recursive: true })
  await x({ file: tgz, cwd: dir, strict: true, preservePaths: false })
}
