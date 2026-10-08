// A LaTeX subset parsed into a tree the chat renderers lay out themselves.
//
// Not KaTeX: 250KB+ of dependency for the fraction of messages that carry a formula loses the web
// bundle rule, and its HTML output is unusable on native anyway. What this parser doesn't know
// survives as a `raw` node and draws as its own source text, so an exotic formula degrades one span
// at a time instead of collapsing the block.

export type MathNode =
  // Variables, digits, delimiters, function names — whatever carries no spacing of its own.
  | { k: 'sym'; v: string; italic?: boolean; bold?: boolean }
  | { k: 'bin'; v: string }
  | { k: 'rel'; v: string }
  | { k: 'punct'; v: string }
  | { k: 'space'; em: number }
  | { k: 'group'; body: MathNode[] }
  // `limits` = the script belongs above/below its base in display mode (∑, ∫, lim).
  | { k: 'script'; base: MathNode; sub?: MathNode[]; sup?: MathNode[]; limits?: boolean }
  | { k: 'frac'; num: MathNode[]; den: MathNode[] }
  | { k: 'sqrt'; body: MathNode[]; index?: MathNode[] }
  | { k: 'fence'; open: string; close: string; body: MathNode[] }
  // matrix/cases/aligned. `align` = column-aligned rows with no delimiters.
  | { k: 'grid'; rows: MathNode[][][]; open: string; close: string; align: boolean }
  | { k: 'raw'; v: string }

const GREEK: Record<string, string> = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ϵ', varepsilon: 'ε', zeta: 'ζ',
  eta: 'η', theta: 'θ', vartheta: 'ϑ', iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν',
  xi: 'ξ', omicron: 'ο', pi: 'π', varpi: 'ϖ', rho: 'ρ', varrho: 'ϱ', sigma: 'σ', varsigma: 'ς',
  tau: 'τ', upsilon: 'υ', phi: 'ϕ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ',
  Upsilon: 'Υ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
}

const BIN: Record<string, string> = {
  times: '×', div: '÷', pm: '±', mp: '∓', cdot: '⋅', ast: '∗', star: '⋆', circ: '∘',
  bullet: '∙', oplus: '⊕', ominus: '⊖', otimes: '⊗', oslash: '⊘', odot: '⊙',
  cup: '∪', cap: '∩', uplus: '⊎', sqcup: '⊔', sqcap: '⊓', setminus: '∖', smallsetminus: '∖',
  wedge: '∧', land: '∧', vee: '∨', lor: '∨', triangleleft: '◁', triangleright: '▷',
}

const REL: Record<string, string> = {
  le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠', equiv: '≡', approx: '≈',
  cong: '≅', sim: '∼', simeq: '≃', propto: '∝', asymp: '≍', doteq: '≐',
  in: '∈', notin: '∉', ni: '∋', subset: '⊂', subseteq: '⊆', supset: '⊃', supseteq: '⊇',
  sqsubseteq: '⊑', sqsupseteq: '⊒', mid: '∣', nmid: '∤', parallel: '∥', perp: '⊥',
  models: '⊨', vdash: '⊢', dashv: '⊣', ll: '≪', gg: '≫', prec: '≺', succ: '≻',
  preceq: '⪯', succeq: '⪰', leqslant: '⩽', geqslant: '⩾',
  to: '→', rightarrow: '→', longrightarrow: '⟶', Rightarrow: '⇒',
  Longrightarrow: '⟹', leftarrow: '←', longleftarrow: '⟵', Leftarrow: '⇐', gets: '←',
  leftrightarrow: '↔', Leftrightarrow: '⇔', longleftrightarrow: '⟷', mapsto: '↦',
  implies: '⟹', impliedby: '⟸', iff: '⟺', uparrow: '↑', downarrow: '↓',
  nearrow: '↗', searrow: '↘', swarrow: '↙', nwarrow: '↖', hookrightarrow: '↪',
}

