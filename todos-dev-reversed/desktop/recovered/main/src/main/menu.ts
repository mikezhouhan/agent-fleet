import { join } from 'node:path'
import { app, Menu, nativeImage, shell, Tray, type MenuItemConstructorOptions } from 'electron'
import { APP_ORIGIN } from '../shared/appUrl'
import { FEED_URL } from './forcedUpdate'
import { logPath } from './machine/worker'
import { checkForUpdates, onUpdateState, reloadToUpdate, restartToUpdate, updateState } from './updater'
import { getMainWindow, setHideOnClose, showMainWindow } from './window'

let tray: Tray | null = null
let unreadIcon: Electron.NativeImage | null = null

export function setDesktopBadge(count: number): void {
  const unread = Math.max(0, Math.floor(count))
  tray?.setToolTip(unread ? `Todos (${unread} unread)` : 'Todos')
  if (process.platform !== 'win32') {
    app.setBadgeCount(unread)
    return
  }
  if (!unreadIcon) {
    const pixels = Buffer.alloc(16 * 16 * 4)
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      if ((x - 7.5) ** 2 + (y - 7.5) ** 2 <= 49) pixels.set([68, 68, 239, 255], (y * 16 + x) * 4)
    }
    unreadIcon = nativeImage.createFromBitmap(pixels, { width: 16, height: 16 })
  }
  getMainWindow()?.setOverlayIcon(unread ? unreadIcon : null, `${unread} unread`)
}

// The update entry is shared by the application menu and tray.
function updateItem(): MenuItemConstructorOptions {
  const { state, kind, version } = updateState()
  return state !== 'ready'
    // The window comes forward: the check reports its progress and outcome there.
    ? { label: 'Check for Updates…', click: () => { showMainWindow(); checkForUpdates({ manual: true }) }, enabled: state !== 'checking' && state !== 'downloading' }
    : kind === 'web'
      ? { label: 'Reload to update', click: reloadToUpdate }
      : { label: `Restart to update${version ? ` (${version})` : ''}`, click: restartToUpdate }
}

function template(): MenuItemConstructorOptions[] {
  return [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        updateItem(),
        { type: 'separator' },
        ...(process.platform === 'darwin' ? [
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
        ] as MenuItemConstructorOptions[] : []),
        ...(process.platform === 'linux' && !process.env.APPIMAGE ? [{
          label: 'Download desktop update…',
          click: () => { void shell.openExternal(`${FEED_URL}/Todos-linux-x64.deb`) },
        }] : []),
        { role: 'quit' },
      ],
    },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        ...(!app.isPackaged ? [{ role: 'toggleDevTools' } as MenuItemConstructorOptions] : []),
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    { role: 'windowMenu' },
    {
      role: 'help',
      submenu: [
        { label: 'Todos Docs', click: () => void shell.openExternal(`${APP_ORIGIN}/docs`) },
        { label: 'Open Machine Logs', click: () => void shell.openPath(logPath()) },
      ],
    },
  ]
}

export function installMenu(): void {
  getMainWindow()?.webContents.on('did-navigate', (_event, url) => {
    const target = new URL(url)
    if (target.origin === APP_ORIGIN && target.pathname.startsWith('/login')) setDesktopBadge(0)
  })
  if (process.platform !== 'darwin') {
    try {
      tray = new Tray(nativeImage.createFromPath(join(__dirname, '../icon.png')).resize({ width: 24, height: 24 }))
      tray.setToolTip('Todos')
      tray.on('click', showMainWindow)
      if (process.platform === 'win32') setHideOnClose(true)
    } catch (err) {
      console.warn('[tray]', err)
    }
  }
  const rebuild = () => {
    Menu.setApplicationMenu(Menu.buildFromTemplate(template()))
    tray?.setContextMenu(Menu.buildFromTemplate([
      { label: 'Open Todos', click: showMainWindow },
      updateItem(),
      { label: 'Open Machine Logs', click: () => void shell.openPath(logPath()) },
      { type: 'separator' },
      { role: 'quit' },
    ]))
  }
  rebuild()
  onUpdateState(rebuild)
}
