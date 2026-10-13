import { spawn } from 'node:child_process'
import { globalBinDirs } from '../../../../executor/src/lib/externalBin'

// A Dock-launched app inherits launchd's PATH (/usr/bin:/bin:/usr/sbin:/sbin), not the user's: the
// worker's agent would find neither homebrew's git nor nvm's node. So the worker gets the environment
// a login shell would give a terminal, captured once through the user's own shell.

const MARKER = '__TDS_ENV__'
// TDS_API_KEY makes `tds start` re-enroll on every launch; the server and team come from
// machine.json; ELECTRON_RUN_AS_NODE would turn every process the worker spawns into headless Electron.
const STRIP = ['TDS_API_KEY', 'TDS_SERVER', 'TDS_TEAM', 'ELECTRON_RUN_AS_NODE']

// `env -0` output after the marker: NUL-separated KEY=VALUE, so multi-line values and whatever the
// rc files printed before the marker cannot corrupt the parse. Null when the marker never came.
export function parseNulEnv(out: string, marker = MARKER): Record<string, string> | null {
  const at = out.lastIndexOf(marker)
  if (at < 0) return null
  const env: Record<string, string> = {}
  for (const entry of out.slice(at + marker.length).split('\0')) {
    const eq = entry.indexOf('=')
    if (eq > 0) env[entry.slice(0, eq)] = entry.slice(eq + 1)
  }
  return env
}

// The shell env over the process env, minus what must not reach the worker, plus the shell's own
// additions. Without a shell env, the directories installers use are put ahead of the bare PATH.
export function mergeChildEnv(
  base: NodeJS.ProcessEnv,
  shell: Record<string, string> | null,
  extra: Record<string, string>,
  platform: NodeJS.Platform = process.platform,
  fallback: string[] = globalBinDirs({ env: base, platform }),
): Record<string, string> {
  const env: Record<string, string> = {}
  const copy = (values: NodeJS.ProcessEnv) => {
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined) env[platform === 'win32' ? key.toUpperCase() : key] = value
    }
  }
  copy(base)
  if (shell) copy(shell)
  else if (platform !== 'win32') env.PATH = [...new Set([...fallback, ...(env.PATH ?? '').split(':')])].filter(Boolean).join(':')
  for (const k of STRIP) delete env[k]
  copy(extra)
  return env
}

export function loginShellEnv(timeoutMs = 10_000): Promise<Record<string, string> | null> {
  if (process.platform === 'win32') return Promise.resolve(null)
  return new Promise((resolve) => {
    const child = spawn(process.env.SHELL || (process.platform === 'darwin' ? '/bin/zsh' : '/bin/sh'), ['-ilc', `printf ${MARKER}; env -0`], {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: timeoutMs,
    })
    const chunks: Buffer[] = []
    child.stdout.on('data', (d: Buffer) => chunks.push(d))
    child.on('error', () => resolve(null))
    child.on('close', (code) => resolve(code === 0 ? parseNulEnv(Buffer.concat(chunks).toString('utf8')) : null))
  })
}
