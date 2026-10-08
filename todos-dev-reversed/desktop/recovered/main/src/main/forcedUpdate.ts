// A release the feed requires. The update manifest (latest-*.yml) may carry `minimumVersion`,
// stamped by scripts/dist.mjs from package.json; electron-updater hands the manifest through
// untouched, so the field arrives on UpdateInfo. A shell below it installs the release before it
// shows the app (main/updater.ts).

export const FEED_URL = 'https://assets.todos.dev/desktop'

const VERSION = /^(\d+)\.(\d+)\.(\d+)/

export function parseVersion(v: string): [number, number, number] | null {
  const m = VERSION.exec(v.trim())
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null
}

// Negative when `a` is below `b`. Only the numeric triple ranks; a prerelease tag does not.
export function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a)
  const pb = parseVersion(b)
  if (!pa || !pb) return 0
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1
  }
  return 0
}

export function minimumVersionOf(info: unknown): string | null {
  const v = (info as { minimumVersion?: unknown } | null | undefined)?.minimumVersion
  return typeof v === 'string' && parseVersion(v) ? v : null
}

// Whether the manifest puts this shell below the version allowed to run.
export function requiresUpdate(current: string, info: unknown): boolean {
  const minimum = minimumVersionOf(info)
  return !!minimum && !!parseVersion(current) && compareVersions(current, minimum) < 0
}

// The stable installer address on the feed (README: Publishing), for a download by hand when the
// updater cannot. Linux updates only as an AppImage, so that is the one a gated shell is.
export function installerUrl(platform: NodeJS.Platform, arch: string): string {
  const name = platform === 'darwin'
    ? `Todos-${arch === 'arm64' ? 'arm64' : 'x64'}.dmg`
    : platform === 'win32'
      ? 'Todos-win-x64.exe'
      : 'Todos-linux-x64.AppImage'
  return `${FEED_URL}/${name}`
}
