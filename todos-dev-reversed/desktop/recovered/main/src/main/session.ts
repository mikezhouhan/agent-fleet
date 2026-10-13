import { app, ipcMain, powerMonitor, session, type Session } from 'electron'
import { DESKTOP_IPC } from '@tds/types/desktop'
import { fromApp } from './ipc'

// One persistent partition for the window: the session cookie NextAuth sets on todos.dev, the
// app's localStorage and the sockets its requests ride live here and survive relaunches.
export const PARTITION = 'persist:todos'

export function configureSession(): Session {
  const ses = session.fromPartition(PARTITION)
  // Google refuses OAuth from anything announcing itself as an embedded browser
  // (`disallowed_useragent`), and the Electron token is what it keys on. Nothing on our server
  // authorizes by user agent; it only ever displays it. The suffix keeps the shell recognizable in
  // crash reports and the QR approval page.
  const ua = ses.getUserAgent().replace(/\sElectron\/[\d.]+/, '')
  ses.setUserAgent(`${ua} TodosDesktop/${app.getVersion()}`)
  // A socket kept across a sleep, or across a change in the network under it, still looks open here
  // and is long gone on the far end; the first requests after would sit on it until Chromium's probe
  // and the app's own timeout gave up. Drop the pool on every transition the shell is told about —
  // the ones it is not (a proxy whose upstream went away announces nothing) are localApp.ts's.
  const drop = () => void ses.closeAllConnections()
  powerMonitor.on('suspend', drop)
  powerMonitor.on('resume', drop)
  ipcMain.on(DESKTOP_IPC.online, (e) => { if (fromApp(e)) drop() })
  return ses
}

// Up to 0.1.1 the https handler forwarded the window's requests through the default session, so
// that is where an existing sign-in lives. Moved over once; the jar is empty afterwards.
export async function adoptDefaultSessionCookies(ses: Session, url: string): Promise<void> {
  const jar = session.defaultSession.cookies
  for (const c of await jar.get({ url })) {
    const { name, value, path, secure, httpOnly, expirationDate, sameSite } = c
    await ses.cookies.set({ url, name, value, path, secure, httpOnly, expirationDate, sameSite })
    await jar.remove(url, name)
  }
}
