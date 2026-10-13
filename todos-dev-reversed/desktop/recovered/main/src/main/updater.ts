import { mkdirSync, renameSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { Readable } from 'node:stream'
import type { ReadableStream as NodeReadableStream } from 'node:stream/web'
import { app, dialog, ipcMain, net, autoUpdater as nativeUpdater } from 'electron'
import { autoUpdater, type CancellationToken, type ProgressInfo } from 'electron-updater'
import { DESKTOP_BRIDGE_VERSION, DESKTOP_IPC, type DesktopUpdateSnapshot, type DesktopUpdateState, type DesktopWebManifest } from '@tds/types/desktop'
import { APP_ORIGIN, APP_URL, isAppPath } from '../shared/appUrl'
import { requiresUpdate } from './forcedUpdate'
import { fromApp, fromShell } from './ipc'
import { downloadResumable } from './resumableDownload'
import { extractBundle, isNewerExport, isValidBundleDir, parseManifest, readManifest, selectStartupRoot, storeVerified, writeCurrent } from './webBundle'
import { getMainWindow, markQuitting } from './window'

// How the app moves forward, on two channels behind one state.
//
// The shell — Electron, the preload, the bundled executor — comes from the generic feed in
// electron-builder.yml (a platform-specific manifest on assets.todos.dev) through electron-updater and installs on
// a restart. The web bundle alone comes over the air: the site publishes every export as a tarball
// (scripts/pack-desktop-web.mjs) and names the live one in /app/desktop-manifest.json; the shell
// downloads it into userData/web, verifies it, and serves it in place of the bundled export
// (main/webBundle.ts) — a reload of the page is all it takes. The page noticing the server has moved
// past it only nudges a check here (apps/app/components/StaleBuildNotice.tsx); what it announces
// is a downloaded shell release (restart) or a switched web bundle (reload).
//
// A shell release the feed requires — its manifest's `minimumVersion` above this shell — is not
// offered but imposed: the launch check puts the window on the update page until the release is
// installed (the gate, below).
//
// A release file that has to come whole — a first update has no earlier one to diff against — is
// some 200MB, and electron-updater starts it over from byte 0 on any failure. Its transport is
// replaced with one that keeps what arrived and asks for the rest (resumeFullDownloads).
//
// Only a packaged app has a feed or a manifest to read. TDS_DESKTOP_UPDATE_URL and
// TDS_DESKTOP_WEB_MANIFEST_URL point a dev build at local servers to exercise either flow (the
// shell's download also needs dev-app-update.yml beside package.json, for its cache directory);
// Squirrel.Mac still insists on a signed app on both ends.

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000
const FIRST_CHECK_MS = 10_000
// How long a launch waits for the feed's answer before the machine starts regardless.
const LAUNCH_WAIT_MS = 3_000
const INSTALL_RETRY_MS = 2_000
// A page's nudge (it saw the server move past it) waits out the launch: the download and unpack
// would otherwise land on the main process while it relays the page's own first requests.
const BOOT_QUIET_MS = 8_000
// A failed check or download tries again on these delays before leaving it to CHECK_INTERVAL_MS: a
// dropped connection otherwise waits hours, and a gated shell sits on the error until a click.
const RETRY_MS = [30_000, 2 * 60_000, 10 * 60_000, 30 * 60_000]

function backoff(run: () => void): { failed: () => void; reset: () => void } {
  let attempt = 0
  let timer: NodeJS.Timeout | null = null
  return {
    failed() {
      if (timer || attempt >= RETRY_MS.length) return
      timer = setTimeout(() => {
        timer = null
        run()
      }, RETRY_MS[attempt++])
    },
    reset() { attempt = 0 },
  }
}

type Channel = { state: DesktopUpdateState; version?: string; forced?: boolean; progress?: number; error?: string }
const RANK: Record<DesktopUpdateState, number> = { idle: 0, error: 0, checking: 1, downloading: 2, ready: 3 }

let shell: Channel = { state: 'idle' }
let web: Channel = { state: 'idle' }
let snapshot: DesktopUpdateSnapshot = { state: 'idle' }
// A check from the menu, reported to the page until both channels have settled.
let manual = false
const listeners = new Set<(s: DesktopUpdateSnapshot) => void>()

// One picture of both channels: whichever is further along, the shell on a tie — a ready release
// outranks a ready bundle, since the restart brings the bundled web along. An error shows only
// while the other channel has nothing to say.
function project(): DesktopUpdateSnapshot {
  const lead: DesktopUpdateSnapshot = RANK[web.state] > RANK[shell.state] ? { ...web, kind: 'web' } : { ...shell, kind: 'shell' }
  const next: DesktopUpdateSnapshot = RANK[lead.state] > 0
    ? { ...lead, error: undefined }
    : shell.state === 'error' || web.state === 'error'
      ? { state: 'error', error: shell.error ?? web.error }
      : { state: 'idle' }
  return manual ? { ...next, manual } : next
}

function emit(): void {
  const next = project()
  const same = next.state === snapshot.state && next.kind === snapshot.kind && next.version === snapshot.version && next.forced === snapshot.forced
  if (same && next.progress === snapshot.progress && next.manual === snapshot.manual && next.error === snapshot.error) return
  snapshot = next
  // Progress alone is the page's to draw; the menu has nothing to rebuild for it.
  if (!same) for (const l of listeners) l(next)
  getMainWindow()?.webContents.send(DESKTOP_IPC.updateState, next)
  // The settling snapshot is the menu check's last word; a page loaded later is not to repeat it.
  if (manual && (RANK[next.state] === 0 || next.state === 'ready')) {
    manual = false
    snapshot = { ...snapshot, manual: undefined }
  }
}

function setShell(state: DesktopUpdateState, patch: Omit<Channel, 'state'> = {}): void {
  shell = { ...shell, error: undefined, ...patch, state }
  if (state === 'error') shellRetry.failed()
  else if (state === 'idle' || state === 'ready') shellRetry.reset()
  emit()
  reconcileGate()
}

function setWeb(state: DesktopUpdateState, version?: string, error?: string): void {
  web = { state, version: version ?? web.version, error }
  emit()
}

// electron-updater's messages can run to a response body and a stack; the page shows one line.
function describe(err: unknown): string | undefined {
  const line = (err instanceof Error ? err.message : typeof err === 'string' ? err : '').split('\n')[0].trim()
  if (!line) return undefined
  return line.length > 160 ? `${line.slice(0, 157)}…` : line
}

export function updateState(): DesktopUpdateSnapshot {
  return snapshot
}

export function onUpdateState(l: (s: DesktopUpdateSnapshot) => void): () => void {
  listeners.add(l)
  return () => { listeners.delete(l) }
}

// `manual`: asked for from the menu, so the page reports the check through to its outcome. With no
// channel to check, that outcome is the settled snapshot sent straight away.
export function checkForUpdates(opts: { manual?: boolean } = {}): void {
  if (opts.manual) manual = true
  void checkForShellUpdate()
  checkForWebUpdate()
  if (opts.manual) emit()
}

// A page off the app (/login) reloads to the same network page and never asks for the new index,
// so it is sent to the app instead.
export function reloadToUpdate(): void {
  const wc = getMainWindow()?.webContents
  if (!wc) return
  if (isAppPath(new URL(wc.getURL()).pathname)) wc.reload()
  else void wc.loadURL(APP_URL)
}

// --- the shell -----------------------------------------------------------------------------------

let shellEnabled = false
const shellRetry = backoff(() => void checkForShellUpdate())
let canRestart: () => boolean = () => true

function checkForShellUpdate(): Promise<void> {
  if (!shellEnabled || shell.state === 'checking' || shell.state === 'downloading') return Promise.resolve()
  // Said before the feed's own event, which comes a tick later: a menu check must not read as
  // settled in between.
  setShell('checking', { progress: undefined })
  return autoUpdater.checkForUpdates().then(
    // A failed download is announced as `error` already; the promise must not go unhandled too.
    (r) => {
      r?.downloadPromise?.catch(() => {})
      // Null when the updater declines to check at all, and then no event settles the channel.
      if (!r && shell.state === 'checking') setShell('idle')
    },
    (err: unknown) => setShell('error', { error: describe(err) }),
  )
}

export function restartToUpdate(): void {
  if (shell.state !== 'ready') return
  if (!canRestart()) {
    void dialog.showMessageBox({
      type: 'info',
      message: 'A build is running on this computer.',
      detail: 'The update installs the next time Todos quits.',
    })
    return
  }
  autoUpdater.quitAndInstall()
}

type FullDownload = (url: URL, destination: string, options: {
  headers?: Record<string, string> | null
  sha512?: string | null
  cancellationToken: CancellationToken
  onProgress?: (p: ProgressInfo) => void
}) => Promise<string>

// Beside the updater's pending directory, which it empties whenever a download fails.
const partialDir = (pendingFile: string): string => join(dirname(pendingFile), '..', 'partial')

// On every platform the updater fetches a whole release file through its executor's `download` —
// the zip, the NSIS installer or the AppImage, straight away or after a differential download that
// failed. The member is internal to electron-updater: without it the stock download stays.
function resumeFullDownloads(): void {
  const executor = (autoUpdater as unknown as { httpExecutor?: { download?: FullDownload } }).httpExecutor
  const stock = executor?.download?.bind(executor)
  if (!executor || !stock) {
    console.warn('[update] electron-updater has no executor to resume downloads through')
    return
  }
  executor.download = (url, destination, options) => {
    const sha512 = options.sha512
    if (!sha512) return stock(url, destination, options)
    return options.cancellationToken.createPromise<string>((resolve, reject, onCancel) => {
      const abort = new AbortController()
      onCancel(() => abort.abort())
      downloadResumable({
        url: url.href,
        dest: destination,
        dir: partialDir(destination),
        sha512,
        headers: options.headers ?? undefined,
        signal: abort.signal,
        onProgress: options.onProgress,
        fetch: (u, init) => net.fetch(u, { ...init, bypassCustomProtocolHandlers: true, cache: 'no-store' }),
      }).then(() => resolve(destination), reject)
    })
  }
}

// A release that came down another way (differentially) leaves a partial nothing will finish.
function dropPartial(downloadedFile: string): void {
  try {
    rmSync(partialDir(downloadedFile), { recursive: true, force: true })
  } catch (err) {
    console.warn('[update] could not remove the partial download', err)
  }
}

function startShellChannel(): boolean {
  const devUrl = process.env.TDS_DESKTOP_UPDATE_URL
  if (process.platform === 'linux' && !process.env.APPIMAGE && !devUrl) return false
  if (!app.isPackaged && !devUrl) return false
  if (devUrl) {
    autoUpdater.forceDevUpdateConfig = true
    autoUpdater.setFeedURL({ provider: 'generic', url: devUrl })
  }
  resumeFullDownloads()
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowPrerelease = false
  autoUpdater.on('checking-for-update', () => setShell('checking', { progress: undefined }))
  autoUpdater.on('update-available', (info) => setShell('downloading', { version: info.version, forced: requiresUpdate(app.getVersion(), info), progress: 0 }))
  autoUpdater.on('download-progress', (p) => setShell('downloading', { progress: Math.floor(p.percent) }))
  autoUpdater.on('update-not-available', () => setShell('idle', { forced: false }))
  autoUpdater.on('update-downloaded', (info) => {
    dropPartial(info.downloadedFile)
    setShell('ready', { version: info.version, progress: 100 })
  })
  autoUpdater.on('error', (err) => setShell('error', { error: describe(err) }))
  // Squirrel.Mac installs by closing every window and quitting once none is left, before any
  // `before-quit`. Unless the window knows the app is quitting it hides instead of closing, and the
  // shell then sits there windowless with the release never installed.
  nativeUpdater.on('before-quit-for-update', markQuitting)
  return true
}

// --- the gate ------------------------------------------------------------------------------------
//
// A release the feed requires (`minimumVersion` in the update manifest, which scripts/dist.mjs
// stamps from package.json) holds the app back: the window shows the update page (window.ts,
// showUpdateGate) with the download's progress, the release installs the moment it is down, and
// the machine stays off under a shell about to restart. Only the launch check opens the gate — over
// whatever the window shows by the time the feed answers; a release the feed starts requiring
// mid-session downloads as any other and installs on quit. The feed no longer requiring one (the
// minimum lowered, a check that finds nothing) lets the app in.

let gated = false
let launching = false
let installTimer: NodeJS.Timeout | null = null
const gateListeners = new Set<(open: boolean) => void>()

export function onGate(l: (open: boolean) => void): () => void {
  gateListeners.add(l)
  return () => { gateListeners.delete(l) }
}

function setGate(open: boolean): void {
  if (gated === open) return
  gated = open
  for (const l of gateListeners) l(open)
}

function reconcileGate(): void {
  if (shell.state === 'idle' || (shell.state === 'downloading' && !shell.forced)) setGate(false)
  else if (shell.state === 'downloading' && shell.forced && launching) setGate(true)
  else if (shell.state === 'ready' && gated) installWhenIdle()
}

// Quit into the install once no build runs here; a running one is looked in on until it is done.
function installWhenIdle(): void {
  if (installTimer) return
  if (canRestart()) {
    autoUpdater.quitAndInstall()
    return
  }
  installTimer = setTimeout(() => {
    installTimer = null
    if (gated && shell.state === 'ready') installWhenIdle()
  }, INSTALL_RETRY_MS)
}

// The first check of a launch: whether the app is held back, answered within LAUNCH_WAIT_MS. A
// slow feed answers no, and the gate still closes over the page should the real answer come back
// forced. False without a feed.
export function launchCheck(): Promise<boolean> {
  if (!shellEnabled) return Promise.resolve(false)
  launching = true
  const answer = checkForShellUpdate().finally(() => { launching = false })
  return Promise.race([answer, new Promise<void>((resolve) => setTimeout(resolve, LAUNCH_WAIT_MS))]).then(() => gated)
}

// --- the web bundle ------------------------------------------------------------------------------

interface WebRoot {
  dir: string
  build: string | null
}

let bundled: WebRoot = { dir: '', build: null }
let bundledExportedAt: string | undefined
// What localApp serves, newest first; the bundled export is always last. A replaced bundle stays
// until the next launch: the page still running it keeps loading its chunks.
let roots: WebRoot[] = []
let webDir = ''
// The build of the document last served, which is what a `ready` bundle is measured against.
let pageBuild: string | null = null
let manifest: { url: string; allowInsecure: boolean } | null = null
let inFlight = false
let warnedMissing = false
const webRetry = backoff(checkForWebUpdate)

export function initWebRoots(opts: { bundledRoot: string; webDir: string }): void {
  webDir = opts.webDir
  const bundledManifest = readManifest(opts.bundledRoot)
  bundled = { dir: opts.bundledRoot, build: bundledManifest?.appBuild ?? null }
  bundledExportedAt = bundledManifest?.exportedAt
  const { active, remove } = selectStartupRoot(webDir, { bundledBuild: bundled.build, bundledExportedAt, bridge: DESKTOP_BRIDGE_VERSION })
  for (const p of remove) {
    try {
      rmSync(p, { recursive: true, force: true })
    } catch (err) {
      console.warn('[web-update] could not remove', p, err)
    }
  }
  roots = active ? [{ dir: join(webDir, active), build: active }, bundled] : [bundled]
}

export const webRoots = (): string[] => roots.map((r) => r.dir)

export const servedBuild = (): string | null => roots[0]?.build ?? null

export function noteIndexServed(): void {
  pageBuild = servedBuild()
  if (web.state === 'ready') setWeb('idle')
}

// Not while gated: the required release brings its own bundled web, newer than anything fetched now.
function checkForWebUpdate(): void {
  if (!manifest || inFlight || gated) return
  inFlight = true
  void applyWebUpdate(manifest)
    .then(() => webRetry.reset(), (err: unknown) => {
      console.warn('[web-update]', err)
      setWeb('error', undefined, describe(err))
      webRetry.failed()
    })
    .finally(() => { inFlight = false })
}

// Nothing new to fetch: `ready` while the page is still on an older build than the one served.
function settle(): void {
  const active = servedBuild()
  setWeb(pageBuild && pageBuild !== active ? 'ready' : 'idle', active ?? undefined)
}

async function applyWebUpdate(src: { url: string; allowInsecure: boolean }): Promise<void> {
  setWeb('checking')
  // Bypass the shell's own handler, or a packaged app would read its bundled manifest back.
  const res = await net.fetch(src.url, { bypassCustomProtocolHandlers: true, cache: 'no-store' })
  const m = res.ok ? parseManifest(await res.json().catch(() => null), { allowInsecure: src.allowInsecure }) : null
  if (!m?.bundle) {
    // Not published (a 404, or the SPA shell in its place): said once.
    if (!res.ok && res.status !== 404) throw new Error(`manifest ${res.status}`)
    if (!warnedMissing) {
      warnedMissing = true
      console.warn(`[web-update] no manifest at ${src.url}`)
    }
    settle()
    return
  }
  if (m.appBuild === servedBuild()) {
    settle()
    return
  }
  if (m.bridge > DESKTOP_BRIDGE_VERSION) {
    console.warn(`[web-update] build ${m.appBuild} needs bridge ${m.bridge}, this shell has ${DESKTOP_BRIDGE_VERSION}`)
    settle()
    return
  }
  if (m.appBuild === bundled.build) {
    activate(bundled)
    return
  }
  if (!isNewerExport(m.exportedAt, bundledExportedAt)) {
    settle()
    return
  }
  const dir = join(webDir, m.appBuild)
  if (!isValidBundleDir(dir, m.appBuild, DESKTOP_BRIDGE_VERSION)) {
    setWeb('downloading', m.appBuild)
    await download(m.bundle, m.appBuild, dir)
  }
  activate({ dir, build: m.appBuild })
}

async function download(bundle: NonNullable<DesktopWebManifest['bundle']>, appBuild: string, dir: string): Promise<void> {
  const partial = `${dir}.partial`
  const tgz = `${partial}.tgz`
  const clean = () => {
    rmSync(partial, { recursive: true, force: true })
    rmSync(tgz, { force: true })
  }
  clean()
  try {
    const res = await net.fetch(bundle.url, { bypassCustomProtocolHandlers: true, cache: 'no-store' })
    if (!res.ok || !res.body) throw new Error(`bundle ${res.status}`)
    const length = Number(res.headers.get('content-length'))
    if (length && length !== bundle.size) throw new Error(`bundle is ${length} bytes, manifest says ${bundle.size}`)
    mkdirSync(webDir, { recursive: true })
    await storeVerified(Readable.fromWeb(res.body as unknown as NodeReadableStream), tgz, bundle)
    await extractBundle(tgz, partial)
    if (!isValidBundleDir(partial, appBuild, DESKTOP_BRIDGE_VERSION)) throw new Error(`bundle ${appBuild} does not unpack to that build`)
    rmSync(dir, { recursive: true, force: true })
    renameSync(partial, dir)
    rmSync(tgz, { force: true })
  } catch (err) {
    clean()
    throw err
  }
}

function activate(entry: WebRoot): void {
  writeCurrent(webDir, entry === bundled ? null : entry.build)
  roots = [entry, ...roots.filter((r) => r.dir !== entry.dir)]
  setWeb('ready', entry.build ?? undefined)
}

// --- wiring ----------------------------------------------------------------------------------------

let bootAt = 0
let nudge: NodeJS.Timeout | null = null

function nudgeCheck(): void {
  if (nudge) return
  nudge = setTimeout(() => {
    nudge = null
    checkForUpdates()
  }, Math.max(0, BOOT_QUIET_MS - (Date.now() - bootAt)))
}

// `web` is whether the shell serves the export itself (main/index.ts): only then is there a root to
// move forward. The shell's first check is the launch's (launchCheck); the web bundle's follows
// the page.
export function startUpdater(opts: { canRestart: () => boolean; web: boolean }): void {
  canRestart = opts.canRestart
  bootAt = Date.now()
  // Answered even without a feed: a dev shell's page asks too, and an unhandled invoke rejects.
  ipcMain.handle(DESKTOP_IPC.updateGetState, (e): DesktopUpdateSnapshot => (fromShell(e) ? snapshot : { state: 'idle' }))
  // The update page's retry is the user's own click; the app's nudge can wait.
  ipcMain.on(DESKTOP_IPC.updateCheck, (e) => {
    if (fromApp(e)) nudgeCheck()
    else if (fromShell(e)) checkForUpdates()
  })
  ipcMain.on(DESKTOP_IPC.updateRestart, (e) => { if (fromApp(e)) restartToUpdate() })

  shellEnabled = startShellChannel()
  const devManifest = process.env.TDS_DESKTOP_WEB_MANIFEST_URL
  if (opts.web && (app.isPackaged || devManifest)) {
    manifest = { url: devManifest ?? `${APP_ORIGIN}/app/desktop-manifest.json`, allowInsecure: !!devManifest }
  }
  if (!shellEnabled && !manifest) return
  setTimeout(checkForWebUpdate, FIRST_CHECK_MS)
  setInterval(() => checkForUpdates(), CHECK_INTERVAL_MS)
}
