import { systemPreferences, type Session } from 'electron'

// What the app's origin may ask the OS for: the microphone (voice dictation), the camera (QR
// sign-in scanner), notifications and the clipboard. Nothing for any other origin the window
// passes through.
const ALLOWED = new Set(['media', 'notifications', 'clipboard-read', 'clipboard-sanitized-write', 'fullscreen'])

function originOf(url: string | undefined): string | null {
  try {
    return url ? new URL(url).origin : null
  } catch {
    return null
  }
}

export function installPermissions(ses: Session, appOrigin: string): void {
  ses.setPermissionCheckHandler((_wc, permission, requestingOrigin) =>
    ALLOWED.has(permission) && originOf(requestingOrigin) === appOrigin)

  ses.setPermissionRequestHandler((_wc, permission, callback, details) => {
    if (!ALLOWED.has(permission) || originOf(details.requestingUrl) !== appOrigin) return callback(false)
    if (permission !== 'media' || process.platform !== 'darwin') return callback(true)
    // Ask TCC ourselves first so the system prompt appears once, at the moment of use, rather than
    // whenever Chromium gets around to it.
    const types = (details as { mediaTypes?: string[] }).mediaTypes ?? []
    const asks = [
      types.includes('audio') ? systemPreferences.askForMediaAccess('microphone') : Promise.resolve(true),
      types.includes('video') ? systemPreferences.askForMediaAccess('camera') : Promise.resolve(true),
    ]
    void Promise.all(asks).then((granted) => callback(granted.every(Boolean)), () => callback(false))
  })
}
