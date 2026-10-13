import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { app, type BrowserWindow } from 'electron'
import { APP_ORIGIN } from '../shared/appUrl'
import { mark, traceBoot } from './boot'
import { installDownloads } from './downloads'
import { installerUrl } from './forcedUpdate'
import { signInReturnHref, toAppHref } from './links'
import { installLocalApp } from './localApp'
import { installLocalImportIpc } from './localImportIpc'
import { shellLocale } from './locale'
import { installMachineIpc, machine } from './machine'
import { prefetchShellEnv } from './machine/worker'
import { installMenu } from './menu'
import { installNotifications } from './notifications'
import { installPermissions } from './permissions'
import { installProviderDiscoveryIpc } from './providerDiscoveryIpc'
import { adoptDefaultSessionCookies, configureSession } from './session'
import { initWebRoots, launchCheck, noteIndexServed, onGate, servedBuild, startUpdater, webRoots } from './updater'
import { createMainWindow, installWindowIpc, leaveUpdateGate, loadInWindow, markQuitting, navigateTo, showMainWindow, showUpdateGate } from './window'

// Todos desktop: a window on the web app, with the app's own files bundled and served in place of
// the network copy (main/localApp.ts) — moved forward over the air as the site deploys, while the
// shell itself moves by release (main/updater.ts) — and the build machine run in-process
// (main/machine).

// The bundled export is what a packaged app serves; a dev build takes the dev server unless asked to
// prove the local path (TDS_DESKTOP_LOCAL_APP=1 after `pnpm stage:app`). TDS_DESKTOP_LOCAL_APP=0 makes
// a packaged app load the remote copy instead, for telling the two apart when something is off.
const LOCAL_APP = app.isPackaged ? process.env.TDS_DESKTOP_LOCAL_APP !== '0' : process.env.TDS_DESKTOP_LOCAL_APP === '1'

// The machine's launch — the login shell, a Node process loading the executor — stays out from
// under the page's first paint: it waits for the window to show and a beat after, or for a
// ceiling should the window never show (a load that hangs, a sign-in on the network).
const MACHINE_START_DELAY_MS = 2_000
const MACHINE_START_MAX_MS = 10_000
// A quit waits for the worker to shut down on its own terms, but not past this: the app leaves
// regardless, and the process takes the worker with it.
const QUIT_GRACE_MS = 5_000

mark('main evaluated')

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function windowIdle(win: BrowserWindow): Promise<void> {
  const shown = new Promise<void>((resolve) => (win.isVisible() ? resolve() : win.once('show', () => resolve())))
  void shown.then(() => prefetchShellEnv())
  return Promise.race([shown.then(() => delay(MACHINE_START_DELAY_MS)), delay(MACHINE_START_MAX_MS)])
}

function localAppRoot(): string {
  return app.isPackaged ? join(process.resourcesPath, 'app') : join(app.getAppPath(), 'stage/app')
}

function handleUrl(url: string): void {
  const signIn = signInReturnHref(url, APP_ORIGIN)
  if (signIn) {
    loadInWindow(signIn)
    return
  }
  const href = toAppHref(url, APP_ORIGIN)
  if (href) navigateTo(href)
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  if (process.platform === 'win32') {
    app.setAppUserModelId('dev.todos.desktop')
  }
  if (process.platform !== 'darwin') {
    const url = process.argv.find((a) => a.startsWith('tds://'))
    if (url) handleUrl(url)
  }
  // Registered before `ready`: macOS delivers a launching URL early, and a second launch with one
  // reaches the running instance as argv.
  app.on('open-url', (e, url) => {
    e.preventDefault()
    handleUrl(url)
  })
  app.on('second-instance', (_e, argv) => {
    const url = argv.find((a) => a.startsWith('tds://'))
    if (url) handleUrl(url)
    else showMainWindow()
  })
  app.on('activate', () => showMainWindow())
  // Stay in the Dock with no window, as macOS apps do.
  app.on('window-all-closed', () => {})

  let stopping = false
  app.on('before-quit', (e) => {
    markQuitting()
    mark(stopping ? 'before-quit again' : 'before-quit')
    if (stopping) return
    stopping = true
    e.preventDefault()
    const stopAt = Date.now()
    void Promise.race([machine.stop(), delay(QUIT_GRACE_MS)]).finally(() => {
      mark(`machine stopped ${Date.now() - stopAt}ms`)
      app.quit()
    })
  })
  app.on('will-quit', () => mark('will-quit'))

  void app.whenReady().then(async () => {
    mark('ready')
    if (process.env.TDS_DESKTOP_TRACE === '1') void traceBoot()
    if (app.isPackaged) {
      app.setAsDefaultProtocolClient('tds')
      // Squirrel.Mac cannot update an app on a read-only volume; offer the move once.
      if (process.platform === 'darwin' && app.getAppPath().startsWith('/Volumes/')) app.moveToApplicationsFolder()
    }

    const ses = configureSession()
    // The default jar's cookies move before the locale is read from the window's; neither holds
    // anything else up.
    const localeP = adoptDefaultSessionCookies(ses, APP_ORIGIN).then(() => shellLocale(ses, APP_ORIGIN, app.getLocale()))
    const bundledRoot = localAppRoot()
    const local = LOCAL_APP && existsSync(join(bundledRoot, 'index.html'))
    if (local) {
      initWebRoots({ bundledRoot, webDir: join(app.getPath('userData'), 'web') })
      installLocalApp(ses, { roots: webRoots, appOrigin: APP_ORIGIN, onIndex: noteIndexServed })
    }
    installPermissions(ses, APP_ORIGIN)
    installDownloads(ses)
    installWindowIpc(ses)
    installMachineIpc()
    installLocalImportIpc()
    installProviderDiscoveryIpc()
    installNotifications()

    startUpdater({ canRestart: () => machine.canRestart(), web: local })
    const locale = await localeP
    mark('cookies+locale')

    // The window opens on the app without waiting for the feed. A release the feed requires puts
    // the update page over it whenever the answer comes (main/updater.ts, the gate), and the
    // machine waits for that answer — a build must not start under a shell about to restart.
    const win = createMainWindow({ appBuild: local ? servedBuild() : null })
    mark('window created')
    installMenu()
    const idle = windowIdle(win)
    let machineStarted = false
    const startMachine = () => {
      if (machineStarted) return
      machineStarted = true
      machine.start({ after: idle })
    }
    onGate((open) => {
      if (open) {
        showUpdateGate(installerUrl(process.platform, process.arch), locale)
        return
      }
      leaveUpdateGate()
      startMachine()
    })
    void launchCheck().then((gated) => {
      mark(`launch check gated=${gated}`)
      if (!gated) startMachine()
    })
  })
}
