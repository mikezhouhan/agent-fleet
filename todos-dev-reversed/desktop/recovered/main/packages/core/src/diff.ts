import type { Tree } from '@lezer/common'
import { highlightTree, tagHighlighter, tags, type Tag } from '@lezer/highlight'

// Unified-diff parsing, GitHub-style collapsing, and syntax tokenization — shared by the web change
// review (ChangesDiffViewer/FileDiffBlock) and the native one. All of it is string math over
// @lezer/highlight, which is plain JS: no CodeMirror, no DOM, so the same code runs under Hermes.

// Single source of truth for syntax-highlight colors, feeding three consumers: the web file viewer
// (a CodeMirror HighlightStyle), the web diff (a static tagHighlighter + inline styles) and the
// native views (RN TextStyle). Medium-saturation hues readable on both light and dark surfaces.
//
// Values stay platform-neutral, which is why fontWeight/opacity are numbers rather than the CSS
// strings web would use: React Native's TextStyle rejects '600', csstype rejects the string form
// too, and both accept the number. The one theme-aware entry (comment) carries its literal
// fallback here; web swaps in the `var(--text-tertiary)` form (see components/lib/codeHighlight).
export type TokenStyle = {
  color?: string
  fontStyle?: 'italic'
  fontWeight?: 600
  opacity?: number
}
export type SyntaxStyle = TokenStyle & { tag: Tag | readonly Tag[] }

// The palette's one theme-dependent entry, exported so each client can re-colour it without
// importing @lezer/highlight itself: comments follow the surface's tertiary text (web swaps in
// var(--text-tertiary), native builds a styler per theme) with the value below as the fallback.
export const COMMENT_TAG = tags.comment

export const SYNTAX_STYLES: readonly SyntaxStyle[] = [
  { tag: tags.keyword, color: '#8b5cf6' },
  { tag: tags.string, color: '#10b981' },
  { tag: tags.number, color: '#d97706' },
  { tag: tags.bool, color: '#d97706' },
  { tag: tags.comment, color: '#94a3b8', fontStyle: 'italic' },
  { tag: tags.typeName, color: '#0d9488' },
  { tag: tags.className, color: '#0d9488' },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: '#6366f1' },
  { tag: tags.propertyName, color: '#0284c7' },
  { tag: tags.definition(tags.variableName), color: '#0284c7' },
  { tag: tags.tagName, color: '#dc2626' },
  { tag: tags.attributeName, color: '#d97706' },
  { tag: tags.heading, fontWeight: 600 },
  { tag: tags.link, color: '#6366f1' },
  { tag: tags.meta, opacity: 0.6 },
]

// Each palette entry becomes a class (tk<i>) the tokenizer emits and a style object applied to that
// token's run. Callers map the style onto their platform's style object.
const highlighter = tagHighlighter(SYNTAX_STYLES.map((s, i) => ({ tag: s.tag, class: `tk${i}` })))

// Resolve a token class back to its style. Takes the palette so a platform can substitute values
// (web swaps the comment color for a CSS variable) without re-deriving the tk<i> convention — the
// tag order is what the highlighter emits against, and an override keeps that order.
export function createSpanStyler(styles: readonly SyntaxStyle[]): (cls: string) => TokenStyle {
  const byClass: Record<string, TokenStyle> = Object.fromEntries(
    styles.map((s, i) => { const { tag: _tag, ...style } = s; return [`tk${i}`, style] }),
  )
  // A span can carry several classes (markdown emits heading+meta on one token), so they merge.
  return (cls) => cls.indexOf(' ') < 0 ? byClass[cls] : Object.assign({}, ...cls.split(' ').map(c => byClass[c]))
}

export const spanStyle = createSpanStyler(SYNTAX_STYLES)

const PATCH_HEADER_PREFIXES = [
  'diff --git', 'index ', '--- ', '+++ ', 'new file mode', 'deleted file mode',
  'old mode', 'new mode', 'similarity index', 'rename ', 'copy ',
] as const

export type RowKind = 'hunk' | 'add' | 'del' | 'ctx' | 'meta'
// A code row carries its stripped text plus where it lives — `new` side (context + additions) or `old`
// side (deletions). The side+line index pull highlight spans from that side's tokenized file. oldNo/newNo
// are the 1-based file line numbers (from the @@ headers) shown in the gutter.
export type Row =
  | { kind: 'hunk' | 'meta'; text: string }
  | { kind: 'ctx' | 'add' | 'del'; text: string; side: 'new' | 'old'; line: number; oldNo: number | null; newNo: number | null }

