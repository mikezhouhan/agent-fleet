import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { DESKTOP_IPC, type DesktopBridge, type DesktopMachineState, type DesktopUpdateSnapshot } from '@tds/types/desktop'

// What the page sees of the shell: window.__TDS_DESKTOP__ (apps/app/lib/shell.web.ts reads it).
// Sandboxed, so nothing here but `electron` and what esbuild inlined.

function arg(name: string): string | undefined {
  const prefix = `--${name}=`
  return process.argv.find((a) => a.startsWith(prefix))?.slice(prefix.length)
}

// A navigate can arrive before the app has mounted its listener (a deep link that launched the
// app); hold it until one exists.
const navListeners = new Set<(href: string) => void>()
let pendingNav: string[] = []
ipcRenderer.on(DESKTOP_IPC.navigate, (_e: IpcRendererEvent, href: unknown) => {
  if (typeof href !== 'string') return
  if (navListeners.size === 0) pendingNav.push(href)
  else for (const cb of navListeners) cb(href)
})

const titleBarInset = Number(arg('tds-titlebar-inset') ?? 0) || 0
const titleBarLeft = Number(arg('tds-titlebar-left') ?? 0) || 0

const bridge: DesktopBridge = {
  platform: process.platform as DesktopBridge['platform'],
  shellVersion: arg('tds-desktop-version') ?? '0.0.0',
  appBuild: arg('tds-app-build') || null,
  titleBarInset,
  openExternal: (url) => ipcRenderer.send(DESKTOP_IPC.openExternal, url),
  onNavigate: (cb) => {
    navListeners.add(cb)
    const queued = pendingNav
    pendingNav = []
    for (const href of queued) cb(href)
    return () => { navListeners.delete(cb) }
  },
  setTheme: (theme) => ipcRenderer.send(DESKTOP_IPC.theme, theme),
  setLocale: (locale) => ipcRenderer.send(DESKTOP_IPC.locale, locale),
  notify: (n) => ipcRenderer.send(DESKTOP_IPC.notify, n),
  setBadge: (count) => ipcRenderer.send(DESKTOP_IPC.badge, count),
  update: {
    getState: () => ipcRenderer.invoke(DESKTOP_IPC.updateGetState),
    onState: (cb) => {
      const listener = (_e: IpcRendererEvent, s: DesktopUpdateSnapshot) => cb(s)
      ipcRenderer.on(DESKTOP_IPC.updateState, listener)
      return () => { ipcRenderer.removeListener(DESKTOP_IPC.updateState, listener) }
    },
    restart: () => ipcRenderer.send(DESKTOP_IPC.updateRestart),
    check: () => ipcRenderer.send(DESKTOP_IPC.updateCheck),
  },
  machine: {
    getState: () => ipcRenderer.invoke(DESKTOP_IPC.machineGetState),
    onState: (cb) => {
      const listener = (_e: IpcRendererEvent, state: DesktopMachineState) => cb(state)
      ipcRenderer.on(DESKTOP_IPC.machineState, listener)
      return () => { ipcRenderer.removeListener(DESKTOP_IPC.machineState, listener) }
    },
    identity: () => ipcRenderer.invoke(DESKTOP_IPC.machineIdentity),
    enroll: (r) => ipcRenderer.invoke(DESKTOP_IPC.machineEnroll, r),
    start: () => ipcRenderer.invoke(DESKTOP_IPC.machineStart),
    takeOver: () => ipcRenderer.invoke(DESKTOP_IPC.machineTakeOver),
    forget: () => ipcRenderer.invoke(DESKTOP_IPC.machineForget),
    openLogs: () => ipcRenderer.send(DESKTOP_IPC.machineOpenLogs),
  },
  localImport: {
    pick: () => ipcRenderer.invoke(DESKTOP_IPC.localImportPick),
    push: (r) => ipcRenderer.invoke(DESKTOP_IPC.localImportPush, r),
  },
  discoverModels: (r) => ipcRenderer.invoke(DESKTOP_IPC.discoverModels, r),
}

contextBridge.exposeInMainWorld('__TDS_DESKTOP__', bridge)

// The one network transition the page is told about and the main process is not. The sockets the
// pool kept across it are stale (main/session.ts).
window.addEventListener('online', () => ipcRenderer.send(DESKTOP_IPC.online))

