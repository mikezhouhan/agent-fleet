import { ipcMain, Notification } from 'electron'
import { DESKTOP_IPC, type DesktopNotification } from '@tds/types/desktop'
import { fromApp } from './ipc'
import { getMainWindow, navigateTo } from './window'
import { setDesktopBadge } from './menu'

// Web Push has no push service behind it in Electron, so the app forwards what arrives on its team
// stream and the shell raises it as a system notification. Same rule as the service worker on the
// web (apps/server/public/sw.js): a window the user is looking at gets no banner. The desktop badge
// mirrors the inbox's unread count.

// Keep native notification callbacks alive until the user interacts with them.
const activeNotifications = new Set<Notification>()

function isNotification(v: unknown): v is DesktopNotification {
  const n = v as Partial<DesktopNotification> | null
  return !!n && typeof n.id === 'string' && typeof n.title === 'string' && typeof n.body === 'string' && typeof n.href === 'string'
}

export function installNotifications(): void {
  ipcMain.on(DESKTOP_IPC.notify, (e, n: unknown) => {
    if (!fromApp(e) || !isNotification(n)) return
    const win = getMainWindow()
    if (win && win.isVisible() && win.isFocused()) return
    if (!Notification.isSupported()) return
    const note = new Notification({ title: n.title, body: n.body })
    activeNotifications.add(note)
    const release = () => { activeNotifications.delete(note) }
    note.once('click', () => {
      release()
      navigateTo(n.href)
    })
    note.once('close', release)
    note.once('failed', release)
    try {
      note.show()
    } catch (err) {
      release()
      throw err
    }
  })

  ipcMain.on(DESKTOP_IPC.badge, (e, count: unknown) => {
    if (!fromApp(e) || typeof count !== 'number' || !Number.isFinite(count)) return
    setDesktopBadge(count)
  })
}
