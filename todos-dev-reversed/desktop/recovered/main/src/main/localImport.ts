import { spawn } from 'node:child_process'
import { mkdtempSync, realpathSync, rmSync } from 'node:fs'
import { lstat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { LOCAL_IMPORT_MAX_BYTES, type DesktopFolderInspection, type DesktopImportRequest, type DesktopImportResult } from '@tds/types/desktop'

// Local folder → fresh hosted repo. No electron here, so the git side runs under plain node in
// tests; the IPC wiring lives in localImportIpc.ts.

const PUSH_TIMEOUT_MS = 30 * 60_000
const REMOTE_NAME = 'todos'

class GitMissing extends Error {}

class GitFailed extends Error {
  constructor(message: string, readonly code: number | null) {
    super(message)
  }
}

interface GitOpts {
  cwd: string
  env: NodeJS.ProcessEnv
  config?: Record<string, string>
  timeoutMs?: number
}

// Same per-command config channel as the executor's gitEnv (apps/executor/src/lib/workspace.ts):
// the credential never lands in .git/config, and LC_ALL keeps the messages matched below English.
function git(args: string[], { cwd, env, config = {}, timeoutMs }: GitOpts): Promise<string> {
  const entries = Object.entries({ 'credential.helper': '', ...config })
  const childEnv: NodeJS.ProcessEnv = { ...env, LC_ALL: 'C', GIT_TERMINAL_PROMPT: '0', GIT_CONFIG_COUNT: String(entries.length) }
  entries.forEach(([key, value], i) => {
    childEnv[`GIT_CONFIG_KEY_${i}`] = key
    childEnv[`GIT_CONFIG_VALUE_${i}`] = value
  })
  return new Promise((resolve, reject) => {
    const child = spawn('git', args, { cwd, env: childEnv, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true, timeout: timeoutMs })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d: Buffer) => { stdout += d.toString('utf8') })
    child.stderr.on('data', (d: Buffer) => { stderr += d.toString('utf8') })
    child.on('error', (err: NodeJS.ErrnoException) => reject(err.code === 'ENOENT' ? new GitMissing('git not found') : err))
    child.on('close', (code) => {
      if (code === 0) resolve(stdout)
      else reject(new GitFailed(redact(stderr.trim() || stdout.trim() || `git ${args[0]} exited with ${code}`), code))
    })
  })
}

async function gitOk(args: string[], opts: GitOpts): Promise<boolean> {
  try {
    await git(args, opts)
    return true
  } catch (err) {
    if (err instanceof GitFailed) return false
    throw err
  }
}

function redact(text: string): string {
  return text.replace(/x-access-token:[^@]+@/g, 'x-access-token:***@')
}

export function stripCredential(url: string): string {
  return url.replace(/^([a-z][a-z0-9+.-]*:\/\/)[^@/]+@/i, '$1')
}

// .native expands Windows 8.3 short names (C:\Users\RUNNER~1) that git reports in long form.
function samePath(a: string, b: string): boolean {
  try {
    return realpathSync.native(a) === realpathSync.native(b)
  } catch {
    return false
  }
}

function entries(out: string): string[] {
  return out.split('\0').filter(Boolean)
}

