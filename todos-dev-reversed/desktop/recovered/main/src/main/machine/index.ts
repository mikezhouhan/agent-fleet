import { hostname } from 'node:os'
import { ipcMain, shell } from 'electron'
import { DESKTOP_IPC, type DesktopMachineEnroll, type DesktopMachineIdentity, type DesktopMachineState, type DesktopMachineStatus } from '@tds/types/desktop'
import { boundedFetch } from '../../../../executor/src/lib/boundedFetch'
import { INITIAL_BACKOFF_MS, isAlive, readDaemon, restartDecision, stopDaemon } from '../../../../executor/src/lib/daemon'
import { getDeviceId } from '../../../../executor/src/lib/deviceId'
import { clearConfig, loadConfig, saveConfig } from '../../../../executor/src/lib/machineConfig'
import { TIMEOUTS_MS } from '../../../../executor/src/lib/timeouts'
import { APP_ORIGIN } from '../../shared/appUrl'
import { mark } from '../boot'
import { fromApp } from '../ipc'
import { getMainWindow } from '../window'
import { forkWorker, logPath, machineVersion, type WorkerHandle } from './worker'

// This computer as a build machine, sharing ~/.tds with the tds CLI: the same registration, worktrees and
// pid lock. Whoever holds the lock runs the machine — the CLI daemon if it is up when the app starts
// (`external`), otherwise this shell. The CLI is never pushed aside on the shell's own initiative:
// only the user's click (takeOver, or an enroll) stops it and runs the machine here. A worker the
// CLI stopped from outside stays `stopped` for the rest of this app run rather than being snatched
// back; the next launch takes over again.

const FAST_FAIL_WINDOW_MS = 60_000
const FAST_FAIL_LIMIT = 5
const WATCH_MS = 5000

let status: DesktopMachineStatus = 'idle'
let error: string | undefined
let running = 0
let worker: WorkerHandle | null = null
let backoff = INITIAL_BACKOFF_MS
let quickExits = 0
let restartTimer: NodeJS.Timeout | null = null
// A start the shell asked to hold (machine.start's `after`); a stop meanwhile cancels it.
let pendingStart: object | null = null
const listeners = new Set<(s: DesktopMachineState) => void>()
// The registered team's name, asked of the server that registered the machine (machine.json's
// serverUrl, another server's included) with the machine's own credential: machine.json holds only
// the id, and the web cannot name a team the signed-in user is not a member of. One lookup per
// team id, asked again after a while when it brought nothing.
let team: { id: string; name?: string; askedAt: number } | null = null
const TEAM_NAME_RETRY_MS = 60_000

function state(): DesktopMachineState {
  const config = loadConfig()
  return {
    status,
    deviceId: getDeviceId(),
    machineId: config?.machineId,
    teamId: config?.teamId,
    teamName: config && team?.id === config.teamId ? team.name : undefined,
    foreignHost: foreignServer() ?? undefined,
    running,
    error,
    version: machineVersion(),
    logPath: logPath(),
  }
}

function emit(): void {
  const s = state()
  for (const l of listeners) l(s)
  getMainWindow()?.webContents.send(DESKTOP_IPC.machineState, s)
}

function set(next: DesktopMachineStatus, err?: string): void {
  status = next
  error = err
  if (next !== 'running' && next !== 'stopping') running = 0
  emit()
}

// Whether a supervisor other than ours (the tds CLI) holds the pid lock.
function externalDaemon(): boolean {
  const d = readDaemon()
  return !!d && d.pid !== worker?.pid && isAlive(d.pid)
}

// The resting state once nothing runs: registered but stopped, or nothing to run at all.
const restingStatus = (): DesktopMachineStatus => (loadConfig() ? 'stopped' : 'idle')

// A registration the CLI made against another server (a dev shell on a Mac whose tds talks to
// todos.dev, or the reverse) is not ours to run or overwrite: the machine would come online on
// the wrong server with this build, and enrolling would cut the CLI off from its own.
function foreignServer(): string | null {
  const url = loadConfig()?.serverUrl
  if (!url) return null
  try {
    const host = new URL(url).hostname
    return host === new URL(APP_ORIGIN).hostname ? null : host
  } catch {
    return url
  }
}

