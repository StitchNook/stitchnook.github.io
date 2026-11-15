/**
 * Import a cross-stitch chart exported as PDF by another app (cover page,
 * "Section N" pages, legend of DMC threads). Those PDFs are vector: every
 * stitch is a small image (one image per thread) placed in a grid cell, so
 * the pattern can be rebuilt exactly, not guessed from pixels.
 *
 * A deliberately small PDF reader: plain objects + deflate streams, which is
 * what these files use. No dependency, runs in the browser and in Node.
 * Pure: no DOM, no app imports (only its texts), so it can be tested on its own.
 * The French / English keywords it looks for in the PDF are content, not UI.
 */

import { t as msg } from './pdfImport.i18n'

export type ImportedThread = {
  /** DMC reference without its prefix ("D522" → "522"). */
  code: string
  name: string
  /** Stitch count announced by the legend (null if not found). */
  declared: number | null
  /** Stitches actually rebuilt for this thread. */
  found: number
}

export type ImportedPattern = {
  name: string
  width: number
  height: number
  /** Stitches per inch announced by the cover (null if not found). */
  perInch: number | null
  declaredTotal: number | null
  threads: ImportedThread[]
  /** Thread index per cell (row-major), -1 = empty. */
  cells: Int16Array
  sections: number
  warnings: string[]
}

export class PdfFormatError extends Error {}

/* ------------------------------------------------------------ PDF basics */

type PdfObject = { dict: string; streamStart: number; streamEnd: number }

const latin1 = new TextDecoder('latin1')

function parseObjects(bytes: Uint8Array, text: string): Map<number, PdfObject> {
  const objects = new Map<number, PdfObject>()
  const re = /(\d+)\s+0\s+obj\b/g
  let match: RegExpExecArray | null
  while ((match = re.exec(text))) {
    const start = match.index + match[0].length
    const end = text.indexOf('endobj', start)
    if (end < 0) break
    const body = text.slice(start, end)
    const streamAt = body.search(/stream\r?\n/)
    let dict = body
    let streamStart = -1
    let streamEnd = -1
    if (streamAt >= 0) {
      dict = body.slice(0, streamAt)
      const eol = body.slice(streamAt).match(/stream\r?\n/)![0].length
      streamStart = start + streamAt + eol
      const length = /\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(dict)
      if (length) {
        streamEnd = streamStart + Number(length[1])
      } else {
        streamEnd = text.lastIndexOf('endstream', end)
        while (streamEnd > streamStart && (bytes[streamEnd - 1] === 10 || bytes[streamEnd - 1] === 13)) streamEnd--
      }
    }
    objects.set(Number(match[1]), { dict, streamStart, streamEnd })
    re.lastIndex = end
  }
  return objects
}

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

const refs = (s: string) => [...s.matchAll(/(\d+)\s+0\s+R/g)].map((m) => Number(m[1]))

/* -------------------------------------------------- content stream reader */

type Token = { t: 'num'; v: number } | { t: 'name'; v: string } | { t: 'str'; v: string } | { t: 'arr'; v: Token[] } | { t: 'op'; v: string }

/** PDF string literal → raw byte string (escapes resolved). */
function readString(s: string, i: number): [string, number] {
  let depth = 1
  let out = ''
  i++
  while (i < s.length && depth > 0) {
    const c = s[i]
    if (c === '\\') {
      const n = s[i + 1]
      const esc: Record<string, string> = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', '(': '(', ')': ')', '\\': '\\' }
      if (n in esc) {
        out += esc[n]
        i += 2
      } else if (/[0-7]/.test(n)) {
        const oct = /^[0-7]{1,3}/.exec(s.slice(i + 1))![0]
        out += String.fromCharCode(parseInt(oct, 8))
        i += 1 + oct.length
      } else {
        i += 2
      }
      continue
    }
    if (c === '(') depth++
    if (c === ')') depth--
    if (depth > 0) out += c
    i++
  }
  return [out, i]
}

