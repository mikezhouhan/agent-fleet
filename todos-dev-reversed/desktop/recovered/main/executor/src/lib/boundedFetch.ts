// undici holds a request's AbortSignal only weakly, and Node 22 has been seen GC'ing an
// otherwise-unreferenced AbortSignal.timeout / AbortSignal.any composite mid-flight — the timeout
// then never fires and the fetch never settles (prod: a claim's 60s bound vanished and the claim
// loop sat wedged for a day). Pinned signals are held until they FIRE, not merely until the fetch
// settles: the same signal bounds reading the response body, which outlives the fetch promise.
// AbortSignal.timeout always fires at its deadline, so every pin is released within its timeoutMs.
const pinnedSignals = new Set<AbortSignal>()

export function pinAbortSignals(...signals: AbortSignal[]): void {
  for (const s of signals) {
    if (s.aborted) continue // already fired — and its 'abort' event never would again
    pinnedSignals.add(s)
    s.addEventListener('abort', () => pinnedSignals.delete(s), { once: true })
  }
}

// Bounded fetch for presigned-blob and web requests. Server-bound calls stay on serverRequest
// (headers, token, caller-signal composition); it pins through pinAbortSignals the same way.
// `signal` is excluded from init: it would be silently replaced — callers needing their own
// signal compose it in serverRequest style instead.
export function boundedFetch(url: string, timeoutMs: number, init: Omit<RequestInit, 'signal'> = {}): Promise<Response> {
  const timeoutSignal = AbortSignal.timeout(timeoutMs)
  pinAbortSignals(timeoutSignal)
  return fetch(url, { ...init, signal: timeoutSignal })
}