const SYM: Record<string, string> = {
  infty: '∞', partial: '∂', nabla: '∇', forall: '∀', exists: '∃', nexists: '∄',
  neg: '¬', lnot: '¬', emptyset: '∅', varnothing: '∅', aleph: 'ℵ', hbar: 'ℏ', ell: 'ℓ',
  Re: 'ℜ', Im: 'ℑ', wp: '℘', angle: '∠', measuredangle: '∡', triangle: '△', square: '□',
  degree: '°', circ_deg: '°', prime: '′', dagger: '†', ddagger: '‡', S: '§', P: '¶',
  ldots: '…', dots: '…', cdots: '⋯', vdots: '⋮', ddots: '⋱',
  therefore: '∴', because: '∵', checkmark: '✓', top: '⊤', bot: '⊥', surd: '√',
  flat: '♭', sharp: '♯', natural: '♮', clubsuit: '♣', diamondsuit: '♢', heartsuit: '♡',
  spadesuit: '♠', imath: 'ı', jmath: 'ȷ', backslash: '\\',
  langle: '⟨', rangle: '⟩', lceil: '⌈', rceil: '⌉', lfloor: '⌊', rfloor: '⌋',
  lbrace: '{', rbrace: '}', lbrack: '[', rbrack: ']', vert: '|', Vert: '‖',
  lvert: '|', rvert: '|', lVert: '‖', rVert: '‖', colon: ':',
}

// Operators whose scripts sit above and below them in display mode.
const BIG_OP: Record<string, string> = {
  sum: '∑', prod: '∏', coprod: '∐', int: '∫', iint: '∬', iiint: '∭', oint: '∮',
  bigcup: '⋃', bigcap: '⋂', bigoplus: '⨁', bigotimes: '⨂', bigvee: '⋁', bigwedge: '⋀',
  bigsqcup: '⨆', lim: 'lim', limsup: 'lim sup', liminf: 'lim inf', max: 'max', min: 'min',
  sup: 'sup', inf: 'inf', argmax: 'arg max', argmin: 'arg min',
}

// Upright multi-letter names — a variable is italic, a function name is not.
const FUNC = new Set([
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh',
  'tanh', 'coth', 'log', 'ln', 'lg', 'exp', 'det', 'dim', 'ker', 'deg', 'gcd', 'lcm',
  'Pr', 'hom', 'arg', 'mod', 'bmod', 'pmod',
])

// Widths in em, as LaTeX defines them.
const SPACE: Record<string, number> = {
  ',': 3 / 18, ':': 4 / 18, ';': 5 / 18, '!': -3 / 18, ' ': 6 / 18,
  quad: 1, qquad: 2, thinspace: 3 / 18, enspace: 0.5,
}

const ACCENT: Record<string, string> = {
  hat: '\u0302', widehat: '\u0302', bar: '\u0304', overline: '\u0304', vec: '\u20D7',
  tilde: '\u0303', widetilde: '\u0303', dot: '\u0307', ddot: '\u0308', check: '\u030C',
  breve: '\u0306', acute: '\u0301', grave: '\u0300', mathring: '\u030A',
}

// Blackboard-bold letters that actually exist as single code points; the rest fall back to the
// plain letter rather than the astral-plane block, which many UI fonts don't carry.
const BB: Record<string, string> = { C: 'ℂ', H: 'ℍ', N: 'ℕ', P: 'ℙ', Q: 'ℚ', R: 'ℝ', Z: 'ℤ' }

// Font commands, each meaning "one run in this style". `italic: false` is upright; `undefined`
// leaves what the parser decided (\boldsymbol{\theta} keeps the Greek letter's slant).
const FONT_CMD: Record<string, { bold?: boolean; italic?: boolean }> = {
  text: { italic: false }, textrm: { italic: false }, textnormal: { italic: false }, textup: { italic: false },
  mathrm: { italic: false }, mathsf: { italic: false }, mathtt: { italic: false }, mathnormal: { italic: false },
  operatorname: { italic: false }, mbox: { italic: false }, hbox: { italic: false },
  mathbf: { bold: true, italic: false }, textbf: { bold: true, italic: false },
  boldsymbol: { bold: true }, bm: { bold: true },
  mathit: { italic: true }, textit: { italic: true }, emph: { italic: true },
  mathcal: { italic: true }, mathscr: { italic: true },
}