function tokenize(s: string): Token[] {
  const tokens: Token[] = []
  const stack: Token[][] = [tokens]
  let i = 0
  while (i < s.length) {
    const c = s[i]
    if (c === ' ' || c === '\n' || c === '\r' || c === '\t' || c === '\f') {
      i++
    } else if (c === '%') {
      while (i < s.length && s[i] !== '\n' && s[i] !== '\r') i++
    } else if (c === '(') {
      const [v, next] = readString(s, i)
      stack.at(-1)!.push({ t: 'str', v })
      i = next
    } else if (c === '[') {
      const arr: Token[] = []
      stack.at(-1)!.push({ t: 'arr', v: arr })
      stack.push(arr)
      i++
    } else if (c === ']') {
      if (stack.length > 1) stack.pop()
      i++
    } else if (c === '/') {
      let j = i + 1
      while (j < s.length && !/[\s/[\]()<>{}%]/.test(s[j])) j++
      stack.at(-1)!.push({ t: 'name', v: s.slice(i + 1, j) })
      i = j
    } else if (c === '<' && s[i + 1] === '<') {
      // Inline dictionaries (rare in content streams): skip them.
      const end = s.indexOf('>>', i)
      i = end < 0 ? s.length : end + 2
    } else if (c === '<') {
      const end = s.indexOf('>', i)
      const hex = s.slice(i + 1, end).replace(/\s/g, '')
      let v = ''
      for (let k = 0; k < hex.length; k += 2) v += String.fromCharCode(parseInt(hex.slice(k, k + 2).padEnd(2, '0'), 16))
      stack.at(-1)!.push({ t: 'str', v })
      i = end + 1
    } else if (/[\d.+-]/.test(c)) {
      let j = i + 1
      while (j < s.length && /[\d.]/.test(s[j])) j++
      stack.at(-1)!.push({ t: 'num', v: Number(s.slice(i, j)) })
      i = j
    } else {
      let j = i + 1
      while (j < s.length && !/[\s/[\]()<>{}%]/.test(s[j])) j++
      const op = s.slice(i, j)
      if (op === 'BI') {
        // Inline image: skip to its end.
        const end = s.indexOf('EI', j)
        i = end < 0 ? s.length : end + 2
        continue
      }
      stack.at(-1)!.push({ t: 'op', v: op })
      i = j
    }
  }
  return tokens
}

type Matrix = [number, number, number, number, number, number]
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0]
const multiply = (m: Matrix, n: Matrix): Matrix => [
  m[0] * n[0] + m[1] * n[2],
  m[0] * n[1] + m[1] * n[3],
  m[2] * n[0] + m[3] * n[2],
  m[2] * n[1] + m[3] * n[3],
  m[4] * n[0] + m[5] * n[2] + n[4],
  m[4] * n[1] + m[5] * n[3] + n[5],
]

type PageText = { font: string; text: string; x: number; y: number }
type PageImage = { name: string; x: number; y: number; w: number; h: number }
type PageRect = { x: number; y: number; w: number; h: number; fill: string }

/** Walk a page's operators: text with its position, image placements, filled rects. */
function interpret(tokens: Token[]) {
  const texts: PageText[] = []
  const images: PageImage[] = []
  const rects: PageRect[] = []
  const stack: Matrix[] = []
  let ctm: Matrix = IDENTITY
  let font = ''
  let tm: Matrix = IDENTITY
  let fill = ''
  let pendingRects: { x: number; y: number; w: number; h: number }[] = []
  const args: Token[] = []
  const num = (k: number) => (args[k]?.t === 'num' ? (args[k] as { v: number }).v : 0)
  const at = (x: number, y: number) => ({ x: x * ctm[0] + y * ctm[2] + ctm[4], y: x * ctm[1] + y * ctm[3] + ctm[5] })

  for (const token of tokens) {
    if (token.t !== 'op') {
      args.push(token)
      continue
    }
    switch (token.v) {
      case 'q':
        stack.push(ctm)
        break
      case 'Q':
        ctm = stack.pop() ?? IDENTITY
        break
      case 'cm':
        ctm = multiply([num(0), num(1), num(2), num(3), num(4), num(5)], ctm)
        break
      case 'BT':
        tm = IDENTITY
        break
      case 'Tf':
        if (args[0]?.t === 'name') font = args[0].v
        break
      case 'Tm':
        tm = [num(0), num(1), num(2), num(3), num(4), num(5)]
        break
      case 'Td':
        tm = [tm[0], tm[1], tm[2], tm[3], tm[4] + num(0), tm[5] + num(1)]
        break
      case 'Tj':
      case 'TJ': {
        const arg = args[0]
        let text = ''
        if (arg?.t === 'str') text = arg.v
        else if (arg?.t === 'arr') text = arg.v.map((t) => (t.t === 'str' ? t.v : '')).join('')
        const p = at(tm[4], tm[5])
        texts.push({ font, text, x: p.x, y: p.y })
        break
      }
      case 'sc':
      case 'scn':
      case 'rg':
      case 'g':
        fill = args.map((t) => (t.t === 'num' ? t.v.toFixed(3) : '')).join(' ')
        break
      case 're': {
        const a = at(num(0), num(1))
        pendingRects.push({ x: a.x, y: a.y, w: num(2) * ctm[0], h: num(3) * ctm[3] })
        break
      }
      case 'f':
      case 'F':
      case 'f*':
        for (const r of pendingRects) rects.push({ ...r, fill })
        pendingRects = []
        break
      case 'n':
      case 'S':
      case 's':
      case 'B':
      case 'b':
        pendingRects = []
        break
      case 'Do':
        if (args[0]?.t === 'name') images.push({ name: args[0].v, x: ctm[4], y: ctm[5], w: ctm[0], h: ctm[3] })
        break
    }
    args.length = 0
  }
  return { texts, images, rects }
}

