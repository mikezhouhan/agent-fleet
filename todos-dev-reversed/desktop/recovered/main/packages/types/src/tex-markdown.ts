// A .tex file projected into markdown so the file viewer can render it through the existing
// markdown/math pipeline. A review projection, not a TeX engine: sectioning, lists, tables, figures
// and citations become markdown; every math region passes through verbatim for the math renderer;
// unknown commands drop their markup rather than leak backslashes into the prose. Layout fidelity
// (floats, numbering, page breaks) stays with the compiled PDF — this buys reading the paper's
// content without converting it by hand first.

// Stash sentinel — a private-use code point (distinct from the math pipeline's U+E000), so no
// document text collides.
const P = String.fromCharCode(0xe001)

// The `{…}` group whose opening brace is at `open`, nesting- and escape-aware.
function braced(s: string, open: number): { body: string; end: number } | null {
  let depth = 0
  for (let i = open; i < s.length; i += 1) {
    const c = s[i]
    if (c === '\\') { i += 1; continue }
    if (c === '{') depth += 1
    else if (c === '}') {
      depth -= 1
      if (depth === 0) return { body: s.slice(open + 1, i), end: i + 1 }
    }
  }
  return null
}

type Handler = (arg: string, opt?: string, arg2?: string) => string

const TWO_ARG = new Set(['href', 'setlength', 'renewcommand', 'newcommand', 'textcolor', 'setcounter'])

// Rewrites every `\name[opt]{arg}` that has a handler. Handler output is scanned again on the next
// pass, so nested commands resolve outside-in; four passes cover any sane nesting depth.
function applyCommands(src: string, handlers: Record<string, Handler>): string {
  for (let pass = 0; pass < 4; pass += 1) {
    let changed = false
    let out = ''
    let i = 0
    while (i < src.length) {
      if (src[i] !== '\\') { out += src[i]; i += 1; continue }
      const m = /^\\([a-zA-Z]+)\*?/.exec(src.slice(i))
      const handler = m && handlers[m[1]]
      if (!m || !handler) {
        const skip = m ? m[0].length : 2
        out += src.slice(i, i + skip)
        i += skip
        continue
      }
      let j = i + m[0].length
      let opt: string | undefined
      if (src[j] === '[') {
        const close = src.indexOf(']', j)
        if (close >= 0) { opt = src.slice(j + 1, close); j = close + 1 }
      }
      if (src[j] !== '{') { out += src.slice(i, j); i = j; continue }
      const a1 = braced(src, j)
      if (!a1) { out += src.slice(i, j + 1); i = j + 1; continue }
      let arg2: string | undefined
      let end = a1.end
      if (TWO_ARG.has(m[1]) && src[end] === '{') {
        const a2 = braced(src, end)
        if (a2) { arg2 = a2.body; end = a2.end }
      }
      out += handler(a1.body, opt, arg2)
      changed = true
      i = end
    }
    src = out
    if (!changed) break
  }
  return src
}

// Full-line comments vanish; a trailing unescaped `%` cuts the line.
function stripComments(src: string): string {
  const out: string[] = []
  for (const line of src.split('\n')) {
    if (/^\s*%/.test(line)) continue
    let cut = line
    for (let i = 0; i < cut.length; i += 1) {
      if (cut[i] === '\\') { i += 1; continue }
      if (cut[i] === '%') { cut = cut.slice(0, i).replace(/\s+$/, ''); break }
    }
    out.push(cut)
  }
  return out.join('\n')
}

// In TeX every `$…$` is math — none of markdown's price-pair ambiguity — so inline math re-emits as
// `\(…\)`, which the markdown math pass accepts unconditionally. Display environments become `$$`
// blocks; alignment environments keep their rows by re-wrapping as `aligned`, which the math parser
// knows.
function protectTexMath(src: string, keep: (s: string) => string): string {
  src = src.replace(
    /\\begin\{(equation|displaymath|math|align|flalign|gather|multline|eqnarray|alignat)(\*?)\}([\s\S]*?)\\end\{\1\2\}/g,
    (_, env: string, _star: string, body: string) => {
      if (env === 'alignat') body = body.replace(/^\s*\{[^}]*\}/, '')
      const inner = body.trim()
      const plain = env === 'equation' || env === 'displaymath' || env === 'math'
      return keep(`\n$$\n${plain ? inner : `\\begin{aligned}\n${inner}\n\\end{aligned}`}\n$$\n`)
    },
  )
  src = src.replace(/\$\$([\s\S]+?)\$\$/g, (_, t: string) => keep(`\n$$\n${t.trim()}\n$$\n`))
  src = src.replace(/\\\[([\s\S]+?)\\\]/g, (_, t: string) => keep(`\n$$\n${t.trim()}\n$$\n`))
  src = src.replace(/\\\(([\s\S]+?)\\\)/g, (_, t: string) => keep(`\\(${t.trim()}\\)`))
  src = src.replace(/(^|[^\\$])\$([^$]+?)\$/g, (_, pre: string, t: string) =>
    pre + keep(`\\(${t.replace(/\s*\n\s*/g, ' ').trim()}\\)`))
  return src
}

