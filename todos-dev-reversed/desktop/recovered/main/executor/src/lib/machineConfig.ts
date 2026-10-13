import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

export interface MachineConfig {
  machineId: string
  token: string
  teamId: string
  serverUrl: string
}

// The ~/.tds root and a helper for files under it — the single source of truth for the data dir
// shared by registration (machine.json), device identity (device.json), and the daemon.
// TDS_HOME relocates the whole tree (dev isolation: a desktop shell pointed at localhost must not
// touch the ~/.tds a production CLI enrolled on the same Mac).
export function tdsDir(): string { return process.env.TDS_HOME || join(homedir(), '.tds') }
export function tdsPath(...segments: string[]): string { return join(tdsDir(), ...segments) }

function configPath(): string {
  return tdsPath('machine.json')
}

export function loadConfig(): MachineConfig | null {
  const p = configPath()
  if (!existsSync(p)) return null
  try {
    const cfg = JSON.parse(readFileSync(p, 'utf-8')) as Partial<MachineConfig>
    if (cfg.token && cfg.machineId) return cfg as MachineConfig
  } catch { /* invalid/empty → treated as not registered */ }
  return null
}

export function saveConfig(config: MachineConfig): void {
  mkdirSync(tdsDir(), { recursive: true })
  writeFileSync(configPath(), JSON.stringify(config, null, 2), { mode: 0o600 })
}

export function clearConfig(): void {
  // Delete the config so loadConfig returns null on the next start (device.json — the hardware
  // fingerprint — is kept so re-enroll reuses this machine).
  const p = configPath()
  try { if (existsSync(p)) rmSync(p) } catch { /* ignore */ }
}