/* --------------------------------------------------------- the importer */

/** Mac Roman bytes (these PDFs' text encoding) → readable text. */
function readable(raw: string): string {
  try {
    const bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0))
    return new TextDecoder('macintosh').decode(bytes)
  } catch {
    return raw
  }
}

const digits = (s: string) => Number(s.replace(/\D/g, '')) || null

export async function importPatternPdf(buffer: ArrayBuffer): Promise<ImportedPattern> {
  const bytes = new Uint8Array(buffer)
  const text = latin1.decode(bytes)
  if (!text.startsWith('%PDF')) throw new PdfFormatError(msg.notPdf)
  const objects = parseObjects(bytes, text)

  const streamOf = async (num: number): Promise<string> => {
    const obj = objects.get(num)
    if (!obj || obj.streamStart < 0) return ''
    const raw = bytes.subarray(obj.streamStart, obj.streamEnd)
    if (!/\/FlateDecode/.test(obj.dict)) return latin1.decode(raw)
    try {
      return latin1.decode(await inflate(raw))
    } catch {
      return ''
    }
  }

  // Pages, in reading order.
  const catalog = [...objects.entries()].find(([, o]) => /\/Type\s*\/Catalog/.test(o.dict))
  if (!catalog) throw new PdfFormatError(msg.noCatalog)
  const rootPages = /\/Pages\s+(\d+)\s+0\s+R/.exec(catalog[1].dict)
  const pageNums: number[] = []
  const walk = (num: number, depth = 0) => {
    const obj = objects.get(num)
    if (!obj || depth > 32) return
    if (/\/Type\s*\/Pages\b/.test(obj.dict)) {
      const kids = /\/Kids\s*\[([^\]]*)\]/.exec(obj.dict)
      for (const kid of refs(kids?.[1] ?? '')) walk(kid, depth + 1)
    } else if (/\/Type\s*\/Page\b/.test(obj.dict)) {
      pageNums.push(num)
    }
  }
  if (rootPages) walk(Number(rootPages[1]))
  if (pageNums.length === 0) throw new PdfFormatError(msg.noPage)

  const resourcesOf = (pageDict: string): string => {
    const ref = /\/Resources\s+(\d+)\s+0\s+R/.exec(pageDict)
    return ref ? (objects.get(Number(ref[1]))?.dict ?? '') : pageDict
  }
  /** Resource name → object number (fonts: per-page names, global objects). */
  const resourceMap = (resources: string) => {
    const map = new Map<string, number>()
    for (const m of resources.matchAll(/\/([A-Za-z]+\d+)\s+(\d+)\s+0\s+R/g)) map.set(m[1], Number(m[2]))
    return map
  }

  type Page = ReturnType<typeof interpret> & { res: Map<string, number>; all: string }
  const pages: Page[] = []
  for (const num of pageNums) {
    const dict = objects.get(num)!.dict
    const contents = /\/Contents\s*(\[[^\]]*\]|\d+\s+0\s+R)/.exec(dict)
    let content = ''
    for (const ref of refs(contents?.[1] ?? '')) content += (await streamOf(ref)) + '\n'
    const parsed = interpret(tokenize(content))
    pages.push({ ...parsed, res: resourceMap(resourcesOf(dict)), all: parsed.texts.map((t) => t.text).join(' ') })
  }

  const warnings: string[] = []

  // Cover: name, size, stitches per inch, total.
  const cover = pages.find((p) => /\d+\s*x\s*\d+/.test(p.all)) ?? pages[0]
  const coverText = readable(cover.all)
  const size = /(\d{1,4})\s*x\s*(\d{1,4})/.exec(coverText)
  const perInch = /pouce\s*:\s*(\d+)|inch\s*:\s*(\d+)/i.exec(coverText)
  const total = /(?:Total de points|Total stitches)\s*:\s*([\d\s"'., ]+)/i.exec(coverText)
  const name = readable(cover.texts[0]?.text ?? '').trim() || msg.defaultName

  // Legend: symbol (font object + character) → DMC code, name, announced count.
  type LegendEntry = { key: string; code: string; name: string; declared: number | null }
  const legend: LegendEntry[] = []
  const legendPage = [...pages].reverse().find((p) => p.texts.filter((t) => /^D\d{2,5}$/.test(t.text.trim())).length >= 1)
  if (!legendPage) throw new PdfFormatError(msg.noLegend)
  {
    let pendingSymbol: string | null = null
    let current: LegendEntry | null = null
    let tail = ''
    const flush = () => {
      if (!current) return
      const pts = /Points\s*:\s*([^-]*)-/.exec(tail)
      current.declared = pts ? digits(pts[1]) : null
      current.name = current.name.trim()
    }
    for (const t of legendPage.texts) {
      const value = t.text.trim()
      if (/^D\d{2,5}$/.test(value)) {
        flush()
        current = { key: pendingSymbol ?? '', code: value.slice(1), name: '', declared: null }
        legend.push(current)
        tail = ''
        pendingSymbol = null
      } else if (t.text.length === 1 && !/[\s\w:.,-]/.test(t.text)) {
        // A lone glyph in a symbol font: the next code belongs to it.
        pendingSymbol = `${legendPage.res.get(t.font) ?? t.font}:${t.text}`
      } else if (current) {
        if (!current.name && !/Points/.test(value)) current.name = readable(value)
        else tail += t.text
      }
    }
    flush()
  }
  if (legend.length === 0) throw new PdfFormatError(msg.emptyLegend)

  // Sections: stitches are images of one cell's size inside the fabric rect.
  type Stitch = { gx: number; gy: number; image: number; symbol: string | null }
  const stitches: Stitch[] = []
  let sectionCount = 0
  const sectionPages = pages
    .map((p) => ({ p, n: /Section\s+(\d+)\b/.exec(p.all) }))
    .filter((s): s is { p: Page; n: RegExpExecArray } => s.n !== null)
  if (sectionPages.length === 0) throw new PdfFormatError(msg.noSections)

  // Cell size: the most common image width across the sections.
  const widths = new Map<string, number>()
  for (const { p } of sectionPages) for (const im of p.images) widths.set(im.w.toFixed(2), (widths.get(im.w.toFixed(2)) ?? 0) + 1)
  const cell = Number([...widths.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0)
  if (!cell) throw new PdfFormatError(msg.noStitches)

  for (const { p, n } of sectionPages) {
    // The fabric: the largest filled rect whose sides are whole numbers of cells.
    const fabric = p.rects
      .filter((r) => {
        const cw = r.w / cell
        const ch = Math.abs(r.h) / cell
        return cw >= 1 && ch >= 1 && Math.abs(cw - Math.round(cw)) < 0.05 && Math.abs(ch - Math.round(ch)) < 0.05
      })
      .sort((a, b) => b.w * Math.abs(b.h) - a.w * Math.abs(a.h))[0]
    if (!fabric) continue
    const cols = Math.round(fabric.w / cell)
    const rows = Math.round(Math.abs(fabric.h) / cell)
    const left = fabric.x
    const top = fabric.h > 0 ? fabric.y + fabric.h : fabric.y
    sectionCount++
    const index = Number(n[1]) - 1
    const perRow = size ? Math.ceil(Number(size[1]) / cols) : 1
    const ox = (index % perRow) * cols
    const oy = Math.floor(index / perRow) * rows

    // Symbols drawn in cells (for the fallback mapping).
    const symbolAt = new Map<string, string>()
    for (const t of p.texts) {
      if (t.text.length !== 1) continue
      const cx = Math.floor((t.x - left) / cell)
      const cy = Math.floor((top - t.y) / cell)
      if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) continue
      symbolAt.set(`${cx},${cy}`, `${p.res.get(t.font) ?? t.font}:${t.text}`)
    }
    for (const im of p.images) {
      if (Math.abs(im.w - cell) > cell * 0.05) continue
      const cx = Math.round((im.x - left) / cell)
      const cy = Math.round((top - im.y - Math.abs(im.h)) / cell)
      if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) continue
      const image = p.res.get(im.name)
      if (image === undefined) continue
      stitches.push({ gx: ox + cx, gy: oy + cy, image, symbol: symbolAt.get(`${cx},${cy}`) ?? null })
    }
  }
  if (stitches.length === 0) throw new PdfFormatError(msg.noStitches)

  // Image → thread. 1) unique stitch counts matching the legend; 2) symbols.
  const perImage = new Map<number, number>()
  for (const s of stitches) perImage.set(s.image, (perImage.get(s.image) ?? 0) + 1)
  const threadOf = new Map<number, number>()
  const declaredCounts = legend.map((l) => l.declared)
  const uniqueCounts = new Set(declaredCounts).size === declaredCounts.length && declaredCounts.every((c) => c !== null)
  if (uniqueCounts) {
    for (const [image, count] of perImage) {
      const index = declaredCounts.indexOf(count)
      if (index >= 0) threadOf.set(image, index)
    }
  }
  const unresolved = [...perImage.keys()].filter((image) => !threadOf.has(image))
  if (unresolved.length > 0) {
    const votes = new Map<number, Map<number, number>>()
    for (const s of stitches) {
      if (threadOf.has(s.image) || !s.symbol) continue
      const index = legend.findIndex((l) => l.key === s.symbol)
      if (index < 0) continue
      const v = votes.get(s.image) ?? new Map<number, number>()
      v.set(index, (v.get(index) ?? 0) + 1)
      votes.set(s.image, v)
    }
    for (const image of unresolved) {
      const best = [...(votes.get(image)?.entries() ?? [])].sort((a, b) => b[1] - a[1])[0]
      if (best) threadOf.set(image, best[0])
    }
  }
  const lost = [...perImage.entries()].filter(([image]) => !threadOf.has(image))
  if (lost.length > 0) {
    warnings.push(msg.lost(lost.reduce((n, [, c]) => n + c, 0)))
  }

  // Grid.
  const maxX = Math.max(...stitches.map((s) => s.gx)) + 1
  const maxY = Math.max(...stitches.map((s) => s.gy)) + 1
  const width = size ? Math.max(Number(size[1]), maxX) : maxX
  const height = size ? Math.max(Number(size[2]), maxY) : maxY
  const cells = new Int16Array(width * height).fill(-1)
  const found = legend.map(() => 0)
  for (const s of stitches) {
    const thread = threadOf.get(s.image)
    if (thread === undefined) continue
    cells[s.gy * width + s.gx] = thread
    found[thread]++
  }

  const declaredTotal = total ? digits(total[1]) : null
  const rebuilt = found.reduce((a, b) => a + b, 0)
  if (declaredTotal !== null && declaredTotal !== rebuilt) {
    warnings.push(msg.mismatch(rebuilt, declaredTotal))
  }
  if (!size) warnings.push(msg.noSize)

  return {
    name,
    width,
    height,
    perInch: perInch ? Number(perInch[1] ?? perInch[2]) : null,
    declaredTotal,
    threads: legend.map((l, i) => ({ code: l.code, name: l.name, declared: l.declared, found: found[i] })),
    cells,
    sections: sectionCount,
    warnings,
  }
}