function splitCells(row: string): string[] {
  const cells: string[] = []
  let cur = ''
  for (let i = 0; i < row.length; i += 1) {
    const c = row[i]
    if (c === '\\') { cur += c + (row[i + 1] ?? ''); i += 1; continue }
    if (c === '&') { cells.push(cur); cur = ''; continue }
    cur += c
  }
  cells.push(cur)
  return cells
}

// `\multicolumn{n}{align}{body}` / `\multirow{n}{width}{body}` unwrapped to the body; multicolumn
// also reports its span so the row keeps its column count.
function unwrapSpan(cell: string): { body: string; span: number } {
  const m = /^\\(multicolumn|multirow)\s*\{/.exec(cell)
  if (!m) return { body: cell, span: 1 }
  const a = braced(cell, cell.indexOf('{'))
  const b = a && braced(cell, cell.indexOf('{', a.end))
  const c = b && braced(cell, cell.indexOf('{', b.end))
  if (!c) return { body: cell, span: 1 }
  const span = m[1] === 'multicolumn' ? Number(a!.body) || 1 : 1
  return { ...unwrapSpan(c.body.trim()), span }
}

function tabularToTable(body: string): string {
  body = body.replace(/^\s*/, '')
  // tabularx and friends lead with width/spec groups; all of them are layout, none is content.
  while (body[0] === '{') {
    const g = braced(body, 0)
    if (!g) break
    body = body.slice(g.end).replace(/^\s*/, '')
  }
  const rows: string[][] = []
  for (const raw of body.split(/\\\\(?:\[[^\]]*\])?/)) {
    const line = raw.replace(/\\(hline|toprule|midrule|bottomrule)\b/g, '')
      .replace(/\\(cmidrule|cline)\s*(\([^)]*\))?\s*\{[^}]*\}/g, '')
      .trim()
    if (!line) continue
    const cells: string[] = []
    for (const cell of splitCells(line)) {
      const { body: text, span } = unwrapSpan(cell.trim())
      cells.push(text.replace(/\|/g, '\\|'))
      for (let i = 1; i < span; i += 1) cells.push('')
    }
    rows.push(cells)
  }
  if (rows.length === 0) return ''
  const width = Math.max(...rows.map((r) => r.length))
  const pad = (r: string[]) => [...r, ...Array(width - r.length).fill('')]
  const fmt = (r: string[]) => `| ${pad(r).join(' | ')} |`
  return ['', fmt(rows[0]), `|${' --- |'.repeat(width)}`, ...rows.slice(1).map(fmt), ''].join('\n')
}

// algorithmic pseudocode, one list item per statement — a fence would lock the math inside it away
// from the math renderer, and pseudocode is mostly math. Keywords bold, comments marked the way
// algorithmicx draws them. Runs after math protection, so a multi-line formula is already one token
// and its continuation lines fold away.
function algorithmicToMarkdown(body: string): string {
  const out: string[] = []
  for (const raw of body.split('\n')) {
    const s = raw.trim()
    if (!s) continue
    if (/^\\(label|begin|end)\b/.test(s)) continue
    if (!s.startsWith('\\') && out.length) {
      out[out.length - 1] += ` ${s}`
      continue
    }
    out.push(`- ${s
      .replace(/\\Require\b/, '**Require:**')
      .replace(/\\Ensure\b/, '**Ensure:**')
      .replace(/\\State\b/, '')
      .replace(/\\Return\b/, '**return**')
      .replace(/\\For\{(.*)\}/, '**for** $1 **do**')
      .replace(/\\While\{(.*)\}/, '**while** $1 **do**')
      .replace(/\\If\{(.*)\}/, '**if** $1 **then**')
      .replace(/\\ElsIf\{(.*)\}/, '**else if** $1 **then**')
      .replace(/\\Else\b/, '**else**')
      .replace(/\\EndFor\b/, '**end for**')
      .replace(/\\EndWhile\b/, '**end while**')
      .replace(/\\EndIf\b/, '**end if**')
      .replace(/\\Comment\{([^}]*)\}/, '▷ *$1*')
      .trim()}`)
  }
  return out.join('\n')
}

