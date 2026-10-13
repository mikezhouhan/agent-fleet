import { join } from 'node:path'
import { app, BrowserWindow, dialog, ipcMain, powerMonitor, shell, type Session } from 'electron'
import { DESKTOP_IPC } from '@tds/types/desktop'
import { APP_ORIGIN, APP_URL, isAppPath } from '../shared/appUrl'
import { mark, timing } from './boot'
import { fromApp, fromShell, UPDATE_PAGE } from './ipc'
import { classify, wantsBackButton } from './links'
import { isShellLocale, rememberLocale } from './locale'
import { PARTITION } from './session'
import { readWindowState, surfaceColor, writeWindowState } from './windowState'

// One past MOBILE_BREAKPOINT_QUERY ('(max-width: 767px)', packages/core/src/layout.ts): the shell
// must never be narrow enough to get the phone layout.
const MIN_WIDTH = 768
const MIN_HEIGHT = 600
// On macOS the app's 44px top rows (h-11) are the title bar. The preload paints the
// drag region over them; the lights sit centred in them, and TITLEBAR_LEFT is the width they take
// at the window's top-left corner, which the app keeps clear.
const TITLEBAR_INSET = process.platform === 'darwin' ? 44 : 0
const TRAFFIC_LIGHTS = { x: 14, y: 16 }
const TITLEBAR_LEFT = process.platform === 'darwin' ? 78 : 0
const OFFLINE_RETRY_MS = 5_000
// The window shows at the first of the page's first paint, its load, or this — on its remembered
// surface colour, which the app then paints over with the same ground.
const SHOW_FALLBACK_MS = 700

let win: BrowserWindow | null = null
let quitting = false
let loaded = false
let offline = false
let retry: NodeJS.Timeout | null = null
let initialAppBuild: string | null = null
let initialized = false
let closeDialogOpen = false
let hideOnClose = process.platform === 'darwin'

export function setHideOnClose(enabled: boolean): void {
  hideOnClose = enabled
}
// A deep link that arrived before the window (or its page) existed: becomes the first URL loaded.
let pendingHref: string | null = null
// The update page's query while a required release holds the app back (main/updater.ts): the window
// shows UPDATE_PAGE in place of the app, and a deep link waits in pendingHref.
let gate: { download: string; lang: string } | null = null

