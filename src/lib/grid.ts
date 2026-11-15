import type { Patch, Project, Rect } from './types'

/** Sentinel stored in `cells` for a stitch that has no thread. */
export const EMPTY = -1

export const MIN_SIZE = 1
export const MAX_SIZE = 600

/** Round and clamp a stitch count to the allowed grid range. */
export function clampSize(value: number): number {
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(value) || MIN_SIZE))
}

export function createCells(width: number, height: number): Int16Array {
  return new Int16Array(width * height).fill(EMPTY)
}

export function idx(width: number, x: number, y: number): number {
  return y * width + x
}

export function inBounds(width: number, height: number, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < width && y < height
}

export function getCell(p: Pick<Project, 'cells' | 'width' | 'height'>, x: number, y: number): number {
  if (!inBounds(p.width, p.height, x, y)) return EMPTY
  return p.cells[idx(p.width, x, y)]
}

/**
 * Copy `cells` into a grid of a different size, anchored top-left. Stitches
 * that fall outside the new bounds are dropped.
 */
export function resizeCells(
  cells: Int16Array,
  oldW: number,
  oldH: number,
  newW: number,
  newH: number,
): Int16Array {
  const next = createCells(newW, newH)
  const w = Math.min(oldW, newW)
  const h = Math.min(oldH, newH)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) next[y * newW + x] = cells[y * oldW + x]
  }
  return next
}

export function resizeFlags(
  flags: Uint8Array,
  oldW: number,
  oldH: number,
  newW: number,
  newH: number,
): Uint8Array {
  const next = new Uint8Array(newW * newH)
  const w = Math.min(oldW, newW)
  const h = Math.min(oldH, newH)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) next[y * newW + x] = flags[y * oldW + x]
  }
  return next
}

/** How many stitches use each palette index. Index `palette.length` is unused. */
export function countByThread(cells: Int16Array, paletteSize: number): number[] {
  const counts = new Array<number>(paletteSize).fill(0)
  for (let i = 0; i < cells.length; i++) {
    const v = cells[i]
    if (v >= 0 && v < paletteSize) counts[v]++
  }
  return counts
}

/** Stitched / total per palette index, used by the progress panel. */
export function countDoneByThread(
  cells: Int16Array,
  done: Uint8Array,
  paletteSize: number,
): number[] {
  const counts = new Array<number>(paletteSize).fill(0)
  for (let i = 0; i < cells.length; i++) {
    const v = cells[i]
    if (v >= 0 && v < paletteSize && done[i]) counts[v]++
  }
  return counts
}

/**
 * Drop a thread from the palette and renumber every cell above it, so the
 * remaining stitches keep pointing at the right colour.
 */
export function removeThread(cells: Int16Array, removed: number): Int16Array {
  const next = new Int16Array(cells)
  for (let i = 0; i < next.length; i++) {
    const v = next[i]
    if (v === removed) next[i] = EMPTY
    else if (v > removed) next[i] = v - 1
  }
  return next
}

/** Point every stitch of thread `from` at thread `to` instead. */
export function mergeThread(cells: Int16Array, from: number, to: number): Int16Array {
  const next = new Int16Array(cells)
  for (let i = 0; i < next.length; i++) {
    if (next[i] === from) next[i] = to
  }
  return next
}

/** The tight bounding box of every non-empty stitch, or null for a blank grid. */
export function contentBounds(cells: Int16Array, width: number, height: number): Rect | null {
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (cells[y * width + x] === EMPTY) continue
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }
  if (maxX < 0) return null
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

/** Clamp a rectangle to the grid, returning null when nothing is left. */
export function clampRect(rect: Rect, width: number, height: number): Rect | null {
  const x1 = Math.max(0, rect.x)
  const y1 = Math.max(0, rect.y)
  const x2 = Math.min(width, rect.x + rect.w)
  const y2 = Math.min(height, rect.y + rect.h)
  if (x2 <= x1 || y2 <= y1) return null
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 }
}

export function emptyPatch(width: number, height: number): Patch {
  return { width, height, cells: createCells(width, height) }
}

/* ------------------------------------------------------------------ run-length
 * A cross-stitch grid is mostly empty, and localStorage only holds ~5 MB, so
 * both typed arrays travel as `value x repeat` runs instead of JSON arrays.
 */

export function encodeRLE(data: Int16Array | Uint8Array): string {
  if (data.length === 0) return ''
  const out: string[] = []
  let value = data[0]
  let run = 1
  for (let i = 1; i < data.length; i++) {
    if (data[i] === value) {
      run++
      continue
    }
    out.push(run === 1 ? `${value}` : `${value}x${run}`)
    value = data[i]
    run = 1
  }
  out.push(run === 1 ? `${value}` : `${value}x${run}`)
  return out.join(',')
}

function decodeRLEInto<T extends Int16Array | Uint8Array>(target: T, encoded: string): T {
  if (!encoded) return target
  let at = 0
  for (const token of encoded.split(',')) {
    const sep = token.indexOf('x')
    const value = Number(sep === -1 ? token : token.slice(0, sep))
    const run = sep === -1 ? 1 : Number(token.slice(sep + 1))
    if (!Number.isFinite(value) || !Number.isFinite(run)) continue
    const end = Math.min(target.length, at + run)
    for (; at < end; at++) target[at] = value
    if (at >= target.length) break
  }
  return target
}

export function decodeCells(encoded: string, width: number, height: number): Int16Array {
  return decodeRLEInto(createCells(width, height), encoded)
}

export function decodeFlags(encoded: string, width: number, height: number): Uint8Array {
  return decodeRLEInto(new Uint8Array(width * height), encoded)
}