// The block environments with line-level structure: lists get their markers (nested by depth),
// wrappers drop their begin/end lines and keep their content.
function convertStructure(src: string): string {
  const out: string[] = []
  const lists: ('ul' | 'ol')[] = []
  for (let line of src.split('\n')) {
    const s = line.trim()
    const begin = /^\\begin\{([a-zA-Z]+)\*?\}/.exec(s)
    if (begin) {
      const env = begin[1]
      if (lists.length === 0) out.push('')
      if (env === 'itemize' || env === 'description') lists.push('ul')
      else if (env === 'enumerate') lists.push('ol')
      else if (env === 'abstract') out.push('', '**Abstract**', '')
      else if (env === 'IEEEkeywords') out.push('', '**Index Terms**', '')
      else if (env === 'keywords') out.push('', '**Keywords**', '')
      else if (env === 'thebibliography') out.push('', '## References', '')
      continue
    }
    const end = /^\\end\{([a-zA-Z]+)\*?\}/.exec(s)
    if (end) {
      if (end[1] === 'itemize' || end[1] === 'enumerate' || end[1] === 'description') lists.pop()
      // An environment's end closes its block, so what follows can't fold onto its last line.
      // Inside a list the next line is another item or the enclosing item's continuation.
      if (lists.length === 0) out.push('')
      continue
    }
    const item = /^\\item\b(?:\[([^\]]*)\])?\s*/.exec(s)
    if (item) {
      const indent = '  '.repeat(Math.max(lists.length - 1, 0))
      const marker = lists[lists.length - 1] === 'ol' ? '1.' : '-'
      const label = item[1] ? `**${item[1]}** ` : ''
      line = `${indent}${marker} ${label}${s.slice(item[0].length)}`
    }
    out.push(line)
  }
  return out.join('\n')
}

const TYPOGRAPHIC: Record<string, string> = { '``': '“', "''": '”', '---': '—', '--': '–' }