// A plain bounded fetch, not serverRequest: that stamps x-tds-version, which the server records as
// the machine's CLI version — and this process is the shell, not the worker.
function resolveTeamName(): void {
  const config = loadConfig()
  if (!config) return
  if (team?.id === config.teamId && (team.name || Date.now() - team.askedAt < TEAM_NAME_RETRY_MS)) return
  const asked = { id: config.teamId, askedAt: Date.now() }
  team = asked
  void boundedFetch(`${config.serverUrl}/api/machine/me`, TIMEOUTS_MS.statusProbe, { headers: { Authorization: `Bearer ${config.token}` } })
    .then(async (res) => {
      if (!res.ok) return
      const me = await res.json() as { teamId?: string; teamName?: string | null }
      // A registration that changed meanwhile has its own lookup in flight.
      if (team !== asked || me.teamId !== asked.id || !me.teamName) return
      team = { ...asked, name: me.teamName }
      emit()
    })
    .catch(() => { /* offline: the id stands in until the next look */ })
}

async function launch(): Promise<void> {
  set('starting')
  mark('machine start')
  const startedAt = Date.now()
  let handle: WorkerHandle
  try {
    handle = await forkWorker((m) => {
      if (m.type === 'ready') set('running')
      else if (m.type === 'load' && m.running !== running) { running = m.running; emit() }
    })
  } catch (e) {
    set('error', e instanceof Error ? e.message : String(e))
    return
  }
  worker = handle
  const code = await handle.exited
  // Electron's exit report can trail the real exit (see WorkerHandle.exited); by then a stop may
  // already have started the next worker.
  if (worker === handle) worker = null
  onExit(handle, code, Date.now() - startedAt)
}

function onExit(handle: WorkerHandle, code: number, uptimeMs: number): void {
  // Our own stop: whoever asked sets the state that follows.
  if (handle.stopRequested) return
  // A clean exit we did not ask for is `tds stop` or `tds logout` — the user's call, leave it.
  if (code === 0) { set(restingStatus()); return }
  const next = restartDecision(code, uptimeMs, backoff)
  if (next.kind === 'terminal') { clearConfig(); set('revoked'); return }
  quickExits = uptimeMs < FAST_FAIL_WINDOW_MS ? quickExits + 1 : 0
  if (quickExits >= FAST_FAIL_LIMIT) {
    quickExits = 0
    set('error', handle.stderrTail() || `worker exited with code ${code}`)
    return
  }
  backoff = next.nextBackoffMs
  set('starting')
  restartTimer = setTimeout(() => { restartTimer = null; void launch() }, next.delayMs)
}

// Whenever no worker of ours runs, the truth is in ~/.tds: the CLI may have started (`tds start`
// from a terminal), stopped, or registered since we last looked. Cheap — a pid file and kill -0.
function refresh(): void {
  resolveTeamName()
  if (status === 'starting' || status === 'running' || status === 'stopping') return
  if (externalDaemon()) { if (status !== 'external') set('external'); return }
  if (status === 'external' || status === 'idle' || status === 'stopped') {
    const next = restingStatus()
    if (next !== status) set(next)
  }
}

function startNow(): void {
  if (externalDaemon()) { set('external'); return }
  if (!loadConfig()) { set('idle'); return }
  // The state's foreignHost says why it stays idle.
  if (foreignServer()) { set('idle'); return }
  backoff = INITIAL_BACKOFF_MS
  quickExits = 0
  void launch()
}

async function stop(): Promise<void> {
  if (pendingStart) { pendingStart = null; set(restingStatus()) }
  if (restartTimer) { clearTimeout(restartTimer); restartTimer = null }
  const handle = worker
  if (!handle) return
  handle.stopRequested = true
  set('stopping')
  await handle.stop()
  if (worker === handle) worker = null
}

// Whoever runs the machine now stops: our own worker, or the CLI daemon the way `tds stop` would
// (SIGTERM, a grace period, then SIGKILL). The pid lock is free afterwards, so the start that
// follows is ours.
async function stopWhoeverRuns(): Promise<void> {
  await stop()
  if (!externalDaemon()) return
  set('stopping')
  await stopDaemon()
}

