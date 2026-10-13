import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { IpcMainEvent, IpcMainInvokeEvent } from 'electron'
import { APP_ORIGIN } from '../shared/appUrl'

// The page the window shows while a required release installs (build/update.html, copied beside
// dist/main by scripts/build.mjs).
export const UPDATE_PAGE = join(__dirname, '../update.html')

// Only the app's own document may drive the shell. A third-party page the window was handed to
// (an OAuth provider, Stripe) gets the preload too, and must not.
export function fromApp(event: IpcMainEvent | IpcMainInvokeEvent): boolean {
  try {
    return new URL(event.senderFrame?.url ?? '').origin === APP_ORIGIN
  } catch {
    return false
  }
}

// The update page is the shell's own as well, and drives the updater from file:.
export function fromShell(event: IpcMainEvent | IpcMainInvokeEvent): boolean {
  if (fromApp(event)) return true
  try {
    const url = new URL(event.senderFrame?.url ?? '')
    return url.protocol === 'file:' && fileURLToPath(url) === UPDATE_PAGE
  } catch {
    return false
  }
}
