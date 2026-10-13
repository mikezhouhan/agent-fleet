import type { Session } from 'electron'

// The language of the shell's own pages (dist/update.html), decided before the app has rendered
// anything: the locale the app mirrors into its cookie (apps/app/lib/locale.ts,
// persistLocaleMirror), else the system's. The list and the zh narrowing restate the app's
// (packages/i18n, deviceLocale), which the shell does not depend on.

export const SHELL_LOCALES = ['en', 'zh', 'zh-TW', 'ja'] as const
export type ShellLocale = (typeof SHELL_LOCALES)[number]
const LOCALE_COOKIE = 'tds-locale'
const COOKIE_TTL_S = 365 * 24 * 3600

export function isShellLocale(v: unknown): v is ShellLocale {
  return typeof v === 'string' && (SHELL_LOCALES as readonly string[]).includes(v)
}

export function pickLocale(stored: string | null | undefined, system: string): ShellLocale {
  if (isShellLocale(stored)) return stored
  const lower = system.toLowerCase()
  if (lower.startsWith('zh')) return /hant|tw|hk|mo/.test(lower) ? 'zh-TW' : 'zh'
  const base = lower.split('-')[0]
  return isShellLocale(base) ? base : 'en'
}

export async function shellLocale(ses: Session, appOrigin: string, system: string): Promise<ShellLocale> {
  let stored: string | undefined
  try {
    stored = (await ses.cookies.get({ url: appOrigin, name: LOCALE_COOKIE }))[0]?.value
  } catch {
    // The system language then.
  }
  return pickLocale(stored, system)
}

// A language the page was switched to, kept the way the app keeps its own: the next launch's page,
// and the login page should the update lead there, read it back.
export async function rememberLocale(ses: Session, appOrigin: string, locale: ShellLocale): Promise<void> {
  try {
    await ses.cookies.set({ url: appOrigin, name: LOCALE_COOKIE, value: locale, path: '/', sameSite: 'lax', expirationDate: Math.floor(Date.now() / 1000) + COOKIE_TTL_S })
  } catch {
    // The choice still holds for this page.
  }
}
