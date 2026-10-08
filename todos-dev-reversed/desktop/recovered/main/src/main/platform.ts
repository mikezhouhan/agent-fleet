import { join } from 'node:path'

export function tunnelPath(dir: string, packaged: boolean, platform: NodeJS.Platform = process.platform, arch = process.arch): string {
  const name = platform === 'win32' ? 'tds-tunnel.exe' : 'tds-tunnel'
  if (packaged) return join(dir, 'bin', name)
  const goos = platform === 'win32' ? 'windows' : platform
  const goarch = arch === 'x64' ? 'amd64' : arch
  return join(dir, 'vendor/bin', `${goos}-${goarch}`, name)
}