const DELIM: Record<string, string> = {
  '(': '(', ')': ')', '[': '[', ']': ']', '|': '|', '/': '/', '.': '',
  '\\{': '{', '\\}': '}', '\\|': '‖', '\\langle': '⟨', '\\rangle': '⟩',
  '\\lceil': '⌈', '\\rceil': '⌉', '\\lfloor': '⌊', '\\rfloor': '⌋', '\\vert': '|', '\\Vert': '‖',
  '\\lvert': '|', '\\rvert': '|', '\\lVert': '‖', '\\rVert': '‖',
}

// \big … \Bigg and their l/r/m variants: a delimiter at a fixed size, which draws as the plain
// glyph here.
const SIZED_DELIM = /^(?:big|Big|bigg|Bigg)[lrm]?$/

const GRID_ENV: Record<string, { open: string; close: string; align: boolean }> = {
  matrix: { open: '', close: '', align: false },
  pmatrix: { open: '(', close: ')', align: false },
  bmatrix: { open: '[', close: ']', align: false },
  Bmatrix: { open: '{', close: '}', align: false },
  vmatrix: { open: '|', close: '|', align: false },
  Vmatrix: { open: '‖', close: '‖', align: false },
  smallmatrix: { open: '', close: '', align: false },
  cases: { open: '{', close: '', align: true },
  aligned: { open: '', close: '', align: true },
  align: { open: '', close: '', align: true },
  'align*': { open: '', close: '', align: true },
  aligned_at: { open: '', close: '', align: true },
  gathered: { open: '', close: '', align: true },
  array: { open: '', close: '', align: true },
}

const isLetter = (c: string) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')
const isDigit = (c: string) => c >= '0' && c <= '9'

class Parser {
  private i = 0

  constructor(private readonly s: string) {}

  private eof(): boolean {
    return this.i >= this.s.length
  }

  private skipSpace(): void {
    while (!this.eof() && /\s/.test(this.s[this.i])) this.i += 1
  }

  // The command name at the cursor, cursor left just past it. `\\` and `\,` are single-character
  // names, so a run of letters is only tried when the first character is one.
  private readCommand(): string {
    this.i += 1
    if (this.eof()) return ''
    if (!isLetter(this.s[this.i])) {
      const c = this.s[this.i]
      this.i += 1
      return c
    }
    const start = this.i
    while (!this.eof() && isLetter(this.s[this.i])) this.i += 1
    return this.s.slice(start, this.i)
  }

  // `{…}` as a raw string, for the commands whose argument is text rather than math.
  private readRawGroup(): string | null {
    this.skipSpace()
    if (this.s[this.i] !== '{') return null
    let depth = 0
    const start = this.i + 1
    for (let j = this.i; j < this.s.length; j += 1) {
      if (this.s[j] === '\\') { j += 1; continue }
      if (this.s[j] === '{') depth += 1
      else if (this.s[j] === '}') {
        depth -= 1
        if (depth === 0) {
          this.i = j + 1
          return this.s.slice(start, j)
        }
      }
    }
    return null
  }

  // One argument: a braced group, or the single atom that follows.
  private readArg(): MathNode[] {
    this.skipSpace()
    if (this.eof()) return []
    if (this.s[this.i] === '{') {
      this.i += 1
      const body = this.parseList('}')
      if (this.s[this.i] === '}') this.i += 1
      return body
    }
    const atom = this.parseAtom()
    return atom ? [atom] : []
  }

  private readOptional(): MathNode[] | undefined {
    this.skipSpace()
    if (this.s[this.i] !== '[') return undefined
    const close = this.s.indexOf(']', this.i)
    if (close < 0) return undefined
    const inner = this.s.slice(this.i + 1, close)
    this.i = close + 1
    return parseLatex(inner)
  }

