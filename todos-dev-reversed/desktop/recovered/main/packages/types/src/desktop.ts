// The contract between the Electron shell (apps/desktop) and the web app it hosts (apps/app).
//
// A subpath export (`@tds/types/desktop`), not part of the barrel: the two sides share nothing else,
// and neither may depend on the other — apps/app importing from @tds/desktop would make
// .github/scripts/workspace-deps.js count every shell edit as a web change. Types and channel names
// only; no runtime beyond the string table.

import type { ModelProviderApi } from './index'

export const DESKTOP_IPC = {
  // main → renderer: an href the app should route to (notification click, tds:// deep link).
  navigate: 'desktop:navigate',
  // renderer → main
  openExternal: 'desktop:open-external',
  theme: 'desktop:theme',
  // The shell's own update page chose a language; the shell mirrors it where the app mirrors its own.
  locale: 'desktop:locale',
  notify: 'desktop:notify',
  badge: 'desktop:badge',
  // Chromium saw the network come back: whatever the pool still holds was left over from before.
  online: 'desktop:online',
  updateRestart: 'desktop:update-restart',
  updateCheck: 'desktop:update-check',
  updateGetState: 'desktop:update-get-state',
  // main → renderer
  updateState: 'desktop:update-state',
  // The window entered or left macOS full screen, where the traffic lights hide.
  fullScreen: 'desktop:full-screen',
  // The page is off our origin with history behind it (a provider's sign-in): the preload draws a
  // way back, since the window has no chrome of its own.
  backButton: 'desktop:back-button',
  // The build machine the shell runs in-app (main/machine). State is pushed; the rest are invokes.
  machineState: 'desktop:machine:state',
  machineGetState: 'desktop:machine:get-state',
  machineIdentity: 'desktop:machine:identity',
  machineEnroll: 'desktop:machine:enroll',
  machineStart: 'desktop:machine:start',
  machineTakeOver: 'desktop:machine:take-over',
  machineForget: 'desktop:machine:forget',
  machineOpenLogs: 'desktop:machine:open-logs',
  // Import a local folder into a fresh hosted repo (main/localImport). Invokes.
  localImportPick: 'desktop:local-import:pick',
  localImportPush: 'desktop:local-import:push',
  // Probe a custom provider's model listing from the main process, which no CORS rule binds
  // (main/providerDiscoveryIpc). Invoke.
  discoverModels: 'desktop:discover-models',
} as const

// The preload↔page contract version. Bump it when the web starts to depend on new shell behaviour:
// the shell applies a web bundle over the air only while the bundle's `bridge` is at most this, so
// a page never runs against a preload that lacks what it calls (the shell release brings both).
// 2: machine.takeOver.
// 3: localImport.
export const DESKTOP_BRIDGE_VERSION = 3

export type DesktopUpdateState = 'idle' | 'checking' | 'downloading' | 'ready' | 'error'

// The shell moves forward on two channels: a release of the shell itself, applied by a restart,
// and the web bundle alone, applied by a reload. One snapshot covers both; `kind` says which.
export interface DesktopUpdateSnapshot {
  state: DesktopUpdateState
  kind?: 'shell' | 'web'
  // shell: the release version. web: the bundle's appBuild.
  version?: string
  // shell: the feed's `minimumVersion` is above this shell, so the release must be installed before
  // the app runs (main/updater.ts holds the window on dist/update.html at launch).
  forced?: boolean
  // shell, while downloading: whole percent of the release fetched.
  progress?: number
  // The check under way was asked for from the menu, so the page reports it through to its outcome
  // — the up-to-date answer and a failure included. Set until the snapshot that settles it.
  manual?: boolean
  // state `error`: what went wrong, one short line.
  error?: string
}

// desktop-manifest.json: inside every web export (the bundled one, an over-the-air one), and — with
// `bundle` — served by the site at /app/desktop-manifest.json, where the shell learns what is live.
export interface DesktopWebManifest {
  // Entry-chunk hash, the same identity the server stamps on API responses as x-app-build.
  appBuild: string
  exportedAt: string
  bridge: number
  bundle?: { url: string; sha256: string; size: number }
}

export interface DesktopNotification {
  id: string
  title: string
  body: string
  // Absolute or app-relative; the shell hands it back over `navigate` on click.
  href: string
}

// Where this computer stands as a build machine. `external` is the tds CLI daemon holding the pid lock
// in ~/.tds — the shell then only watches, until asked to take the machine over (machine.takeOver,
// or an enroll). `stopped` is a worker the CLI stopped from outside (`tds stop`), which the shell
// leaves alone until asked; `revoked` is the server having removed the machine (the registration
// is cleared, enrolling again starts fresh).
export type DesktopMachineStatus = 'idle' | 'external' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error' | 'revoked'

export interface DesktopMachineState {
  status: DesktopMachineStatus
  // Same stable identity as the CLI, independent of registration.
  deviceId: string
  machineId?: string
  teamId?: string
  // The registered team's name, once the shell has asked the server for it with the machine's own
  // credential; the id stands in until then.
  teamName?: string
  // Set when machine.json names another server than this shell's (a dev shell beside a production
  // tds): the shell neither runs nor overwrites that registration, so the web offers no action.
  foreignHost?: string
  // Steps in flight, from the worker's own count; what gates an update restart.
  running: number
  error?: string
  // The bundled executor's version, as the server sees it in x-tds-version.
  version: string | null
  logPath: string
}

