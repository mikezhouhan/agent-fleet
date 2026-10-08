import { spawn, spawnSync, type ChildProcess } from 'child_process'
import type { Readable } from 'stream'
import {
  readFileSync, writeFileSync, existsSync, rmSync, mkdirSync,
  statSync, openSync, closeSync, copyFileSync, truncateSync,
} from 'fs'
import type { MachineRunner } from '@tds/types'
import { tdsDir, tdsPath } from './machineConfig'
import { installTimestampedLogging } from './log'
import { stripFlags } from './flagParser'

export interface DaemonState {
  pid: number
  startedAt: number
  // Who holds the lock: `tds start`'s supervisor, or the Todos desktop app running the worker
  // in-process. Absent on files written before the field existed — read as the CLI.
  runner?: MachineRunner
  // The CLI version that launched it. Absent for the desktop shell and for CLIs before 0.1.57.
  version?: string
}

const LOG_CAP = 10 * 1024 * 1024 // rotate daemon.log past 10MB
const STOP_GRACE_MS = 6000

// Worker exit code for a deterministic, unrecoverable condition (e.g. the machine was revoked):
// the supervisor must NOT restart on this, otherwise it spin-loops against a permanent failure.
export const EXIT_TERMINAL = 78

export function daemonStatePath(): string { return tdsPath('daemon.json') }
export function logPath(): string { return tdsPath('daemon.log') }

export function readDaemon(): DaemonState | null {
  const p = daemonStatePath()
  if (!existsSync(p)) return null
  try {
    const s = JSON.parse(readFileSync(p, 'utf-8')) as Partial<DaemonState>
    if (typeof s.pid === 'number') {
      return { pid: s.pid, startedAt: s.startedAt ?? 0, runner: s.runner === 'desktop' ? 'desktop' : 'cli', ...(typeof s.version === 'string' && { version: s.version }) }
    }
  } catch { /* corrupt → treat as not running */ }
  return null
}

export function writeDaemon(state: DaemonState): void {
  mkdirSync(tdsDir(), { recursive: true })
  writeFileSync(daemonStatePath(), JSON.stringify(state, null, 2))
}

export function clearDaemon(): void {
  try { rmSync(daemonStatePath()) } catch { /* already gone */ }
}

// kill(pid, 0) probes liveness without signaling: ESRCH = dead, EPERM = alive (not ours to signal).
export function isAlive(pid: number): boolean {
  if (!pid || pid <= 0) return false
  try { process.kill(pid, 0); return true }
  catch (e) { return (e as NodeJS.ErrnoException).code === 'EPERM' }
}

export const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

// Windows has no graceful signal path: process.kill('SIGTERM') is TerminateProcess on the
// supervisor alone, which orphans the worker (and its process tree). taskkill /T fells the
// whole tree instead; force is meaningless there since /F is already unconditional.
function killDaemon(pid: number, force: boolean): void {
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true })
  } else {
    process.kill(pid, force ? 'SIGKILL' : 'SIGTERM')
  }
}

export type StopDaemonResult = 'not_running' | 'stopped' | 'killed'

// Stop whoever holds the pid lock — the CLI supervisor or the desktop shell's worker — the way
// `tds stop` does: SIGTERM so in-flight work shuts down cleanly, SIGKILL only past the grace
// period. Shared with the desktop shell, which stops a CLI daemon this way to take the machine
// over. The lock is cleared either way; a stale file (dead pid) is cleared too.
export async function stopDaemon(): Promise<StopDaemonResult> {
  const d = readDaemon()
  if (!d || !isAlive(d.pid)) {
    if (d) clearDaemon()
    return 'not_running'
  }

  try { killDaemon(d.pid, false) } catch { /* exited between the check and now */ }

  const deadline = Date.now() + STOP_GRACE_MS
  while (Date.now() < deadline && isAlive(d.pid)) await delay(150)

  let result: StopDaemonResult = 'stopped'
  if (isAlive(d.pid)) {
    result = 'killed'
    try { killDaemon(d.pid, true) } catch { /* gone */ }
  }
  clearDaemon()
  return result
}

// Append-mode rotation: copy the tail aside, then truncate the same inode in place so the
// supervisor's inherited O_APPEND fd keeps writing to the now-empty file (rename would orphan it).
export function rotateLogIfBig(cap = LOG_CAP): void {
  const p = logPath()
  try {
    if (!existsSync(p) || statSync(p).size < cap) return
    copyFileSync(p, p + '.1')
    truncateSync(p, 0)
  } catch { /* best-effort; never block on log rotation */ }
}

function openLogFd(): number {
  mkdirSync(tdsDir(), { recursive: true })
  return openSync(logPath(), 'a')
}

// Re-invoke this same binary in another role. Forwarding execArgv preserves any loader flags (e.g.
// tsx's --import in dev) so the child can run the .ts entry; in the bundled prod build execArgv is
// empty, so this is just `node dist/index.js <command> …`.
export const selfArgs = (command: string, ...extra: string[]) => [...process.execArgv, process.argv[1], command, ...extra]