  private readDelim(): string {
    this.skipSpace()
    if (this.s[this.i] === '\\') {
      const start = this.i
      const name = this.readCommand()
      const key = `\\${name}`
      if (key in DELIM) return DELIM[key]
      this.i = start
      return ''
    }
    const c = this.s[this.i] ?? ''
    if (c in DELIM) {
      this.i += 1
      return DELIM[c]
    }
    return ''
  }

  // Rows of cells, split on `\\` and `&`, up to the matching \end.
  private parseGrid(env: string): MathNode {
    const spec = GRID_ENV[env] ?? { open: '', close: '', align: true }
    if (env === 'array') this.readRawGroup()
    const rows: MathNode[][][] = []
    let row: MathNode[][] = []
    for (;;) {
      const cell = this.parseList('cell')
      row.push(cell)
      this.skipSpace()
      if (this.s[this.i] === '&') { this.i += 1; continue }
      if (this.s.startsWith('\\\\', this.i)) {
        this.i += 2
        rows.push(row)
        row = []
        continue
      }
      // \end{…} or a truncated source: either way the grid closes here.
      if (this.s.startsWith('\\end', this.i)) {
        this.i += 4
        this.readRawGroup()
      }
      break
    }
    if (row.some((cell) => cell.length > 0) || rows.length === 0) rows.push(row)
    return { k: 'grid', rows, open: spec.open, close: spec.close, align: spec.align }
  }

  private command(name: string): MathNode | null {
    if (name === 'frac' || name === 'dfrac' || name === 'tfrac' || name === 'cfrac') {
      return { k: 'frac', num: this.readArg(), den: this.readArg() }
    }
    if (name === 'binom' || name === 'dbinom') {
      return { k: 'fence', open: '(', close: ')', body: [{ k: 'frac', num: this.readArg(), den: this.readArg() }] }
    }
    if (name === 'sqrt') {
      const index = this.readOptional()
      return { k: 'sqrt', body: this.readArg(), index }
    }
    if (name === 'left') {
      const open = this.readDelim()
      const body = this.parseList('right')
      let close = ''
      if (this.s.startsWith('\\right', this.i)) {
        this.i += 6
        close = this.readDelim()
      }
      return { k: 'fence', open, close, body }
    }
    if (SIZED_DELIM.test(name)) {
      const delim = this.readDelim()
      return delim ? { k: 'sym', v: delim } : null
    }
    if (name === '|') return { k: 'sym', v: '‖' }
    if (name === 'begin') {
      const env = this.readRawGroup() ?? ''
      return this.parseGrid(env)
    }
    if (name in FONT_CMD) {
      if (name === 'operatorname' && this.s[this.i] === '*') this.i += 1
      const raw = this.readRawGroup()
      if (raw === null) return null
      const style = FONT_CMD[name]
      // Plain text is one run, spaces and all; a group holding commands (\boldsymbol{\theta},
      // \mathbf{\hat{x}}) is math, and the style rides onto whatever it parses to.
      if (raw.includes('\\')) return { k: 'group', body: styled(parseLatex(raw), style) }
      const run: MathNode = { k: 'sym', v: raw }
      if (style.bold) run.bold = true
      if (style.italic) run.italic = true
      return run
    }
    if (name === 'mathbb' || name === 'mathbbm') {
      const raw = this.readRawGroup()
      if (raw === null) return null
      return { k: 'sym', v: [...raw].map((c) => BB[c] ?? c).join('') }
    }
    if (name === 'overset' || name === 'underset' || name === 'stackrel') {
      const note = this.readArg()
      const base: MathNode = { k: 'group', body: this.readArg() }
      return name === 'underset'
        ? { k: 'script', base, sub: note, limits: true }
        : { k: 'script', base, sup: note, limits: true }
    }
    if (name === 'ensuremath') return { k: 'group', body: this.readArg() }
    if (name === 'hspace' || name === 'vspace') {
      if (this.s[this.i] === '*') this.i += 1
      this.readRawGroup()
      return name === 'hspace' ? { k: 'space', em: 1 } : null
    }
    if (name === 'phantom' || name === 'hphantom' || name === 'vphantom' || name === 'tag') {
      if (this.s[this.i] === '*') this.i += 1
      this.readArg()
      return null
    }
    if (name in ACCENT) {
      const body = this.readArg()
      const text = flatten(body)
      // A combining mark attaches to the character before it; an argument that isn't a plain run
      // has nothing to attach to, so it keeps its own nodes and loses the accent.
      if (!text) return { k: 'group', body }
      return { k: 'sym', v: text.replace(/^./u, (c) => c + ACCENT[name]), italic: text.length === 1 && isLetter(text) }
    }
    if (name === 'label') {
      this.readRawGroup()
      return null
    }
    if (name === 'eqref' || name === 'ref') {
      const raw = this.readRawGroup()
      if (raw === null) return null
      return { k: 'sym', v: name === 'eqref' ? `(${raw})` : raw }
    }
    if (name === 'xrightarrow' || name === 'xleftarrow') {
      const below = this.readOptional()
      const above = this.readArg()
      const base: MathNode = { k: 'rel', v: name === 'xrightarrow' ? '⟶' : '⟵' }
      if (!above.length && !below) return base
      return { k: 'script', base, sub: below, sup: above.length ? above : undefined }
    }
    // The brace draws nothing; the annotation that follows (`_{…}` / `^{…}`) attaches through
    // attachScripts like any script.
    if (name === 'underbrace' || name === 'overbrace') return { k: 'group', body: this.readArg() }
    if (name in SPACE) return { k: 'space', em: SPACE[name] }
    if (name === 'nonumber' || name === 'notag' || name === 'displaystyle' || name === 'textstyle'
      || name === 'limits' || name === 'nolimits' || name === 'scriptstyle' || name === 'scriptscriptstyle') return null
    if (name in GREEK) return { k: 'sym', v: GREEK[name], italic: /^[a-z]/.test(name) }
    if (name in BIG_OP) return { k: 'sym', v: BIG_OP[name] }
    if (name in BIN) return { k: 'bin', v: BIN[name] }
    if (name in REL) return { k: 'rel', v: REL[name] }
    if (name in SYM) return { k: 'sym', v: SYM[name] }
    if (FUNC.has(name)) return { k: 'sym', v: name }
    // An escaped literal (`\%`, `\{`, `\_`) is that character; anything else stays visible as source.
    if (name.length === 1) return { k: 'sym', v: name }
    return { k: 'raw', v: `\\${name}` }
  }