// A line markdown reads by its opening characters: heading, list item, table row, image.
const OWN_LINE = /^\s*(#{1,6}\s|[-*+]\s|\d+\.\s|\||!\[)/
const LIST_ITEM = /^\s*([-*+]|\d+\.)\s/

// TeX reads one newline as a space and a blank line as a paragraph break; the markdown renderer
// keeps every newline, so a source hard-wrapped at 80 columns painted one source line per screen
// line. Prose folds onto its paragraph — or onto the list item it continues — while the lines
// markdown reads by their opening characters stay where they are, as does a stashed block (display
// math, a fence) sitting on a line of its own. Runs before `\\` turns into a newline, so a forced
// break survives the fold.
function unwrapParagraphs(src: string, isBlock: (line: string) => boolean): string {
  const out: string[] = []
  let open = false
  for (const raw of src.split('\n')) {
    if (!raw.trim()) { out.push(''); open = false; continue }
    if (isBlock(raw)) { out.push(raw.trim()); open = false; continue }
    if (OWN_LINE.test(raw)) { out.push(raw); open = LIST_ITEM.test(raw); continue }
    const line = raw.trim().replace(/[ \t]{2,}/g, ' ')
    if (open) out[out.length - 1] += ` ${line}`
    else out.push(line)
    open = true
  }
  return out.join('\n')
}

export function texToMarkdown(tex: string): string {
  const stash: string[] = []
  const keep = (s: string) => `${P}${stash.push(s) - 1}${P}`
  const drop = () => ''

  let body = tex
  const docAt = tex.indexOf('\\begin{document}')
  if (docAt >= 0) {
    const endAt = tex.indexOf('\\end{document}')
    const preamble = tex.slice(0, docAt)
    body = tex.slice(docAt + '\\begin{document}'.length, endAt >= 0 ? endAt : undefined)
    // Title and author live in the preamble; pull them forward so the handlers format them.
    const front = ['title', 'author'].map((name) => {
      const at = preamble.indexOf(`\\${name}`)
      const open = at >= 0 ? preamble.indexOf('{', at) : -1
      const g = open >= 0 ? braced(preamble, open) : null
      return g ? `\\${name}{${g.body}}` : ''
    }).filter(Boolean)
    if (front.length) body = `${front.join('\n')}\n${body}`
  }

  body = stripComments(body)
  // Verbatim environments become latex fences, stashed before anything else can read into them.
  body = body.replace(/\\begin\{(verbatim|lstlisting)\*?\}([\s\S]*?)\\end\{\1\*?\}/g,
    (_, _env: string, inner: string) => keep(`\n\`\`\`latex\n${inner.trim()}\n\`\`\`\n`))
  body = protectTexMath(body, keep)
  body = body.replace(/\\begin\{algorithmic\}(\[[^\]]*\])?([\s\S]*?)\\end\{algorithmic\}/g,
    (_, _opt: string, inner: string) => `\n${algorithmicToMarkdown(inner)}\n`)
  body = body.replace(/\\begin\{tabular[a-zA-Z*]*\}([\s\S]*?)\\end\{tabular[a-zA-Z*]*\}/g,
    (_, inner: string) => tabularToTable(inner))
  body = convertStructure(body)

  body = applyCommands(body, {
    title: (a) => `# ${a}\n`,
    author: (a) => `*${a.replace(/\\and\b/g, ', ')}*\n`,
    section: (a) => `\n## ${a}\n`,
    subsection: (a) => `\n### ${a}\n`,
    subsubsection: (a) => `\n#### ${a}\n`,
    paragraph: (a) => `\n\n**${a}** `,
    textbf: (a) => `**${a}**`,
    textit: (a) => `*${a}*`,
    emph: (a) => `*${a}*`,
    underline: (a) => a,
    textsc: (a) => a,
    mbox: (a) => a,
    texttt: (a) => keep(`\`${a}\``),
    url: (a) => keep(`<${a}>`),
    href: (a, _o, text) => keep(`[${text ?? a}](${a})`),
    cite: (a) => `[${a}]`,
    citep: (a) => `[${a}]`,
    citet: (a) => `[${a}]`,
    ref: (a) => `[${a}]`,
    eqref: (a) => `(${a})`,
    autoref: (a) => `[${a}]`,
    cref: (a) => `[${a}]`,
    Cref: (a) => `[${a}]`,
    footnote: (a) => ` (${a})`,
    textcolor: (_c, _o, text) => text ?? '',
    keywords: (a) => `\n\n**Keywords** ${a}\n\n`,
    caption: (a) => `\n\n*${a}*\n\n`,
    includegraphics: (a) => `\n\n![](${a})\n\n`,
    bibitem: (a) => `\n- **[${a}]** `,
    label: drop,
    vspace: drop,
    hspace: drop,
    setlength: drop,
    renewcommand: drop,
    newcommand: drop,
    bibliographystyle: drop,
    bibliography: drop,
    thanks: drop,
    setcounter: drop,
    pagestyle: drop,
    thispagestyle: drop,
  })

  const soleToken = new RegExp(`^\\s*${P}(\\d+)${P}\\s*$`)
  body = unwrapParagraphs(
    body
      .replace(/\\(par|newpage|clearpage|maketitle)\b/g, '\n\n')
      .replace(/\\(newline|linebreak)\b/g, '\\\\'),
    (line) => { const m = soleToken.exec(line); return !!m && stash[Number(m[1])].startsWith('\n') },
  )

  body = body
    .replace(/[ \t]*\\\\(\[[^\]]*\])?[ \t]*/g, '\n')
    .replace(/\\([%&_#$~])/g, '$1')
    // `\ ` is a space TeX won't stretch; `\/`, `\-` and `\@` shape the typesetting and say nothing.
    .replace(/\\ /g, ' ')
    .replace(/\\[/@-]/g, '')
    .replace(/~/g, ' ')
    // TeX's quotes and dashes, in prose only: math, code and links are stashed by now, and a
    // table's own rule line is matched whole so its dashes stay. Left as written, a pair of
    // backticks opens a markdown code span.
    .replace(/^\|(?: --- \|)+$|``|''|---|--/gm, (m) => TYPOGRAPHIC[m] ?? m)
    // Whatever command survives to here has no markdown meaning; its name goes, its braces follow.
    .replace(/\\[a-zA-Z]+\*?/g, '')
    .replace(/[{}]/g, '')
    .replace(/\n{3,}/g, '\n\n')

  // Stash entries can carry earlier stash tokens (math inside a table cell), so restore loops.
  const token = new RegExp(`${P}(\\d+)${P}`, 'g')
  for (let pass = 0; pass < 3 && body.includes(P); pass += 1) {
    body = body.replace(token, (_, n: string) => stash[Number(n)] ?? '')
  }
  return `${body.replace(/\n{3,}/g, '\n\n').trim()}\n`
}
