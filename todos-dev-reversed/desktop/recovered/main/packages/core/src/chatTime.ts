// Minimum gap between two consecutive messages before a fresh time divider is shown — mirrors
// WeChat, which suppresses per-message timestamps and only prints one once a conversation has
// visibly paused. 5 minutes reads as "a new burst of activity" without spamming the thread.
export const CHAT_TIME_GAP_MS = 5 * 60_000

// Whether a time divider should precede `ts` given the previous message's timestamp. Always true
// for the first message (prev == null); otherwise only once the gap exceeds the threshold.
export function shouldShowChatTime(ts: number, prev: number | null): boolean {
  if (prev == null) return true
  return ts - prev >= CHAT_TIME_GAP_MS
}

const startOfDay = (d: Date): number => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

// WeChat-style divider label: bare clock today, "Yesterday HH:MM" yesterday, weekday within the same
// week, then a month/day (year added once it differs from now). `locale` is a BCP-47 tag — each app
// maps its own locale ids before calling. `now` is injected so the value is stable to test and can be
// recomputed as the clock advances.
export function chatDividerTime(ts: number, locale: string, t: (key: string) => string, now: number = Date.now()): string {
  const d = new Date(ts)
  const nowDate = new Date(now)
  const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false }).format(d)
  const dayDiff = Math.round((startOfDay(nowDate) - startOfDay(d)) / 86_400_000)
  if (dayDiff <= 0) return time
  if (dayDiff === 1) return `${t('chat.time_yesterday')} ${time}`
  if (dayDiff < 7) {
    const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(d)
    return `${weekday} ${time}`
  }
  const sameYear = d.getFullYear() === nowDate.getFullYear()
  const datePart = new Intl.DateTimeFormat(locale, sameYear
    ? { month: 'long', day: 'numeric' }
    : { year: 'numeric', month: 'long', day: 'numeric' }).format(d)
  return `${datePart} ${time}`
}
