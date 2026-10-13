// The longest RGI emoji (a kiss with two skin tones) is 15 UTF-16 units.
export const CHIEF_THREAD_EMOJI_MAX_CHARS = 16

// One emoji cluster: a flag pair, a keycap, a pictograph with optional skin tone / VS16 and any
// ZWJ-joined companions, or a tag-sequence subdivision flag. Built at runtime so a JS engine
// without property escapes (older Hermes) still loads the module and falls back to a loose check —
// the server is the authority either way.
const PICTO = '\\p{Extended_Pictographic}(?:\\uFE0F|\\p{Emoji_Modifier})*'
const EMOJI_SRC = `^(?:\\p{Regional_Indicator}{2}|[0-9#*]\\uFE0F?\\u20E3|${PICTO}(?:\\u200D${PICTO})*|\\u{1F3F4}[\\u{E0061}-\\u{E007A}]+\\u{E007F})$`
let emojiRe: RegExp | null = null
try { emojiRe = new RegExp(EMOJI_SRC, 'u') } catch { /* no property escapes */ }
const LOOSE_RE = /^[^\x00-\x7F\s]+$/

const segmenter = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  : null

export function isSingleEmoji(s: string): boolean {
  if (!s || s.length > CHIEF_THREAD_EMOJI_MAX_CHARS || !(emojiRe ?? LOOSE_RE).test(s)) return false
  if (!segmenter) return true
  let n = 0
  for (const _ of segmenter.segment(s)) if (++n > 1) return false
  return n === 1
}