export interface DesktopMachineIdentity {
  deviceId: string
  name: string
  platform: string
  arch: string
}

// What POST /api/machine/enroll returns (EnrollMachineResponse) and the shell writes to machine.json.
export interface DesktopMachineEnroll {
  machineId: string
  teamId: string
  token: string
}

// What the preload exposes as window.__TDS_DESKTOP__. Absent outside the shell.
export interface DesktopBridge {
  platform: 'darwin' | 'win32' | 'linux'
  shellVersion: string
  // Entry-chunk hash of the bundled web export, or null when the shell loads the remote app.
  appBuild: string | null
  // Height in px of the page's top band the shell treats as its title bar — the app's h-11 rows.
  // 0 with a native title bar.
  titleBarInset: number
  openExternal(url: string): void
  onNavigate(cb: (href: string) => void): () => void
  setTheme(theme: 'dark' | 'light'): void
  // For the shell's own pages: the language they were switched to, kept for the next launch.
  setLocale(locale: string): void
  notify(n: DesktopNotification): void
  setBadge(count: number): void
  update: {
    // Where the shell's updater stands right now; `onState` only reports what changes afterwards.
    getState(): Promise<DesktopUpdateSnapshot>
    onState(cb: (s: DesktopUpdateSnapshot) => void): () => void
    // Applies a downloaded shell release. A ready web bundle needs only a reload of the page.
    restart(): void
    check(): void
  }
  machine: {
    getState(): Promise<DesktopMachineState>
    onState(cb: (state: DesktopMachineState) => void): () => void
    identity(): Promise<DesktopMachineIdentity>
    // Writes the credential and runs the machine here; a tds CLI daemon running it is stopped first.
    enroll(r: DesktopMachineEnroll): Promise<void>
    start(): Promise<void>
    // From `external`: stop the tds CLI daemon (as `tds stop` would) and run the machine here on the
    // registration it was using. Bridge 2.
    takeOver(): Promise<void>
    forget(): Promise<void>
    openLogs(): void
  }
  // Bridge 3. Absent on older shells, which the web reads as "not available here".
  localImport?: {
    // Opens the system folder picker; null when the user cancels.
    pick(): Promise<DesktopFolderInspection | null>
    push(r: DesktopImportRequest): Promise<DesktopImportResult>
  }
  // Runs @tds/core's discoverModels in the main process, where a page's CORS rules don't apply, so
  // a local endpoint that answers curl answers here too. Absent on older shells: the web then
  // probes from the page as before, so the bridge version stays.
  discoverModels?(r: DesktopDiscoverRequest): Promise<DesktopDiscoverResult>
}

// @tds/core's discoverModels args, less `headers` (the form has none to send), and its
// DiscoverResult restated: this contract may not depend on core.
export interface DesktopDiscoverRequest {
  api: ModelProviderApi
  baseUrl: string
  apiKey?: string
  authHeader?: boolean
  timeoutMs?: number
}

export interface DesktopDiscoverResult {
  // null: the probe failed (unreachable, non-2xx, not a listing); [] is the endpoint's own answer.
  models: { id: string; label?: string; contextWindow?: number; image?: boolean }[] | null
  unauthorized?: boolean
}

// A folder picked for import into a new hosted repo. `git` only when the folder is itself a repo's
// top level; a folder inside some other repo imports as `plain`.
export interface DesktopFolderInspection {
  dir: string
  name: string
  kind: 'git' | 'plain' | 'empty'
  // null for a plain folder, an unborn repo's HEAD reads as its branch name.
  branch: string | null
  // Only a repo with history can be dirty: an unborn one's files are what the import commits.
  dirty: boolean
  hasCommits: boolean
  // Files git would take, .gitignore respected.
  fileCount: number
  // What the push would carry: the repo's object store once it has history, else the raw size of
  // the files above. Compared against LOCAL_IMPORT_MAX_BYTES before anything is created.
  sizeBytes: number
  // Fetch URLs with any embedded credential stripped.
  remotes: { name: string; url: string }[]
}

// The hosted repo size cap (apps/git-host/main.go maxRepoBytes, enforced on push). Checked up front
// so an oversized folder is refused before a project exists or a byte is uploaded.
export const LOCAL_IMPORT_MAX_BYTES = 2 * 1024 ** 3
// Above this the import still runs, but the screen says it will take a while.
export const LOCAL_IMPORT_LARGE_BYTES = 500 * 1024 ** 2

export interface DesktopImportRequest {
  dir: string
  // Project.repoUrl (no .git suffix, no credential).
  repoUrl: string
  // Short-lived push grant from POST /api/projects/:id/import-grant.
  token: string
  defaultBranch: string
  // Commit identity for a folder whose git has none configured.
  author: { name: string; email: string }
}

export type DesktopImportError = 'dirty' | 'empty' | 'git_missing' | 'too_large' | 'push_failed'

export type DesktopImportResult =
  | { ok: true; remoteName: string }
  | { ok: false; error: DesktopImportError; detail?: string }
