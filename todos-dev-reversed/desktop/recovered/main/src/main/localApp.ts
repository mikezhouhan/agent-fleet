import { createReadStream } from 'node:fs'
import { resolve } from 'node:path'
import { Readable } from 'node:stream'
import type { Session } from 'electron'
import { isAppPath } from '../shared/appUrl'
import { mark, timing } from './boot'
import { HTML_CONTENT_TYPE, resolveAcrossRoots } from './localFiles'

// The web export, served from disk under the app's real origin.
//
// The web build is a same-origin client: relative API paths, the session in a cookie, sign-in on
// /login — all of it tied to https://todos.dev. Moving the files to file:// or a custom scheme would
// mean redoing cookies, SameSite and CORS. So the window keeps its address and the shell intercepts
// only what the export contains: GET requests under /app. Everything else — /api, /login, /sw.js,
// OAuth, Stripe — passes through to the network untouched, and the app never learns the difference.
// Through the window's own session, not net.fetch's default one: the cookie jar the server writes
// into and the sockets closeAllConnections drops around a sleep must be the window's.
//
// `roots` is asked per request: the updater moves the first entry to a newer bundle over the air,
// and keeps the one it replaced behind it for the page that is still running it. `onIndex` tells
// the updater the document was just served from roots[0].

function fileResponse(file: string, contentType: string, cacheControl: string): Response {
  const body = Readable.toWeb(createReadStream(file)) as unknown as ReadableStream
  return new Response(body, { headers: { 'content-type': contentType, 'cache-control': cacheControl } })
}

// The page shell's icon and manifest links point at the site root, which the export does not
// carry, and Chromium asks for them on every load; a window has nowhere to show them.
const ROOT_DECOR = new Set(['/favicon.svg', '/favicon.ico', '/apple-touch-icon.png', '/manifest.webmanifest'])

// A pooled connection can die with neither end noticing — a sleep, a proxy whose upstream went
// away — and Chromium keeps writing requests into it until the app's own 15s timeout gives up.
// session.ts drops the pool on the transitions the shell can see; this catches the ones it cannot.
// Well short of 15s, so the retry still lands inside the app's budget.
const PASS_TIMEOUT_MS = 8_000

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('shell pass-through timed out')), ms)
    void p.then(resolve, reject).finally(() => clearTimeout(timer))
  })
}

// Only a request with no body is replayed: one that carries a body cannot be sent twice, and an
// upload may legitimately outlast the cap. The next bodyless request empties the pool for it.
// A caller that aborted its own request is not evidence of anything.
export async function passThrough(ses: Session, req: Request): Promise<Response> {
  const send = (): Promise<Response> => ses.fetch(req, { bypassCustomProtocolHandlers: true })
  if (req.body) return send()
  try {
    return await withTimeout(send(), PASS_TIMEOUT_MS)
  } catch (e) {
    if (req.signal?.aborted) throw e
    await ses.closeAllConnections()
    return send()
  }
}

export function installLocalApp(ses: Session, opts: { roots: () => string[]; appOrigin: string; onIndex: () => void }): void {
  ses.protocol.handle('https', (req) => {
    const url = new URL(req.url)
    if (url.origin === opts.appOrigin && req.method === 'GET' && ROOT_DECOR.has(url.pathname)) {
      return new Response(null, { status: 204 })
    }
    if (url.origin !== opts.appOrigin || req.method !== 'GET' || !isAppPath(url.pathname)) {
      if (timing) mark(`pass ${req.method} ${url.host}${url.pathname}`)
      return passThrough(ses, req)
    }
    const roots = opts.roots()
    const r = resolveAcrossRoots(url.pathname, roots)
    switch (r.kind) {
      case 'file':
        return fileResponse(r.file, r.contentType, r.cacheControl)
      case 'index':
        opts.onIndex()
        return fileResponse(resolve(roots[0], 'index.html'), HTML_CONTENT_TYPE, 'no-cache')
      case 'not-found':
        return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain' } })
      case 'reject':
        return new Response('Bad request', { status: 400, headers: { 'content-type': 'text/plain' } })
    }
  })
}
