import type { ModelProviderApi } from '@tds/types'

// Moved here from apps/server so the same probe runs on whichever side can actually reach the
// endpoint: the client tries first (a local Ollama answers there), the server route stays as the
// fallback for public endpoints the browser's CORS rules keep the client away from.

export interface DiscoveredModel {
  id: string
  label?: string
  contextWindow?: number
  image?: boolean
}

const DISCOVER_TIMEOUT_MS = 8_000

// Chrome-only fetch hint that exempts an https page's request to an http local address from
// mixed-content blocking; every other runtime ignores the field (RequestInit doesn't know it yet).
const LOCAL_HOST_RE = /^(localhost|.+\.(localhost|local)|127(\.\d{1,3}){3}|\[::1\]|10(\.\d{1,3}){3}|192\.168(\.\d{1,3}){2}|172\.(1[6-9]|2\d|3[01])(\.\d{1,3}){2}|169\.254(\.\d{1,3}){2})$/i

// The transport a probe runs on. The browser uses the global fetch; the server passes one that
// refuses private destinations, since there the URL is a user's and the network is the cluster's.
export type ProbeFetch = (url: string, init: RequestInit) => Promise<Response>

export function probeFetch(url: string, init: RequestInit, timeoutMs: number, fetchImpl: ProbeFetch = (u, i) => fetch(u, i)): Promise<Response> {
  let local = false
  try {
    const u = new URL(url)
    local = u.protocol === 'http:' && LOCAL_HOST_RE.test(u.hostname)
  } catch { /* let fetch throw its own error */ }
  return fetchImpl(url, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
    ...(local ? { targetAddressSpace: 'local' } : {}),
  } as RequestInit)
}

export function isLocalUrl(url: string): boolean {
  try { return LOCAL_HOST_RE.test(new URL(url).hostname) } catch { return false }
}

// Tells "nothing is listening" apart from "the browser was kept from reading the response":
// a no-cors request resolves (opaquely) whenever a server answers at all, whatever its CORS
// headers say, and rejects only when the connection itself fails.
export async function probeReachable(baseUrl: string, timeoutMs = 3_000): Promise<boolean> {
  try {
    await probeFetch(baseUrl, { mode: 'no-cors' }, timeoutMs)
    return true
  } catch {
    return false
  }
}

// Where a provider lists its models, per api type. The split mirrors how pi hands baseUrl to each
// vendor SDK: the OpenAI and Google SDKs get a baseUrl that already carries the version segment
// (…/v1), while the Anthropic SDK gets a bare host and prefixes /v1 itself.
const MODELS_PATH: Record<ModelProviderApi, string> = {
  'openai-completions': '/models',
  'openai-responses': '/models',
  'anthropic-messages': '/v1/models',
  'google-generative-ai': '/models',
}

function modelsUrl(api: ModelProviderApi, baseUrl: string): string | null {
  const path = MODELS_PATH[api]
  return path ? baseUrl.replace(/\/+$/, '') + path : null
}

// Ask the endpoint for its model list. models: null means the probe failed (network, timeout,
// non-2xx, non-JSON, unrecognized shape) and the caller should fall back to manual entry; an empty
// array means the endpoint answered but offers nothing. unauthorized tells a 401/403 apart from
// "nothing there": the endpoint is up but wants a (different) key.
export interface DiscoverResult {
  models: DiscoveredModel[] | null
  unauthorized?: boolean
}

export async function discoverModels(args: {
  api: ModelProviderApi
  baseUrl: string
  apiKey?: string
  authHeader?: boolean
  headers?: Record<string, string>
  timeoutMs?: number
  fetch?: ProbeFetch
}): Promise<DiscoverResult> {
  const url = modelsUrl(args.api, args.baseUrl)
  if (!url) return { models: null }
  try {
    const res = await probeFetch(url, {
      headers: { ...probeHeaders(args.api, args.apiKey, !!args.authHeader), ...args.headers },
    }, args.timeoutMs ?? DISCOVER_TIMEOUT_MS, args.fetch)
    if (!res.ok) return { models: null, unauthorized: res.status === 401 || res.status === 403 }
    return { models: parseModels(args.api, await res.json()) }
  } catch {
    return { models: null }
  }
}

// Mirror what pi's clients send at run time, so a provider that would work in a build also answers
// here: the OpenAI SDK sends Bearer, the Anthropic SDK x-api-key + a version header, the Google SDK
// x-goog-api-key. authHeader adds a Bearer on top without replacing those (model-registry's
// getApiKeyAndHeaders does the same).
export function probeHeaders(api: ModelProviderApi, apiKey: string | undefined, authHeader: boolean): Record<string, string> {
  const headers: Record<string, string> = {}
  if (api === 'anthropic-messages') headers['anthropic-version'] = '2023-06-01'
  if (!apiKey) return headers
  if (api === 'anthropic-messages') headers['x-api-key'] = apiKey
  if (api === 'google-generative-ai') headers['x-goog-api-key'] = apiKey
  if (api === 'openai-completions' || api === 'openai-responses' || authHeader) {
    headers['authorization'] = `Bearer ${apiKey}`
  }
  return headers
}

function parseModels(api: ModelProviderApi, json: unknown): DiscoveredModel[] | null {
  if (typeof json !== 'object' || json === null) return null
  const body = json as Record<string, unknown>
  const list = api === 'google-generative-ai' ? body.models : body.data
  if (!Array.isArray(list)) return null

  const seen = new Set<string>()
  const models: DiscoveredModel[] = []
  for (const item of list) {
    const m = parseEntry(api, item)
    if (!m || seen.has(m.id)) continue
    seen.add(m.id)
    models.push(m)
  }
  return models
}

function parseEntry(api: ModelProviderApi, item: unknown): DiscoveredModel | null {
  if (typeof item !== 'object' || item === null) return null
  const rec = item as Record<string, unknown>

  if (api === 'google-generative-ai') {
    // pi stores the bare id and lets the SDK re-add the models/ prefix.
    const id = asId(typeof rec.name === 'string' ? rec.name.replace(/^models\//, '') : undefined)
    if (!id) return null
    return { id, label: asLabel(rec.displayName), contextWindow: asWindow(rec.inputTokenLimit) }
  }

  const id = asId(rec.id)
  if (!id) return null
  if (api === 'anthropic-messages') {
    return { id, label: asLabel(rec.display_name) }
  }
  // OpenRouter's dialect reports the window as context_length and vision as an input modality.
  const top = rec.top_provider
  const modalities = (rec.architecture as Record<string, unknown> | undefined)?.input_modalities
  const label = asLabel(rec.name)
  return {
    id,
    ...(label ? { label } : {}),
    contextWindow: asWindow(rec.context_length)
      ?? (typeof top === 'object' && top !== null ? asWindow((top as Record<string, unknown>).context_length) : undefined),
    ...(Array.isArray(modalities) && modalities.includes('image') ? { image: true } : {}),
  }
}

// The endpoint is whatever the user pointed at: ids go into requests verbatim and labels render
// straight into the UI, so an id with control characters is garbage and a label gets them stripped.
const CONTROL = new RegExp('[\\u0000-\\u001f\\u007f-\\u009f]')
const CONTROL_ALL = new RegExp('[\\u0000-\\u001f\\u007f-\\u009f]', 'g')

function asId(v: unknown): string | undefined {
  return typeof v === 'string' && v && v.length <= 256 && !CONTROL.test(v) ? v : undefined
}

function asLabel(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const clean = v.replace(CONTROL_ALL, ' ').trim()
  return clean ? clean.slice(0, 120) : undefined
}

function asWindow(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : undefined
}
