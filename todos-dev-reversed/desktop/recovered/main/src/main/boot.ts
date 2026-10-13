import { join } from 'node:path'

// Where a launch's time goes, printed with TDS_DESKTOP_TIMING=1 against the process's creation —
// before any JS ran — so the framework's own boot shows in the first line. Renderer marks
// (apps/app/lib/boot.web.ts) arrive through the window's console (main/window.ts). No electron
// import at load: modules under plain-node tests import this too.
const T0 = (process as { getCreationTime?: () => number | null }).getCreationTime?.() ?? Date.now()

export const timing = process.env.TDS_DESKTOP_TIMING === '1'

export function mark(name: string): void {
  if (timing) console.log(`[boot] ${String(Date.now() - T0).padStart(6)}ms  ${name}`)
}

const TRACE_MS = 15_000

// TDS_DESKTOP_TRACE=1: the first seconds as a Chromium trace in userData, for the V8 compile
// events — whether the entry chunk's code cache is produced and consumed across launches.
export async function traceBoot(): Promise<void> {
  const { app, contentTracing } = await import('electron')
  await contentTracing.startRecording({ included_categories: ['v8', 'disabled-by-default-v8.compile', 'devtools.timeline'] })
  await new Promise<void>((resolve) => setTimeout(resolve, TRACE_MS))
  const file = join(app.getPath('userData'), 'boot-trace.json')
  await contentTracing.stopRecording(file)
  console.log(`[boot] trace written to ${file}`)
}
