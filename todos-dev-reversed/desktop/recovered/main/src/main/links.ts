import { APP_MOUNT, isAppPath } from '../shared/appUrl'

// Where a URL the window wants to go belongs.
//
//   in-window  the app itself: same origin, under /app (any same-origin path against a dev server,
//              where the SPA is mounted at /)
//   handoff    a page the app hands the window to and expects back: the Next-owned sign-in and
//              approval pages on our origin, and the third parties they bounce through (OAuth,
//              Stripe). Allowed as a top-level navigation; never opened outside.
//   external   everything else — the system browser's job.
export type LinkKind = 'in-window' | 'handoff' | 'external'

const HANDOFF_PATHS = ['/login', '/qr/', '/enroll/', '/invite', '/upgrade', '/api/auth/']

// `ownReturn`: the page carries its own link back to the app (Stripe's ← to the cancel URL).
const HANDOFF_HOSTS: Array<{ host: string; paths?: string[]; ownReturn?: true }> = [
  { host: 'accounts.google.com' },
  { host: 'github.com', paths: ['/login', '/session', '/sessions', '/apps/', '/organizations/'] },
  { host: 'checkout.stripe.com', ownReturn: true },
  { host: 'billing.stripe.com', ownReturn: true },
]

export function classify(raw: string, opts: { appOrigin: string; isDev: boolean }): LinkKind {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return 'external'
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return 'external'
  if (url.origin === opts.appOrigin) {
    if (opts.isDev || isAppPath(url.pathname)) return 'in-window'
    return HANDOFF_PATHS.some((p) => url.pathname === p.replace(/\/$/, '') || url.pathname.startsWith(p)) ? 'handoff' : 'external'
  }
  const host = HANDOFF_HOSTS.find((h) => h.host === url.hostname)
  if (!host) return 'external'
  return !host.paths || host.paths.some((p) => url.pathname.startsWith(p)) ? 'handoff' : 'external'
}

// Whether the window shows its own way back from this page. Off our origin — a provider's sign-in
// page, and wherever its links lead — there is no chrome to come back with, so the preload draws a
// back button. Our own pages are the app's, and a host with `ownReturn` does without.
export function wantsBackButton(raw: string, appOrigin: string): boolean {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return false
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false
  if (url.origin === appOrigin) return false
  return !HANDOFF_HOSTS.some((h) => h.host === url.hostname && h.ownReturn)
}

// tds://sign-in is the system browser handing back an OAuth sign-in the window started
// (apps/server/src/lib/desktopLoginFlow.ts): the window loads the consume URL as a document, so its
// cookie reaches the server and the session cookie comes back into the window's jar.
export function signInReturnHref(raw: string, appOrigin: string): string | null {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.protocol !== 'tds:' || url.host !== 'sign-in') return null
  const r = url.searchParams.get('r')
  const code = url.searchParams.get('code')
  if (!r || !code) return null
  const href = new URL('/api/auth/desktop/consume', appOrigin)
  href.searchParams.set('r', r)
  href.searchParams.set('code', code)
  return href.toString()
}

// A link from outside the app, resolved to the in-window address it means — or null for one the
// shell does not own. tds://<host><path>?<q> maps onto the /app mount (`tds://inbox` is
// /app/inbox); a universal link on our origin is taken as is.
export function toAppHref(raw: string, appOrigin: string): string | null {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.protocol === 'tds:') {
    const path = `${url.host}${url.pathname}`.replace(/\/+$/, '')
    return `${appOrigin}${APP_MOUNT}${path ? `/${path.replace(/^\/+/, '')}` : ''}${url.search}`
  }
  if (url.origin === appOrigin && isAppPath(url.pathname)) return url.toString()
  return null
}
