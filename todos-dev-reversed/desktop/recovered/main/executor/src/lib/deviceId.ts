import { createHash, randomBytes } from 'crypto'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { hostname } from 'os'
import { tdsDir, tdsPath } from './machineConfig'

// Hardware fingerprint, kept separate from the registration config (machine.json). Its own file so
// the two never collide.
const deviceFile = () => tdsPath('device.json')

export function getDeviceId(): string {
  if (existsSync(deviceFile())) {
    try {
      const data = JSON.parse(readFileSync(deviceFile(), 'utf-8')) as { deviceId?: string }
      if (data.deviceId) return data.deviceId
    } catch { /* regenerate */ }
  }

  const salt = randomBytes(16).toString('hex')
  const deviceId = createHash('sha256').update(`${hostname()}:${salt}`).digest('hex').slice(0, 32)

  mkdirSync(tdsDir(), { recursive: true })
  writeFileSync(deviceFile(), JSON.stringify({ deviceId }, null, 2), { mode: 0o600 })
  return deviceId
}
