import { execFile } from 'node:child_process'
import { closeSync, existsSync, openSync, readFileSync, writeSync } from 'node:fs'
import { join } from 'node:path'
import { app, utilityProcess } from 'electron'
import { clearDaemon, isAlive, logPath, readDaemon, rotateLogIfBig, writeDaemon } from '../../../../executor/src/lib/daemon'
import { tdsDir } from '../../../../executor/src/lib/machineConfig'
import { agentShellPath } from '../../../../executor/src/lib/windowsShell'
import { mark } from '../boot'
import { loginShellEnv, mergeChildEnv } from './shellEnv'
import { tunnelPath } from '../platform'

// One worker: the executor's own `tds start --foreground`, run from the bundled copy as an Electron
// utility process. The shell stands in for the CLI's supervisor, and takes its pid lock (daemon.json)
// so `tds start` sees a running machine and `tds stop` can stop this one.

const TAIL_LINES = 40
const SHUTDOWN_GRACE_MS = 10_000
const KILL_GRACE_MS = 3000

export type WorkerMessage = { type: 'ready'; machineId: string } | { type: 'load'; running: number }

export interface WorkerHandle {
  pid: number
  // Resolves with the exit code once Electron reports the worker gone. That report waits for the
  // worker's stderr pipe to close, and the tunnel sidecar inherits it — so it can lag the actual
  // exit by however long the Go process takes to die. stop() watches the pid instead.
  exited: Promise<number>
  // Set by whoever asks the worker to stop, so its exit is not mistaken for a crash.
  stopRequested: boolean
  stderrTail(): string
  // Ask the worker to shut down the way SIGTERM would (it reports offline first), then force it.
  stop(): Promise<void>
}

// Resources/machine in a packaged app (scripts/stage-machine.mjs lays it out); the workspace's
// apps/executor in dev, whose dist/ comes from `pnpm --filter @todos-dev/cli build`.
export function machineDir(): string {
  if (app.isPackaged) return join(process.resourcesPath, 'machine')
  return process.env.TDS_DESKTOP_MACHINE_DIR ?? join(app.getAppPath(), '../executor')
}

export function machineVersion(): string | null {
  try {
    return (JSON.parse(readFileSync(join(machineDir(), 'package.json'), 'utf8')) as { version?: string }).version ?? null
  } catch {
    return null
  }
}

export { logPath }

function tunnelEnv(dir: string): Record<string, string> {
  const bin = tunnelPath(dir, app.isPackaged)
  return existsSync(bin) ? { TDS_TUNNEL_BIN: bin } : { TDS_DISABLE_TUNNEL: '1' }
}

// The login shell is consulted once per app run; its PATH does not change underneath us. A capture
// that failed (a slow or broken rc file) is not remembered: the next fork tries again.
let shellEnv: Record<string, string> | null = null
let shellEnvP: Promise<Record<string, string> | null> | null = null

// The rc files take a second or more; asked for as soon as the window is up, the answer is in
// before the fork that needs it (main/index.ts).
export function prefetchShellEnv(): Promise<Record<string, string> | null> {
  if (shellEnv) return Promise.resolve(shellEnv)
  shellEnvP ??= loginShellEnv().then((env) => {
    shellEnv = env
    if (!env) shellEnvP = null
    return env
  })
  return shellEnvP
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

async function untilDead(pid: number, ms: number): Promise<boolean> {
  const deadline = Date.now() + ms
  while (isAlive(pid)) {
    if (Date.now() >= deadline) return false
    await delay(200)
  }
  return true
}

export async function forkWorker(onMessage: (m: WorkerMessage) => void): Promise<WorkerHandle> {
  if (process.platform === 'win32' && !agentShellPath()) {
    throw new Error('Install Git for Windows with Git Bash, then restart Todos to run local tasks.')
  }
  const dir = machineDir()
  const envAt = Date.now()
  await prefetchShellEnv()
  mark(`shell env ${Date.now() - envAt}ms`)
  const env = mergeChildEnv(process.env, shellEnv, { TDS_RUNNER: 'desktop', ...tunnelEnv(dir) })

  rotateLogIfBig()
  const log = openSync(logPath(), 'a')
  if (!shellEnv) writeSync(log, `[${new Date().toISOString()}] [desktop] login shell env unavailable — worker PATH=${env.PATH}\n`)
  const tail: string[] = []
  const child = utilityProcess.fork(join(dir, 'dist/index.js'), ['start', '--foreground'], {
    env,
    cwd: tdsDir(),
    stdio: ['ignore', 'pipe', 'pipe'],
    serviceName: 'tds-machine',
  })
  const forward = (stream: NodeJS.ReadableStream | null, keep: boolean) => {
    stream?.on('data', (d: Buffer) => {
      try { writeSync(log, d) } catch { /* the log is best-effort */ }
      if (keep) {
        tail.push(...d.toString('utf8').split('\n').filter(Boolean))
        tail.splice(0, Math.max(0, tail.length - TAIL_LINES))
      }
    })
  }
  forward(child.stdout, false)
  forward(child.stderr, true)
  child.on('message', (m: WorkerMessage) => {
    if (m.type === 'ready') mark('worker ready')
    onMessage(m)
  })

  const exited = new Promise<number>((resolve) => {
    child.once('exit', (code) => {
      closeSync(log)
      resolve(code)
    })
  })
  const pid = await new Promise<number>((resolve, reject) => {
    child.once('spawn', () => resolve(child.pid as number))
    void exited.then((code) => reject(new Error(`worker exited before it spawned (code ${code})`)))
  })
  mark('worker spawned')
  writeDaemon({ pid, startedAt: Date.now(), runner: 'desktop' })
  // `tds stop` clears the lock itself; a crash leaves ours behind, which we take back only if it
  // is still ours (the CLI may have started in between).
  void exited.then(() => { if (readDaemon()?.pid === pid) clearDaemon() })

  return {
    pid,
    exited,
    stopRequested: false,
    stderrTail: () => tail.join('\n'),
    async stop() {
      child.postMessage({ type: 'shutdown' })
      if (await untilDead(pid, SHUTDOWN_GRACE_MS)) return
      // kill() is SIGTERM with SIGKILL close behind — only after the graceful path had its chance.
      if (process.platform === 'win32') {
        await new Promise<void>((resolve) => {
          execFile('taskkill.exe', ['/PID', String(pid), '/T', '/F'], { windowsHide: true, timeout: KILL_GRACE_MS }, () => resolve())
        })
      }
      if (isAlive(pid)) child.kill()
      await untilDead(pid, KILL_GRACE_MS)
    },
  }
}