  private parseAtom(): MathNode | null {
    this.skipSpace()
    if (this.eof()) return null
    const c = this.s[this.i]
    if (c === '\\') {
      const save = this.i
      const name = this.readCommand()
      if (name === '\\' || name === 'right' || name === 'end') { this.i = save; return null }
      return this.command(name)
    }
    if (c === '{') {
      this.i += 1
      const body = this.parseList('}')
      if (this.s[this.i] === '}') this.i += 1
      return { k: 'group', body }
    }
    if (isDigit(c)) {
      const start = this.i
      while (!this.eof() && (isDigit(this.s[this.i]) || (this.s[this.i] === '.' && isDigit(this.s[this.i + 1])))) this.i += 1
      return { k: 'sym', v: this.s.slice(start, this.i) }
    }
    if (isLetter(c)) {
      const start = this.i
      while (!this.eof() && isLetter(this.s[this.i])) this.i += 1
      return { k: 'sym', v: this.s.slice(start, this.i), italic: true }
    }
    if (c === '+' || c === '-' || c === '*' || c === '/') {
      this.i += 1
      return { k: 'bin', v: c === '-' ? '−' : c === '*' ? '∗' : c }
    }
    if (c === '=' || c === '<' || c === '>' || c === '~') {
      this.i += 1
      return { k: 'rel', v: c === '~' ? '∼' : c }
    }
    if (c === ',' || c === ';') {
      this.i += 1
      return { k: 'punct', v: c }
    }
    if (c === '.' && this.s.startsWith('...', this.i)) {
      this.i += 3
      return { k: 'sym', v: '…' }
    }
    if (c === "'") {
      let n = 0
      while (this.s[this.i] === "'") { this.i += 1; n += 1 }
      return { k: 'sym', v: '′'.repeat(n) }
    }
    this.i += 1
    return { k: 'sym', v: c }
  }