// Re-invoke this same binary detached into its own session (setsid via detached) with the daemon
// log as stdout/stderr, so neither a closing terminal nor a dying daemon-hosted pty can SIGHUP it.
// This is how anything that must OUTLIVE its invoker runs: the supervisor, and the restart helper —
// `tds restart` typed into a shell the worker itself hosts (an agent's remote shell) dies with the
// worker mid-sequence, so the sequence has to live in a process outside the daemon's tree.
// The child runs in tdsDir(), never the invoker's cwd: the whole daemon tree inherits it, and a
// build worktree there gets SIGKILLed by that turn's reapWorkspaceStrays (racknerd, 0.1.56 upgrade).
// Owns the log-fd lifecycle (rotate, open, hand to the child, close our copy); callers just name
// the role. The caller writes the returned pid to daemon.json when the child is the supervisor.
export function spawnDetachedSelf(command: string, args: string[]): number {
  rotateLogIfBig()
  const logFd = openLogFd()
  try {
    const child = spawn(process.execPath, selfArgs(command, ...args), {
      cwd: tdsDir(),
      detached: true,
      stdio: ['ignore', logFd, logFd],
    })
    child.unref()
    return child.pid as number
  } finally {
    closeSync(logFd)
  }
}

const MODE_FLAGS = new Set(['--supervisor', '--foreground', '-f'])
const userFlagsOnly = (args: string[]) => stripFlags(args, MODE_FLAGS)

// Forward a worker stdio pipe into the supervisor's log fd. Manual on('data') instead of .pipe():
// pipe would stack listeners on process.stdout across worker restarts whenever a lingering
// grandchild (the serve sidecar outlives a crashed worker) holds the pipe open. The log fd write
// is synchronous, so backpressure doesn't apply; a stream error must not take the supervisor down.
function forwardToLog(src: Readable | null, dest: NodeJS.WriteStream): void {
  src?.on('data', (d: Buffer) => dest.write(d))
  src?.on('error', () => { /* broken pipe: the worker is gone either way */ })
}

// The worker's last lines — usually the reason it died — may still sit in the pipes when the
// supervisor exits. Wait for both streams to close, capped: a lingering grandchild inheriting the
// worker's stderr can hold it open indefinitely.
async function drainWorkerPipes(c: ChildProcess): Promise<void> {
  const closed = (s: Readable | null) =>
    new Promise<void>(resolve => { if (!s || s.closed) resolve(); else s.once('close', resolve) })
  await Promise.race([Promise.all([closed(c.stdout), closed(c.stderr)]), delay(1000)])
}

export const INITIAL_BACKOFF_MS = 1000
const MAX_BACKOFF_MS = 30_000
const STABLE_MS = 60_000

export type RestartDecision =
  | { kind: 'terminal' }
  | { kind: 'restart'; delayMs: number; nextBackoffMs: number }

// What to do after a worker exit: never restart on the terminal code; otherwise wait out the
// current backoff, doubling it up to the cap, and reset it once a run has stayed up long enough to
// count as stable. Pure, so every supervisor (the CLI's, the desktop shell's) applies the same policy.
export function restartDecision(code: number, uptimeMs: number, backoffMs: number): RestartDecision {
  if (code === EXIT_TERMINAL) return { kind: 'terminal' }
  const delayMs = uptimeMs >= STABLE_MS ? INITIAL_BACKOFF_MS : backoffMs
  return { kind: 'restart', delayMs, nextBackoffMs: Math.min(delayMs * 2, MAX_BACKOFF_MS) }
}

// The detached daemon: keep a worker alive, restart it on unexpected exit with exponential backoff,
// and rotate the log periodically. A clean SIGTERM (from `tds stop`) shuts the worker down and exits.
export async function runSupervisor(args: string[]): Promise<void> {
  // Daemon role: stamp every supervisor log line so daemon.log stays chronologically readable.
  installTimestampedLogging()
  const userArgs = userFlagsOnly(args)
  let shuttingDown = false
  let child: ChildProcess | null = null
  let lastChild: ChildProcess | null = null
  let backoff = INITIAL_BACKOFF_MS

  const rotateTimer = setInterval(() => rotateLogIfBig(), 5 * 60_000)
  rotateTimer.unref()

  const onSignal = () => {
    if (shuttingDown) return
    shuttingDown = true
    clearInterval(rotateTimer)
    if (child) {
      child.kill('SIGTERM')
      const c = child
      setTimeout(() => { try { c.kill('SIGKILL') } catch { /* gone */ } }, 5000).unref()
    }
  }
  process.on('SIGTERM', onSignal)
  process.on('SIGINT', onSignal)

  console.log(`[supervisor] online (pid ${process.pid}); supervising worker`)
  while (!shuttingDown) {
    const startedAt = Date.now()
    // Piped stdio (forwarded to the supervisor's log fd) instead of 'inherit', and windowsHide:
    // on Windows this console-less detached supervisor would otherwise get the worker a fresh
    // VISIBLE console window, and libuv only applies CREATE_NO_WINDOW when no stdio slot is an
    // inherited fd. The worker's hidden console is then inherited by its whole subtree (git,
    // tds-tunnel, agent shells), so no window ever pops up.
    child = spawn(process.execPath, selfArgs('start', '--foreground', ...userArgs), {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })
    forwardToLog(child.stdout, process.stdout)
    forwardToLog(child.stderr, process.stderr)
    const code: number = await new Promise(resolve => {
      child!.on('exit', (c, sig) => resolve(c ?? (sig ? 128 : 0)))
    })
    lastChild = child
    child = null
    if (shuttingDown) break
    const next = restartDecision(code, Date.now() - startedAt, backoff)
    if (next.kind === 'terminal') {
      console.error('[supervisor] worker hit a terminal condition (not registered / revoked); not restarting.')
      break
    }
    console.warn(`[supervisor] worker exited (code ${code}); restarting in ${Math.round(next.delayMs / 1000)}s`)
    await delay(next.delayMs)
    backoff = next.nextBackoffMs
  }

  if (lastChild) await drainWorkerPipes(lastChild)
  clearDaemon()
  console.log('[supervisor] stopped')
  process.exit(0)
}
