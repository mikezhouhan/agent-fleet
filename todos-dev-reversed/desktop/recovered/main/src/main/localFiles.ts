import { existsSync, statSync } from 'node:fs'
import { extname, resolve, sep } from 'node:path'
import { APP_MOUNT, isAppPath } from '../shared/appUrl'

// Which file of the bundled web export a /app/* request means. Pure (no electron import) so it can
// be tested outside the app; main/localApp.ts does the serving.
//
// Fallback rules mirror next.config.ts: a path with no file behind it is the SPA shell
// (index.html), except under _expo/ and wasm/, where a miss is a real 404.

export const HTML_CONTENT_TYPE = 'text/html; charset=utf-8'

const CONTENT_TYPES: Record<string, string> = {
  '.html': HTML_CONTENT_TYPE,
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
}

// Directories whose files carry a content hash in their name, so the renderer may cache them for
// good — the same header rule next.config.ts applies to the export.
const IMMUTABLE_PREFIXES = ['_expo/', 'fonts/', 'wasm/', 'assets/']
const STRICT_PREFIXES = ['_expo/', 'wasm/']

export type LocalResolution =
  | { kind: 'file'; file: string; contentType: string; cacheControl: string }
  | { kind: 'index' }
  | { kind: 'not-found' }
  | { kind: 'reject' }

export function resolveLocalPath(pathname: string, root: string): LocalResolution {
  if (!isAppPath(pathname)) return { kind: 'reject' }
  let rel: string
  try {
    rel = decodeURIComponent(pathname.slice(APP_MOUNT.length)).replace(/^\/+/, '')
  } catch {
    return { kind: 'reject' }
  }
  if (/[\\:\0]/.test(rel)) return { kind: 'reject' }
  if (rel === '' || rel === 'index.html') return { kind: 'index' }
  const absRoot = resolve(root)
  const file = resolve(absRoot, rel)
  if (file !== absRoot && !file.startsWith(absRoot + sep)) return { kind: 'reject' }
  const ext = extname(file).toLowerCase()
  if (ext && existsSync(file) && statSync(file).isFile()) {
    return {
      kind: 'file',
      file,
      contentType: CONTENT_TYPES[ext] ?? 'application/octet-stream',
      cacheControl: IMMUTABLE_PREFIXES.some((p) => rel.startsWith(p)) ? 'public, max-age=31536000, immutable' : 'no-cache',
    }
  }
  return STRICT_PREFIXES.some((p) => rel.startsWith(p)) ? { kind: 'not-found' } : { kind: 'index' }
}

// roots[0] is the build being served: the shell and every miss verdict come from it. A file it
// lacks is looked for in the older roots behind it, so a page still running the previous build
// keeps finding its hashed chunks after the shell has moved on to a newer bundle.
export function resolveAcrossRoots(pathname: string, roots: readonly string[]): LocalResolution {
  const first = resolveLocalPath(pathname, roots[0])
  if (first.kind === 'file' || first.kind === 'reject') return first
  for (const root of roots.slice(1)) {
    const r = resolveLocalPath(pathname, root)
    if (r.kind === 'file') return r
  }
  return first
}