// The title bar is the page's own top band. A strip over it is the drag region, and the region is
// geometry — Chromium walks the tree in document order, adding each drag box and subtracting each
// no-drag box, indifferent to z-order and pointer-events — so a no-drag rule on anything
// interactive keeps the app's buttons clickable where they overlap it, provided the strip comes
// *before* them in the tree: appended after #root its box would be added last and fill the holes
// back in. react-native-web renders every Pressable with a tabindex. Double-click on the strip is
// the window's own title-bar zoom. Built through the CSSOM rather than a <style> so a page CSP
// cannot refuse it. The app reads the class and the variables to keep its top-left row clear of
// the traffic lights (apps/app/public/index.html).
window.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement
  root.classList.add('tds-desktop')
  if (titleBarInset === 0) root.classList.add('tds-native-titlebar')
  root.style.setProperty('--tds-titlebar-inset', `${titleBarInset}px`)
  root.style.setProperty('--tds-titlebar-left', `${titleBarLeft}px`)
  if (titleBarInset === 0) return

  // A tag of our own, not a <div>: on the Next pages (/login) React hydrates the whole document,
  // and in <body> it skips an element whose tag it does not expect but claims one that matches —
  // a leading div was taken for the page's first div, hydration failed, and the client re-render
  // rewrote <html>'s class list without tds-desktop.
  const strip = document.createElement('tds-titlebar')
  Object.assign(strip.style, { position: 'fixed', top: '0', left: '0', right: '0', height: `${titleBarInset}px`, pointerEvents: 'none' })
  strip.style.setProperty('-webkit-app-region', 'drag')
  document.body.prepend(strip)

  const sheet = new CSSStyleSheet()
  sheet.replaceSync(
    '.tds-desktop :is(button, [role="button"], [tabindex], input, textarea, select, a[href], [contenteditable="true"]) { -webkit-app-region: no-drag; }',
  )
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]
})

ipcRenderer.on(DESKTOP_IPC.fullScreen, (_e: IpcRendererEvent, on: unknown) => {
  document.documentElement.classList.toggle('tds-fullscreen', on === true)
})

// A page off our origin (a provider's sign-in, and wherever its links lead) has no chrome to come
// back with: the shell says when one is up, and a back button goes into the title-bar band beside
// the traffic lights — the window's top-left corner under a native title bar. It is the page's own
// history.back(), so no IPC has to trust a third-party sender. Styled through an adopted sheet with
// `all: unset` first, so the page's CSS neither restyles it nor is asked to allow it; the no-drag
// is restated because `all` resets it and the strip above would otherwise swallow the click. The
// look is the app's own header back control (ScreenHeader's IconButton + BackIcon): a 16px
// chevron in the tertiary text colour, a p-1.5 hit area, the glyph dimming on press.
const BACK_SIZE = 28
let backSheet: CSSStyleSheet | null = null

function mountBackButton(): void {
  if (!backSheet) {
    const top = titleBarInset ? (titleBarInset - BACK_SIZE) / 2 : 12
    const left = titleBarInset ? titleBarLeft : 12
    backSheet = new CSSStyleSheet()
    backSheet.replaceSync(
      `#tds-back { all: unset; -webkit-app-region: no-drag; position: fixed; top: ${top}px; left: ${left}px; z-index: 2147483647; box-sizing: border-box; display: flex; align-items: center; justify-content: center; width: ${BACK_SIZE}px; height: ${BACK_SIZE}px; border-radius: 4px; color: #71717a; cursor: pointer; }` +
      '#tds-back:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }' +
      '#tds-back svg { display: block; }' +
      '#tds-back:active svg { opacity: 0.55; }',
    )
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, backSheet]
  }
  const btn = document.createElement('button')
  btn.id = 'tds-back'
  btn.type = 'button'
  btn.title = 'Back'
  btn.setAttribute('aria-label', 'Back')
  // Built by hand rather than innerHTML: a page enforcing Trusted Types would refuse the string.
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  for (const [k, v] of Object.entries({ width: '16', height: '16', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' })) svg.setAttribute(k, v)
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline')
  line.setAttribute('points', '15 18 9 12 15 6')
  svg.append(line)
  btn.append(svg)
  btn.addEventListener('click', () => history.back())
  document.body.append(btn)
}

ipcRenderer.on(DESKTOP_IPC.backButton, (_e: IpcRendererEvent, on: unknown) => {
  const apply = () => {
    document.getElementById('tds-back')?.remove()
    if (on === true) mountBackButton()
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once: true })
  else apply()
})