  // `stop` is what ends this list: a closing brace, `\right`, or a grid cell boundary.
  parseList(stop: '}' | 'right' | 'cell' | 'eof'): MathNode[] {
    const out: MathNode[] = []
    for (;;) {
      this.skipSpace()
      if (this.eof()) break
      const c = this.s[this.i]
      if (stop === '}' && c === '}') break
      if (stop === 'right' && this.s.startsWith('\\right', this.i)) break
      if (stop === 'cell' && (c === '&' || this.s.startsWith('\\\\', this.i) || this.s.startsWith('\\end', this.i))) break
      // A stray closer at this level would otherwise loop forever.
      if (c === '}') { this.i += 1; continue }

      let node: MathNode | null
      if (c === '_' || c === '^') node = { k: 'sym', v: '' }
      else {
        const before = this.i
        node = this.parseAtom()
        if (!node) {
          // A swallowed command (\label, \nonumber) moved the cursor and draws nothing; a stop
          // token left it in place and ends the list.
          if (this.i > before) continue
          break
        }
      }
      out.push(this.attachScripts(node))
    }
    return out
  }

  // `_` / `^` bind to the atom before them, in either order and at most once each.
  private attachScripts(base: MathNode): MathNode {
    let sub: MathNode[] | undefined
    let sup: MathNode[] | undefined
    for (;;) {
      this.skipSpace()
      // `\sum\limits_{i}`: the modifier sits between the base and its script.
      if (this.s.startsWith('\\limits', this.i)) { this.i += 7; continue }
      if (this.s.startsWith('\\nolimits', this.i)) { this.i += 9; continue }
      const c = this.s[this.i]
      if (c !== '_' && c !== '^') break
      this.i += 1
      const arg = this.readArg()
      if (c === '_') sub = sub ? [...sub, ...arg] : arg
      else sup = sup ? [...sup, ...arg] : arg
    }
    if (!sub && !sup) return base
    const limits = base.k === 'sym' && LIMIT_GLYPHS.has(base.v)
    return { k: 'script', base, sub, sup, limits }
  }
}

// Bases whose scripts stack above/below in display mode.
const LIMIT_GLYPHS = new Set(['∑', '∏', '∐', '⋃', '⋂', '⨁', '⨂', '⋁', '⋀', '⨆', 'lim', 'lim sup', 'lim inf', 'max', 'min', 'sup', 'inf', 'arg max', 'arg min'])

// The run with a font command's style applied to every symbol it reaches.
function styled(nodes: MathNode[], style: { bold?: boolean; italic?: boolean }): MathNode[] {
  return nodes.map((n): MathNode => {
    switch (n.k) {
      case 'sym': return { ...n, ...style }
      case 'group': return { ...n, body: styled(n.body, style) }
      case 'script': return { ...n, base: styled([n.base], style)[0], sub: n.sub && styled(n.sub, style), sup: n.sup && styled(n.sup, style) }
      case 'frac': return { ...n, num: styled(n.num, style), den: styled(n.den, style) }
      case 'sqrt': return { ...n, body: styled(n.body, style), index: n.index && styled(n.index, style) }
      case 'fence': return { ...n, body: styled(n.body, style) }
      case 'grid': return { ...n, rows: n.rows.map((row) => row.map((cell) => styled(cell, style))) }
      default: return n
    }
  })
}

// The plain characters a node run spells, or '' when it holds anything a string can't carry.
function flatten(nodes: MathNode[]): string {
  let out = ''
  for (const n of nodes) {
    if (n.k === 'sym' || n.k === 'bin' || n.k === 'rel' || n.k === 'punct' || n.k === 'raw') out += n.v
    else if (n.k === 'group') {
      const inner = flatten(n.body)
      if (!inner && n.body.length > 0) return ''
      out += inner
    } else return ''
  }
  return out
}