function originOf(url: string): string | null {
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

export function markQuitting(): void {
  quitting = true
}

export function getMainWindow(): BrowserWindow | null {
  return win
}

export function showUpdateGate(downloadUrl: string, lang: string): void {
  gate = { download: downloadUrl, lang }
  if (retry) { clearInterval(retry); retry = null }
  offline = false
  // An app page already up gives way; where it was is where the app resumes.
  const current = win?.webContents.getURL()
  if (!pendingHref && current && originOf(current) === APP_ORIGIN && isAppPath(new URL(current).pathname)) pendingHref = current
  loadUpdateGate()
}

// The page paints the window's remembered ground, as the app would.
function loadUpdateGate(): void {
  if (!win || !gate) return
  void win.loadFile(UPDATE_PAGE, { query: { ...gate, theme: readWindowState().theme ?? 'dark' } })
}

export function leaveUpdateGate(): void {
  if (!gate) return
  gate = null
  if (win) void win.loadURL(pendingHref ?? APP_URL)
}

export function createMainWindow(opts: { appBuild: string | null }): BrowserWindow {
  initialized = true
  initialAppBuild = opts.appBuild
  if (win) return win
  const state = readWindowState()

  win = new BrowserWindow({
    width: 1280,
    height: 820,
    ...state.bounds,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    show: false,
    backgroundColor: surfaceColor(state.theme),
    ...(process.platform === 'darwin'
      ? { titleBarStyle: 'hiddenInset' as const, trafficLightPosition: TRAFFIC_LIGHTS }
      : { icon: join(__dirname, '../icon.png') }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      partition: PARTITION,
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: true,
      additionalArguments: [
        `--tds-desktop-version=${app.getVersion()}`,
        `--tds-app-build=${opts.appBuild ?? ''}`,
        `--tds-titlebar-inset=${TITLEBAR_INSET}`,
        `--tds-titlebar-left=${TITLEBAR_LEFT}`,
      ],
    },
  })
  const wc = win.webContents

  const show = () => {
    if (!win || win.isDestroyed() || win.isVisible()) return
    win.show()
    mark('shown')
  }
  win.once('ready-to-show', () => { mark('ready-to-show'); show() })
  wc.once('did-finish-load', show)
  setTimeout(show, SHOW_FALLBACK_MS)
  if (timing) {
    wc.once('did-start-loading', () => mark('navigation started'))
    wc.once('dom-ready', () => mark('dom-ready'))
    wc.on('console-message', (e) => { if (e.message.startsWith('[boot]')) mark(`renderer ${e.message}`) })
  }
  // Keep the machine running; reopen from the Dock or Windows tray.
  win.on('close', (e) => {
    if (quitting) return
    e.preventDefault()
    if (hideOnClose) {
      win?.hide()
      return
    }
    if (!win || closeDialogOpen) return
    closeDialogOpen = true
    void dialog.showMessageBox(win, {
      type: 'question',
      message: 'Keep Todos running?',
      detail: 'Keep running minimizes the window so local tasks can continue. Quitting stops this computer’s tasks.',
      buttons: ['Keep running', 'Quit Todos', 'Cancel'],
      defaultId: 0,
      cancelId: 2,
    }).then(({ response }) => {
      if (response === 0) win?.minimize()
      if (response === 1) app.quit()
    }).catch((err) => console.warn('[window-close]', err)).finally(() => { closeDialogOpen = false })
  })
  win.on('closed', () => {
    win = null
    loaded = false
  })

  let saveBounds: NodeJS.Timeout | null = null
  const rememberBounds = () => {
    if (saveBounds) clearTimeout(saveBounds)
    saveBounds = setTimeout(() => { if (win && !win.isDestroyed()) writeWindowState({ bounds: win.getNormalBounds() }) }, 300)
  }
  win.on('resize', rememberBounds)
  win.on('move', rememberBounds)
  // Full screen hides the traffic lights; the app stops keeping clear of them.
  win.on('enter-full-screen', () => wc.send(DESKTOP_IPC.fullScreen, true))
  win.on('leave-full-screen', () => wc.send(DESKTOP_IPC.fullScreen, false))

  // window.open / target=_blank: the app's own pages and the sign-in hand-offs replace the window's
  // page; everything else is the system browser's.
  wc.setWindowOpenHandler(({ url }) => {
    if (classify(url, { appOrigin: APP_ORIGIN, isDev: !app.isPackaged }) === 'external') void shell.openExternal(url)
    else void win?.loadURL(url)
    return { action: 'deny' }
  })
  // Top-level navigations are policed only while the page is ours: once handed to a third party
  // (OAuth, Stripe) the flow wanders through hosts we cannot enumerate, and comes back on its own.
  wc.on('will-navigate', (e, url) => {
    if (originOf(wc.getURL()) !== APP_ORIGIN) return
    if (classify(url, { appOrigin: APP_ORIGIN, isDev: !app.isPackaged }) !== 'external') return
    e.preventDefault()
    void shell.openExternal(url)
  })
  // A redirect chain that ends on our origin but off the app (the marketing home after a sign-out,
  // say) is bounced back in.
  wc.on('did-navigate', (_e, url) => {
    if (originOf(url) !== APP_ORIGIN) return
    if (classify(url, { appOrigin: APP_ORIGIN, isDev: !app.isPackaged }) === 'external') void win?.loadURL(APP_URL)
  })

  wc.on('did-finish-load', () => {
    loaded = true
    mark('did-finish-load')
    if (retry) { clearInterval(retry); retry = null }
    if (gate || (offline && wc.getURL().startsWith('file:'))) return
    offline = false
    // A fresh page has no memory of the state the events above announced.
    if (win?.isFullScreen()) wc.send(DESKTOP_IPC.fullScreen, true)
    wc.send(DESKTOP_IPC.backButton, wantsBackButton(wc.getURL(), APP_ORIGIN) && wc.navigationHistory.canGoBack())
    if (pendingHref) {
      if (isAppPath(new URL(pendingHref).pathname)) wc.send(DESKTOP_IPC.navigate, pendingHref)
      pendingHref = null
    }
  })
  // Only the remote mode can fail to load the page (the bundled export is always there); show
  // something and keep trying. -3 is ERR_ABORTED, a navigation superseded by another, not a failure.
  wc.on('did-fail-load', (_e, code, _desc, _url, isMainFrame) => {
    if (!isMainFrame || code === -3) return
    offline = true
    void win?.loadFile(join(__dirname, '../offline.html'))
    if (!retry) retry = setInterval(() => void win?.loadURL(pendingHref ?? APP_URL), OFFLINE_RETRY_MS)
  })
  powerMonitor.on('resume', () => { if (offline) void win?.loadURL(pendingHref ?? APP_URL) })

  if (gate) loadUpdateGate()
  else void win.loadURL(pendingHref ?? APP_URL)
  return win
}

export function showMainWindow(): void {
  if (!initialized) return
  if (!win) {
    createMainWindow({ appBuild: initialAppBuild })
    return
  }
  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
}

// Where a notification click or a tds:// link lands. Before the page is up the href becomes the
// page's own address; afterwards the app routes to it client-side.
export function navigateTo(href: string): void {
  const abs = new URL(href, APP_ORIGIN).toString()
  if (!win) {
    pendingHref = abs
    if (initialized) createMainWindow({ appBuild: initialAppBuild })
    return
  }
  showMainWindow()
  if (gate) {
    pendingHref = abs
    return
  }
  if (!loaded) {
    pendingHref = abs
    void win.loadURL(abs)
    return
  }
  win.webContents.send(DESKTOP_IPC.navigate, abs)
}

// A document the window loads in place of whatever it shows, never routed to inside the app: the
// sign-in return, whose response sets the session cookie and redirects into the app.
export function loadInWindow(href: string): void {
  if (!win) {
    pendingHref = href
    if (initialized) createMainWindow({ appBuild: initialAppBuild })
    return
  }
  showMainWindow()
  if (gate) {
    pendingHref = href
    return
  }
  pendingHref = null
  void win.loadURL(href)
}

export function installWindowIpc(ses: Session): void {
  ipcMain.on(DESKTOP_IPC.openExternal, (e, url: unknown) => {
    if (!fromApp(e) || typeof url !== 'string' || !/^(https?|mailto|tel):/i.test(url)) return
    void shell.openExternal(url)
  })
  // The update page switches these too, from the same controls as the app's login page.
  ipcMain.on(DESKTOP_IPC.theme, (e, theme: unknown) => {
    if (!fromShell(e) || (theme !== 'dark' && theme !== 'light')) return
    writeWindowState({ theme })
    win?.setBackgroundColor(surfaceColor(theme))
  })
  ipcMain.on(DESKTOP_IPC.locale, (e, locale: unknown) => {
    if (!fromShell(e) || !isShellLocale(locale)) return
    void rememberLocale(ses, APP_ORIGIN, locale)
  })
}
