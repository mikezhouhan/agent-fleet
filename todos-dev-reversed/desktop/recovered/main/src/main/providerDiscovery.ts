import { MODEL_PROVIDER_API_TYPES } from '@tds/types'
import type { DesktopDiscoverRequest } from '@tds/types/desktop'

// Any http(s) address, not only a local one: the main process stands in for the page's own fetch,
// which already reaches anywhere and only lacks the right to read the answer — and an endpoint on
// the user's VPN or a Tailscale address is as far from the server as 127.0.0.1 is. What comes
// back is the parsed model list, nothing of the response itself.
const MAX_TIMEOUT_MS = 60_000

export function isDiscoverRequest(r: unknown): r is DesktopDiscoverRequest {
  const o = r as Record<string, unknown> | null
  if (!o || typeof o.baseUrl !== 'string' || !isHttpUrl(o.baseUrl)) return false
  if (!(MODEL_PROVIDER_API_TYPES as readonly unknown[]).includes(o.api)) return false
  if (o.apiKey !== undefined && typeof o.apiKey !== 'string') return false
  if (o.authHeader !== undefined && typeof o.authHeader !== 'boolean') return false
  const t = o.timeoutMs
  return t === undefined || (typeof t === 'number' && Number.isInteger(t) && t > 0 && t <= MAX_TIMEOUT_MS)
}

function isHttpUrl(s: string): boolean {
  try {
    const { protocol } = new URL(s)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}
