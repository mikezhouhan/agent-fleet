import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { app, type Rectangle } from 'electron'

// What the window looked like when it was last used, so the next launch paints the right size and
// the right ground before the page has said anything. Theme is the app's own switch
// (apps/app/lib/theme.web.ts) reported over IPC; the surface colours match its tokens.
export type Theme = 'dark' | 'light'

export interface WindowState {
  bounds?: Rectangle
  theme?: Theme
}

const SURFACE: Record<Theme, string> = { dark: '#18181b', light: '#faf7f2' }

export function surfaceColor(theme: Theme | undefined): string {
  return SURFACE[theme ?? 'dark']
}

function file(): string {
  return join(app.getPath('userData'), 'window-state.json')
}

let cached: WindowState | null = null

export function readWindowState(): WindowState {
  if (cached) return cached
  try {
    cached = JSON.parse(readFileSync(file(), 'utf8')) as WindowState
  } catch {
    cached = {}
  }
  return cached
}

export function writeWindowState(patch: Partial<WindowState>): void {
  cached = { ...readWindowState(), ...patch }
  try {
    const target = file()
    mkdirSync(join(target, '..'), { recursive: true })
    writeFileSync(`${target}.tmp`, JSON.stringify(cached))
    renameSync(`${target}.tmp`, target)
  } catch {
    // Best-effort: a failed write costs one launch's remembered size, nothing more.
  }
}
