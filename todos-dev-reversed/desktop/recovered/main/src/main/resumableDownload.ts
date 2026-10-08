import { createHash } from 'node:crypto'
import { createWriteStream, mkdirSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs'
import { open } from 'node:fs/promises'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import type { ReadableStream as NodeReadableStream } from 'node:stream/web'

// A release file fetched so that a dropped connection costs only the bytes that had not arrived.
// What came in stays in <dir>/<digest> through failures and relaunches, and the next request asks
// for the rest by Range; the file moves to its destination only once its sha512 is the feed's.
// Pure (no electron import) so it can be tested outside the app; main/updater.ts puts it under
// electron-updater's full download.

// A request that brings no bytes for this long is ended, as electron-updater's socket timeout did.
const IDLE_MS = 60_000
// The waits before asking again. A request that brought bytes starts the list over; the download
// fails once as many in a row have brought none.
const RETRY_MS = [2_000, 5_000, 15_000]

export interface DownloadProgress {
  total: number
  delta: number
  transferred: number
  percent: number
  bytesPerSecond: number
}

export interface ResumableDownload {
  url: string
  // Where the verified file lands; on the volume `dir` is on.
  dest: string
  // Holds the partial and nothing else: any other file in it is removed.
  dir: string
  // Base64, as the update manifest carries it.
  sha512: string
  fetch: (url: string, init: { headers: Record<string, string>; signal: AbortSignal }) => Promise<Response>
  headers?: Record<string, string>
  signal?: AbortSignal
  onProgress?: (p: DownloadProgress) => void
  idleMs?: number
  retryMs?: number[]
}

// A failure that asking again at once would not mend.
class Final extends Error {}

function sizeOf(file: string): number {
  try {
    return statSync(file).size
  } catch {
    return 0
  }
}

export async function downloadResumable(o: ResumableDownload): Promise<void> {
  const part = join(o.dir, Buffer.from(o.sha512, 'base64').toString('hex').slice(0, 32))
  mkdirSync(o.dir, { recursive: true })
  for (const e of readdirSync(o.dir)) {
    if (join(o.dir, e) !== part) rmSync(join(o.dir, e), { recursive: true, force: true })
  }

  const started = Date.now()
  let fetched = 0
  let unreported = 0
  let shown = -1
  const report = (bytes: number, transferred: number, total: number): void => {
    fetched += bytes
    unreported += bytes
    const percent = total ? (transferred / total) * 100 : 0
    if (!o.onProgress || Math.floor(percent) === shown) return
    shown = Math.floor(percent)
    o.onProgress({ total, delta: unreported, transferred, percent, bytesPerSecond: Math.round((fetched * 1000) / Math.max(1, Date.now() - started)) })
    unreported = 0
  }

  const retryMs = o.retryMs ?? RETRY_MS
  for (let stalls = 0; ;) {
    const had = sizeOf(part)
    try {
      await fetchRest(o, part, had, report)
      break
    } catch (err) {
      if (err instanceof Final || o.signal?.aborted) throw err
      stalls = sizeOf(part) > had ? 0 : stalls + 1
      if (stalls >= retryMs.length) throw err
      await new Promise((resolve) => setTimeout(resolve, retryMs[stalls]))
    }
  }

  const hash = createHash('sha512')
  const file = await open(part)
  try {
    for await (const chunk of file.createReadStream({ highWaterMark: 1024 * 1024 })) hash.update(chunk as Buffer)
  } finally {
    await file.close()
  }
  const digest = hash.digest('base64')
  if (digest !== o.sha512) {
    rmSync(part, { force: true })
    throw new Error(`sha512 checksum mismatch, expected ${o.sha512}, got ${digest}`)
  }
  // On Windows a scanner can still hold a file this fresh; electron-updater waits out its own rename too.
  for (let tries = 0; ; tries++) {
    try {
      renameSync(part, o.dest)
      return
    } catch (err) {
      if (tries >= 20 || !['EBUSY', 'EPERM'].includes((err as NodeJS.ErrnoException).code ?? '')) throw err
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }
}

// One request for what the partial lacks, appended to it.
async function fetchRest(o: ResumableDownload, part: string, had: number, report: (bytes: number, transferred: number, total: number) => void): Promise<void> {
  const idle = new AbortController()
  let timer: NodeJS.Timeout | undefined
  const alive = (): void => {
    clearTimeout(timer)
    timer = setTimeout(() => idle.abort(), o.idleMs ?? IDLE_MS)
  }
  alive()
  // A server that answers a Range with the whole file would be asked for it again on every drop.
  let restarted = false
  try {
    const res = await o.fetch(o.url, {
      // Asked as a range from the first byte on: the answer then names the file's full length.
      headers: { ...o.headers, Range: `bytes=${had}-` },
      signal: o.signal ? AbortSignal.any([o.signal, idle.signal]) : idle.signal,
    })
    if (res.status === 416 && had > 0) {
      // Nothing lies past the partial, so it is the whole file — or the checksum will say it is not.
      void res.body?.cancel()
      return
    }
    if ((res.status !== 200 && res.status !== 206) || !res.body) throw new Final(`Cannot download "${o.url}", status ${res.status}`)
    const range = /^bytes (\d+)-\d+\/(\d+)$/.exec((res.status === 206 && res.headers.get('content-range')) || '')
    const resumed = range !== null && Number(range[1]) === had
    restarted = had > 0 && !resumed
    const total = resumed ? Number(range[2]) : Number(res.headers.get('content-length')) || 0
    let at = resumed ? had : 0
    await pipeline(
      Readable.fromWeb(res.body as unknown as NodeReadableStream),
      async function* (source: AsyncIterable<Buffer>) {
        for await (const chunk of source) {
          alive()
          at += chunk.length
          report(chunk.length, at, total)
          yield chunk
        }
      },
      createWriteStream(part, { flags: resumed ? 'a' : 'w' }),
    )
    if (resumed && at !== total) throw new Error(`"${o.url}" ended at ${at} of ${total} bytes`)
  } catch (err) {
    if (err instanceof Final || o.signal?.aborted) throw err
    const failure = idle.signal.aborted ? new Error('Request timed out') : err
    throw restarted ? new Final(failure instanceof Error ? failure.message : String(failure)) : failure
  } finally {
    clearTimeout(timer)
  }
}
