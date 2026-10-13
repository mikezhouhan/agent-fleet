import { readdirSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { delimiter, dirname, join } from 'node:path'

export interface ExecutableLookup {
  env?: NodeJS.ProcessEnv
  platform?: NodeJS.Platform
  home?: string
}

export interface ExecutableSpec {
  // Env var that names the executable outright.
  override: string
  command: string
  // This installer's own directories under $HOME, tried after PATH and before globalBinDirs.
  homeDirs?: string[][]
}

// Where a CLI lands that a process without the user's shell PATH would miss — a Dock-launched app
// inherits launchd's PATH, a LaunchAgent or systemd unit even less: the native installers'
// ~/.local/bin, `npm i -g` under a node version manager (every nvm version, newest first) or an
// npm prefix, and the package-manager prefixes.
export function globalBinDirs({ env = process.env, platform = process.platform, home = homedir() }: ExecutableLookup = {}): string[] {
  if (platform === 'win32') return [join(env.APPDATA ?? join(home, 'AppData', 'Roaming'), 'npm')]
  const nvm = join(env.NVM_DIR ?? join(home, '.nvm'), 'versions', 'node')
  const fnm = env.FNM_DIR ?? join(home, platform === 'darwin' ? 'Library/Application Support/fnm' : '.local/share/fnm')
  return [
    join(home, '.local', 'bin'),
    ...newestFirst(nvm).map((version) => join(nvm, version, 'bin')),
    join(fnm, 'aliases', 'default', 'bin'),
    join(env.VOLTA_HOME ?? join(home, '.volta'), 'bin'),
    join(home, '.npm-global', 'bin'),
    '/opt/homebrew/bin',
    '/usr/local/bin',
  ]
}

// An external runtime is the user's own install (their sign-in), never a bundled copy.
// Override → PATH → the installers' default locations. null = not installed.
export function resolveExecutable(spec: ExecutableSpec, lookup: ExecutableLookup = {}): string | null {
  const { env = process.env, platform = process.platform, home = homedir() } = lookup
  const override = env[spec.override]
  if (override) return override
  const names = platform === 'win32' ? [`${spec.command}.exe`, `${spec.command}.cmd`] : [spec.command]
  const dirs = [...(env.PATH ?? '').split(delimiter), ...(spec.homeDirs ?? []).map((d) => join(home, ...d)), ...globalBinDirs({ env, platform, home })]
  for (const dir of dirs) {
    if (!dir) continue
    for (const name of names) {
      const candidate = join(dir, name)
      if (isFile(candidate)) return candidate
    }
  }
  return null
}

// What an npm cmd-shim (`claude.cmd`) launches — the package's own exe or script — for callers that
// spawn without a shell, which Node refuses for a .cmd (spawn EINVAL). null when it isn't a shim
// or its target is gone.
export function cmdShimTarget(shim: string): string | null {
  let text: string
  try { text = readFileSync(shim, 'utf8') } catch { return null }
  const targets = [...text.matchAll(/"%(?:~dp0|dp0%)\\([^"]+)"/g)].map((m) => m[1]!).filter((t) => !/(^|\\)node\.exe$/i.test(t))
  const target = targets.at(-1)
  if (!target) return null
  const path = join(dirname(shim), ...target.split('\\'))
  return isFile(path) ? path : null
}

// nvm's versions/node/v22.22.2, v20.11.0, … — the newest is the likeliest default.
function newestFirst(dir: string): string[] {
  try {
    return readdirSync(dir).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
  } catch {
    return []
  }
}

function isFile(path: string): boolean {
  try { return statSync(path).isFile() } catch { return false }
}