// Split a unified diff patch into rows, and reconstruct the new (context+add) and old (context+del) file
// texts. Each side is valid source, so tokenizing it whole highlights multi-line constructs (block
// comments, template strings, JSX) correctly — a per-line pass can't. Header lines are dropped (the file
// block header already conveys them); markers (+/-/space) are stripped so columns align with the tokens.
export function parseDiff(patch: string): { rows: Row[]; newText: string; oldText: string; maxLineNo: number } {
  const rows: Row[] = []
  const newLines: string[] = []
  const oldLines: string[] = []
  let oldNo = 1
  let newNo = 1
  for (const line of patch.split('\n')) {
    if (PATCH_HEADER_PREFIXES.some(p => line.startsWith(p))) continue
    if (line.startsWith('@@')) {
      const m = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line)
      if (m) { oldNo = parseInt(m[1], 10); newNo = parseInt(m[2], 10) }
      rows.push({ kind: 'hunk', text: line })
      continue
    }
    if (line[0] === '\\') { rows.push({ kind: 'meta', text: line }); continue }
    if (line[0] === '+') { const t = line.slice(1); rows.push({ kind: 'add', text: t, side: 'new', line: newLines.length, oldNo: null, newNo: newNo++ }); newLines.push(t); continue }
    if (line[0] === '-') { const t = line.slice(1); rows.push({ kind: 'del', text: t, side: 'old', line: oldLines.length, oldNo: oldNo++, newNo: null }); oldLines.push(t); continue }
    const t = line[0] === ' ' ? line.slice(1) : line
    rows.push({ kind: 'ctx', text: t, side: 'new', line: newLines.length, oldNo: oldNo++, newNo: newNo++ })
    newLines.push(t); oldLines.push(t)
  }
  return { rows, newText: newLines.join('\n'), oldText: oldLines.join('\n'), maxLineNo: Math.max(oldNo - 1, newNo - 1, 1) }
}

// Which side of the change a file sits on, read from git's own header markers. Works on provider
// patches and the server's synthesized binary placeholders alike —
// binary patches have no @@ hunks, so these markers are the only status signal a patch carries.
export type PatchStatus = 'added' | 'removed' | 'renamed' | 'modified'

export function patchStatus(patch: string): PatchStatus {
  if (/^rename from /m.test(patch)) return 'renamed'
  if (/^(new file mode |--- \/dev\/null$)/m.test(patch)) return 'added'
  if (/^(deleted file mode |\+\+\+ \/dev\/null$)/m.test(patch)) return 'removed'
  return 'modified'
}

// GitHub-style collapsing: full-context patches carry the whole file, but by default only changed lines
// plus CONTEXT lines around them are shown — the long unchanged stretches collapse into an expander.
// Faster to render (far fewer rows) and easier to read, while the hidden lines are already in memory so
// expanding needs no fetch. Runs shorter than MIN_GAP stay inline (a bar wouldn't save anything).
const CONTEXT = 3
const MIN_GAP = 4

export type DisplayItem =
  | { type: 'row'; row: Row; key: number }
  | { type: 'gap'; key: number; rows: Row[] }

export function buildDisplayItems(rows: Row[]): DisplayItem[] {
  const n = rows.length
  const isChange = (r: Row) => r.kind === 'add' || r.kind === 'del'
  // distance (in rows) to the nearest change, scanning each direction once.
  const dPrev: number[] = new Array(n)
  let prev = -Infinity
  for (let i = 0; i < n; i++) { if (isChange(rows[i])) prev = i; dPrev[i] = i - prev }
  const dNext: number[] = new Array(n)
  let next = Infinity
  for (let i = n - 1; i >= 0; i--) { if (isChange(rows[i])) next = i; dNext[i] = next - i }

  // A ctx row hides only when it's far from every change; everything else (add/del/hunk/meta) always shows.
  const vis = rows.map((r, i) => r.kind !== 'ctx' || Math.min(dPrev[i], dNext[i]) <= CONTEXT)
  const items: DisplayItem[] = []
  for (let i = 0; i < n;) {
    if (vis[i]) { items.push({ type: 'row', row: rows[i], key: i }); i++; continue }
    let j = i; while (j < n && !vis[j]) j++
    // A short hidden run isn't worth an expander bar — show it inline.
    if (j - i < MIN_GAP) for (let k = i; k < j; k++) items.push({ type: 'row', row: rows[k], key: k })
    else items.push({ type: 'gap', key: i, rows: rows.slice(i, j) })
    i = j
  }
  return items
}

export type Span = { from: number; to: number; cls: string }

// Anything that turns source text into a lezer Tree. Kept structural on purpose: web passes the
// parser off a CodeMirror LanguageSupport, native passes a bare @lezer/* parser, and this package
// depends on neither.
export type HighlightParser = { parse(text: string): Tree }

// Tokenize `text` and bucket the highlight spans per line (offsets relative to each line start). A token
// can cross newlines (block comment / template string), so it's split at line boundaries. Returns one
// Span[] per line, indexable by the Row.line set in parseDiff.
export function highlightLines(text: string, parser: HighlightParser): Span[][] {
  const starts = [0]
  for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) starts.push(i + 1)
  const lines: Span[][] = starts.map(() => [])
  const lineAt = (pos: number) => {
    let lo = 0, hi = starts.length - 1
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= pos) lo = mid; else hi = mid - 1 }
    return lo
  }
  const tree = parser.parse(text)
  highlightTree(tree, highlighter, (from, to, cls) => {
    let pos = from
    while (pos < to) {
      const li = lineAt(pos)
      const lineEnd = li + 1 < starts.length ? starts[li + 1] - 1 : text.length
      const segEnd = Math.min(to, lineEnd)
      if (segEnd > pos) lines[li].push({ from: pos - starts[li], to: segEnd - starts[li], cls })
      pos = segEnd < lineEnd ? segEnd : lineEnd + 1
    }
  })
  return lines
}
