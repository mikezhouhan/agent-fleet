// Where the shell's window lives. Shared by main and preload, so no electron import here.
//
// The default is the production app; TDS_DESKTOP_APP_URL points a dev shell at the Metro dev server
// (http://localhost:8081/, where the SPA is mounted at / and the API is forwarded to Next — see
// apps/app/metro.config.js). It must be a full URL: the SPA's mount differs between the two.
export const APP_URL = process.env.TDS_DESKTOP_APP_URL ?? 'https://todos.dev/app'
export const APP_ORIGIN = new URL(APP_URL).origin

// The production mount of the SPA on its origin (apps/app/app.json `experiments.baseUrl`).
export const APP_MOUNT = '/app'

export function isAppPath(pathname: string): boolean {
  return pathname === APP_MOUNT || pathname.startsWith(`${APP_MOUNT}/`)
}
