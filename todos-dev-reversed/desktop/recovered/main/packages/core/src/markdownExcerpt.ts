import { CHIEF_THREAD_TITLE_MAX_CHARS } from '@tds/types'

// Markdown collapsed into one line of plain text, for the surfaces that show what a message said
// without being able to render it: a document card's body, an inbox row, a push notification.
// Those all draw a bare string, so the markup has to be gone before it gets there — otherwise a
// chief reply reaches the lock screen as `[#361](todo:3rQARaELAUx69BASFFsQc) 已合入 **done**`.

// A hard-wrapped line is a source-file convenience, not a space. Collapsing it to one is right
// between Latin words and wrong between CJK characters, where the join is seamless — so the break
// goes away entirely when both sides are CJK, and becomes a space otherwise.
const CJK = '\\u3000-\\u9fff\\uff00-\\uffef'
const CJK_WRAP = new RegExp(`([${CJK}])[ \\t]*\\r?\\n[ \\t]*(?=[${CJK}])`, 'g')

// `[label](href)` keeps its label and drops the address — the label is the words a reader was meant
// to see, and this covers the chip schemes (todo:, project:, agent:, doc:) as well as web links,
// whose href is dead weight in a preview either way. `!` in front makes it an image; the alt text
// is still the closest thing to words it has.
const LINK = /!?\[([^\]]*)\]\((?:[^()\s]|\([^()]*\))*\)/g

export function markdownExcerpt(md: string): string {
  if (!md) return ''
  return md
    // Before the markers go: a line that opens one (`- `, `> `) is a new block, never the
    // continuation of the CJK sentence above it, and once stripped it would read as one.
    .replace(CJK_WRAP, '$1')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^[ \t]*#{1,6}[ \t]+/gm, '')
    .replace(/^[ \t]*(?:[-*_][ \t]*){3,}$/gm, '')
    // Indent only — a marker rule that ate the blank line before it would run two blocks together.
    .replace(/^[ \t]*[-*+][ \t]+/gm, '')
    .replace(/^[ \t]*\d+[.)][ \t]+/gm, '')
    .replace(/^[ \t]*>[ \t]?/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(LINK, '$1')
    .replace(/<(https?:\/\/[^>\s]+)>/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

// A clipped title is at most `units` CJK characters or half as many words — ten and five by
// default — or the mix that adds up the same, with a character costing one unit and a word two. Punctuation is free, and a clip drops whatever
// punctuation it would otherwise end on. A run is a word for its first six characters and width
// past that, a unit per two, so a path or URL is priced as the several words wide it is rather
// than slipping through as one. When the run is what breaks the budget it is cut to the width left.
const TITLE_UNITS = 10
const TITLE_MAX = 60
const WORD_CHARS = 6
const HAN = '\\u3040-\\u30ff\\u3400-\\u9fff\\uac00-\\ud7af'
const CJK_CHAR = new RegExp(`^[${HAN}]$`)
const TOKEN = new RegExp(`[${HAN}]|[^\\s${HAN}]+`, 'g')
const PUNCT_ONLY = /^[　-〿＀-￯‐-‧‰-⁞!-/:-@[-`{-~]+$/
const TRAILING_PUNCT = /[\s　-〿＀-￯‐-‧‰-⁞!-/:-@[-`{-~]+$/

const runSpan = (units: number) => WORD_CHARS + 2 * units
const runCost = (run: string) => Math.max(2, Math.ceil((run.length - WORD_CHARS) / 2))

export function clipTitle(line: string, units = TITLE_UNITS): string {
  let used = 0
  let end = 0
  TOKEN.lastIndex = 0
  for (let m = TOKEN.exec(line); m; m = TOKEN.exec(line)) {
    const cost = PUNCT_ONLY.test(m[0]) ? 0 : CJK_CHAR.test(m[0]) ? 1 : runCost(m[0])
    if (used + cost > units) {
      // Under four units a cut run would say nothing; it goes like a word.
      const left = units - used
      const cut = left >= 4 ? m.index + runSpan(left) - 1 : end
      return `${line.slice(0, cut).replace(TRAILING_PUNCT, '')}…`
    }
    used += cost
    end = m.index + m[0].length
  }
  // Punctuation is free, so a line of it alone still needs the length cap.
  return line.length > TITLE_MAX ? `${line.slice(0, TITLE_MAX - 1)}…` : line
}

// A chief thread's title from its first message: its first non-blank line as plain text, kept whole
// up to the title cap — the header clips it for display and shows it in full on hover. Shared so
// the sender's list row can carry the title the server is about to write.
export function autoTitleFrom(content: string): string | null {
  const line = markdownExcerpt(content.split('\n').find(s => s.trim()) ?? '')
  if (!line) return null
  return line.length > CHIEF_THREAD_TITLE_MAX_CHARS ? `${line.slice(0, CHIEF_THREAD_TITLE_MAX_CHARS - 1)}…` : line
}