export const machine = {
  // `after` holds the launch itself (the login shell, a Node process loading the executor) while
  // the card already reads Starting…; the checks run again once the wait is over.
  start(opts: { after?: Promise<void> } = {}): void {
    if (!opts.after) { startNow(); return }
    if (externalDaemon()) { set('external'); return }
    if (!loadConfig() || foreignServer()) { set('idle'); return }
    set('starting')
    const token = {}
    pendingStart = token
    void opts.after.then(() => {
      if (pendingStart !== token) return
      pendingStart = null
      startNow()
    })
  },
  stop,
  canRestart(): boolean {
    return running === 0
  },
  state,
  onState(l: (s: DesktopMachineState) => void): () => void {
    listeners.add(l)
    return () => { listeners.delete(l) }
  },
  // An enroll starts here, before the web calls the server — which rotates the machine's token,
  // cutting off whoever runs it now. A registration on another server makes that a doomed enroll,
  // refused at this step rather than after; a CLI daemon running it does not — the enroll takes
  // the machine over.
  identity(): DesktopMachineIdentity {
    refresh()
    if (foreignServer()) throw new Error('foreign_server')
    return { deviceId: getDeviceId(), name: hostname(), platform: process.platform, arch: process.arch }
  },
  // A fresh credential from the web's enroll route: written the way `tds start` writes it, then run.
  // A CLI daemon running the machine is stopped first — the rotated token has cut it off anyway.
  // Refusals travel as codes the web localizes (hooks/useDesktopMachine.ts).
  async enroll(r: DesktopMachineEnroll): Promise<void> {
    if (foreignServer()) throw new Error('foreign_server')
    await stopWhoeverRuns()
    saveConfig({ machineId: r.machineId, teamId: r.teamId, token: r.token, serverUrl: process.env.TDS_SERVER ?? APP_ORIGIN })
    machine.start()
  },
  // The CLI daemon holds the lock: stop it the way `tds stop` would and run the machine here, on
  // the registration it was using. `tds start` in a terminal takes it back the same way.
  async takeOver(): Promise<void> {
    if (foreignServer()) throw new Error('foreign_server')
    await stopWhoeverRuns()
    machine.start()
  },
  // Forget the registration, as `tds logout` does; the device identity stays so re-enrolling
  // re-points the same machine.
  async forget(): Promise<void> {
    await stop()
    clearConfig()
    set('idle')
  },
}

function isEnroll(r: unknown): r is DesktopMachineEnroll {
  const o = r as Record<string, unknown> | null
  return !!o && ['machineId', 'teamId', 'token'].every((k) => typeof o[k] === 'string' && o[k] !== '')
}

export function installMachineIpc(): void {
  setInterval(refresh, WATCH_MS).unref()
  ipcMain.handle(DESKTOP_IPC.machineGetState, (e) => {
    if (!fromApp(e)) return null
    refresh()
    return state()
  })
  ipcMain.handle(DESKTOP_IPC.machineIdentity, (e) => {
    if (!fromApp(e)) throw new Error('rejected')
    return machine.identity()
  })
  ipcMain.handle(DESKTOP_IPC.machineEnroll, (e, r: unknown) => {
    if (!fromApp(e) || !isEnroll(r)) throw new Error('rejected')
    return machine.enroll(r)
  })
  ipcMain.handle(DESKTOP_IPC.machineStart, (e) => {
    if (fromApp(e) && (status === 'stopped' || status === 'error')) machine.start()
  })
  // Only the CLI's machine is there to take; a state that moved on since the click has its own
  // action, which the card offers once the next state arrives.
  ipcMain.handle(DESKTOP_IPC.machineTakeOver, (e) => (fromApp(e) && status === 'external' ? machine.takeOver() : undefined))
  ipcMain.handle(DESKTOP_IPC.machineForget, (e) => (fromApp(e) ? machine.forget() : undefined))
  ipcMain.on(DESKTOP_IPC.machineOpenLogs, (e) => { if (fromApp(e)) void shell.openPath(logPath()) })
}