// A plain folder has no index to ask, so a throwaway git dir over it as work tree lists what `add -A`
// would take — the folder's own .gitignore files included.
async function listPlainFiles(dir: string, env: NodeJS.ProcessEnv): Promise<string[]> {
  const scratch = mkdtempSync(join(tmpdir(), 'tds-import-'))
  try {
    await git(['init', '-q', scratch], { cwd: scratch, env })
    return entries(await git(['--git-dir', join(scratch, '.git'), '--work-tree', dir, 'ls-files', '-z', '-co', '--exclude-standard'], { cwd: dir, env }))
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
}

// Raw bytes of the files a first commit would take. Uncompressed, so it errs high against the cap.
async function filesSize(dir: string, files: string[]): Promise<number> {
  let total = 0
  for (let i = 0; i < files.length; i += 256) {
    const sizes = await Promise.all(files.slice(i, i + 256).map((f) => lstat(join(dir, f)).then((s) => s.size, () => 0)))
    for (const s of sizes) total += s
  }
  return total
}

// A repo with history pushes its objects, and the local store's packed size is close to what lands
// on the host — the cap is measured on the host's repo directory the same way.
async function objectStoreSize(dir: string, env: NodeJS.ProcessEnv): Promise<number> {
  const out = await git(['count-objects', '-v'], { cwd: dir, env })
  let kib = 0
  for (const line of out.split('\n')) {
    const m = /^(size|size-pack): (\d+)$/.exec(line.trim())
    if (m) kib += Number(m[2])
  }
  return kib * 1024
}

async function listRemotes(dir: string, env: NodeJS.ProcessEnv): Promise<{ name: string; url: string }[]> {
  const out = await git(['remote', '-v'], { cwd: dir, env })
  const remotes: { name: string; url: string }[] = []
  for (const line of out.split('\n')) {
    const m = /^(\S+)\s+(\S+)\s+\(fetch\)$/.exec(line.trim())
    if (m) remotes.push({ name: m[1], url: stripCredential(m[2]) })
  }
  return remotes
}

async function isRepoRoot(dir: string, env: NodeJS.ProcessEnv): Promise<boolean> {
  try {
    const top = (await git(['rev-parse', '--show-toplevel'], { cwd: dir, env })).trim()
    return samePath(top, dir)
  } catch (err) {
    if (err instanceof GitFailed) return false
    throw err
  }
}

export async function inspectFolder(dir: string, env: NodeJS.ProcessEnv): Promise<DesktopFolderInspection> {
  const name = basename(dir)
  if (!(await isRepoRoot(dir, env))) {
    const files = await listPlainFiles(dir, env)
    const fileCount = files.length
    const sizeBytes = await filesSize(dir, files)
    return { dir, name, kind: fileCount === 0 ? 'empty' : 'plain', branch: null, dirty: false, hasCommits: false, fileCount, sizeBytes, remotes: [] }
  }
  const hasCommits = await gitOk(['rev-parse', '--verify', '-q', 'HEAD'], { cwd: dir, env })
  const branch = await git(['symbolic-ref', '--short', '-q', 'HEAD'], { cwd: dir, env }).then((b) => b.trim() || null, () => null)
  const files = entries(await git(['ls-files', '-z', '-co', '--exclude-standard'], { cwd: dir, env }))
  const fileCount = files.length
  const sizeBytes = hasCommits ? await objectStoreSize(dir, env) : await filesSize(dir, files)
  const dirty = hasCommits && (await git(['status', '--porcelain'], { cwd: dir, env })).trim() !== ''
  const remotes = await listRemotes(dir, env)
  const kind = !hasCommits && fileCount === 0 ? 'empty' : 'git'
  return { dir, name, kind, branch, dirty, hasCommits, fileCount, sizeBytes, remotes }
}

async function commitEverything(dir: string, env: NodeJS.ProcessEnv, author: DesktopImportRequest['author']): Promise<void> {
  await git(['add', '-A'], { cwd: dir, env })
  const identity: Record<string, string> = {}
  if (!(await gitOk(['config', 'user.name'], { cwd: dir, env }))) identity['user.name'] = author.name
  if (!(await gitOk(['config', 'user.email'], { cwd: dir, env }))) identity['user.email'] = author.email
  await git(['commit', '-q', '--no-verify', '-m', 'Import from local folder'], { cwd: dir, env, config: identity })
}

// The remote the user pulls platform changes through. A `todos` pointing anywhere else is the
// user's own and stays as it is; the next free `todos-N` is used instead.
async function addPlatformRemote(dir: string, env: NodeJS.ProcessEnv, url: string): Promise<string> {
  const existing = new Set((await git(['remote'], { cwd: dir, env })).split('\n').map((s) => s.trim()).filter(Boolean))
  for (let i = 1; ; i++) {
    const name = i === 1 ? REMOTE_NAME : `${REMOTE_NAME}-${i}`
    if (!existing.has(name)) {
      await git(['remote', 'add', name, url], { cwd: dir, env })
      return name
    }
    const current = (await git(['remote', 'get-url', name], { cwd: dir, env })).trim()
    if (stripCredential(current) === url) return name
  }
}

function authConfig(url: string, token: string): Record<string, string> {
  const origin = /^(https?:\/\/[^/]+)/.exec(url)?.[1]
  if (!origin) return {}
  const authed = origin.replace(/^(https?):\/\//, `$1://x-access-token:${token}@`)
  return { [`url.${authed}/.insteadOf`]: `${origin}/` }
}

export async function importFolder(req: DesktopImportRequest, env: NodeJS.ProcessEnv): Promise<DesktopImportResult> {
  try {
    const found = await inspectFolder(req.dir, env)
    if (found.kind === 'empty') return { ok: false, error: 'empty' }
    if (found.dirty) return { ok: false, error: 'dirty' }
    if (found.sizeBytes > LOCAL_IMPORT_MAX_BYTES) return { ok: false, error: 'too_large' }

    if (found.kind === 'plain') {
      await git(['init', '-q'], { cwd: req.dir, env })
      await git(['symbolic-ref', 'HEAD', `refs/heads/${req.defaultBranch}`], { cwd: req.dir, env })
    }
    if (!found.hasCommits) await commitEverything(req.dir, env, req.author)

    const url = `${req.repoUrl.replace(/\/$/, '')}.git`
    // Forced: the new repo's seed commit (README, index.html) is replaced by the folder's history.
    await git(['push', '--force', '--no-verify', url, `HEAD:refs/heads/${req.defaultBranch}`], {
      cwd: req.dir,
      env,
      config: authConfig(url, req.token),
      timeoutMs: PUSH_TIMEOUT_MS,
    })
    return { ok: true, remoteName: await addPlatformRemote(req.dir, env, url) }
  } catch (err) {
    if (err instanceof GitMissing) return { ok: false, error: 'git_missing' }
    const detail = err instanceof Error ? redact(err.message) : String(err)
    if (/exceeds the \d+ MB size limit/.test(detail)) return { ok: false, error: 'too_large', detail }
    return { ok: false, error: 'push_failed', detail }
  }
}

export function isGitMissing(err: unknown): boolean {
  return err instanceof GitMissing
}