export function parseLatex(tex: string): MathNode[] {
  return new Parser(tex).parseList('eof')
}

// ─── Unicode scripts ──────────────────────────────────────────────────────────
//
// A sub/superscript that maps to real code points needs no layout at all: it sits on the text's own
// line box, copies as text, and lands identically on both platforms. Everything below is only
// reached when it doesn't.

const SUP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸',
  '9': '⁹', '+': '⁺', '−': '⁻', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', 'n': 'ⁿ', 'i': 'ⁱ',
  a: 'ᵃ', b: 'ᵇ', c: 'ᶜ', d: 'ᵈ', e: 'ᵉ', f: 'ᶠ', g: 'ᵍ', h: 'ʰ', j: 'ʲ', k: 'ᵏ', l: 'ˡ',
  m: 'ᵐ', o: 'ᵒ', p: 'ᵖ', r: 'ʳ', s: 'ˢ', t: 'ᵗ', u: 'ᵘ', v: 'ᵛ', w: 'ʷ', x: 'ˣ', y: 'ʸ',
  z: 'ᶻ', A: 'ᴬ', B: 'ᴮ', D: 'ᴰ', E: 'ᴱ', G: 'ᴳ', H: 'ᴴ', I: 'ᴵ', J: 'ᴶ', K: 'ᴷ', L: 'ᴸ',
  M: 'ᴹ', N: 'ᴺ', O: 'ᴼ', P: 'ᴾ', R: 'ᴿ', T: 'ᵀ', U: 'ᵁ', V: 'ⱽ', W: 'ᵂ', 'α': 'ᵅ', 'β': 'ᵝ',
  'γ': 'ᵞ', 'δ': 'ᵟ', 'ε': 'ᵋ', 'ϵ': 'ᵋ', 'ι': 'ᶥ', 'θ': 'ᶿ', 'ϕ': 'ᵠ', 'φ': 'ᵠ', 'χ': 'ᵡ',
  'υ': 'ᶹ', '′': '′', '∗': '*', '…': '…', ',': ',', '.': '.',
}

const SUB: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈',
  '9': '₉', '+': '₊', '−': '₋', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
  a: 'ₐ', e: 'ₑ', h: 'ₕ', i: 'ᵢ', j: 'ⱼ', k: 'ₖ', l: 'ₗ', m: 'ₘ', n: 'ₙ', o: 'ₒ', p: 'ₚ',
  r: 'ᵣ', s: 'ₛ', t: 'ₜ', u: 'ᵤ', v: 'ᵥ', x: 'ₓ', 'β': 'ᵦ', 'γ': 'ᵧ', 'ρ': 'ᵨ', 'φ': 'ᵩ',
  'ϕ': 'ᵩ', 'χ': 'ᵪ', '…': '…', ',': ',',
}

// The characters whose script forms live in the Superscripts and Subscripts block, drawn as one set.
// The rest of the tables come from the phonetic and modifier-letter blocks, cut to other metrics, so
// a run that mixes the two steps up and down (`Iᵢₙ`, `ₙₒᵣₘ`). One character has nothing to step
// against.
const SUP_UNIFORM = new Set('0123456789+−-=()ni′…,.')
const SUB_UNIFORM = new Set('0123456789+−-=()aeoxhklmnpst…,')

// The run rendered as real sub/superscript code points, or null when even one character has none —
// or, with `uniform`, when a multi-character run would mix blocks and the caller can lay it out
// instead.
export function unicodeScript(nodes: MathNode[], kind: 'sub' | 'sup', uniform = false): string | null {
  const text = flatten(nodes)
  if (!text) return null
  const table = kind === 'sub' ? SUB : SUP
  const allowed = uniform && text.length > 1 ? (kind === 'sub' ? SUB_UNIFORM : SUP_UNIFORM) : null
  let out = ''
  for (const c of text) {
    if (allowed && !allowed.has(c)) return null
    const mapped = table[c]
    if (mapped === undefined) return null
    out += mapped
  }
  return out
}
