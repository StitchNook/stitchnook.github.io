import { EMPTY, createCells, idx } from './grid'
import type { Patch, Rect, Selection } from './types'

/** Lift a rectangle of stitches off the grid into a standalone patch. */
export function extractPatch(
  cells: Int16Array,
  width: number,
  rect: Rect,
): Patch {
  const out = createCells(rect.w, rect.h)
  for (let y = 0; y < rect.h; y++) {
    for (let x = 0; x < rect.w; x++) {
      out[y * rect.w + x] = cells[idx(width, rect.x + x, rect.y + y)]
    }
  }
  return { width: rect.w, height: rect.h, cells: out }
}

/**
 * Stamp a patch onto a copy of `cells` at (ox, oy).
 * With `opaque`, the patch's empty stitches erase what is underneath;
 * otherwise they leave the existing stitches visible.
 */
export function stampPatch(
  cells: Int16Array,
  width: number,
  height: number,
  patch: Patch,
  ox: number,
  oy: number,
  opaque = false,
): Int16Array {
  const next = new Int16Array(cells)
  for (let y = 0; y < patch.height; y++) {
    const ty = oy + y
    if (ty < 0 || ty >= height) continue
    for (let x = 0; x < patch.width; x++) {
      const tx = ox + x
      if (tx < 0 || tx >= width) continue
      const value = patch.cells[y * patch.width + x]
      if (value === EMPTY && !opaque) continue
      next[idx(width, tx, ty)] = value
    }
  }
  return next
}

export function flipPatchH(patch: Patch): Patch {
  const out = createCells(patch.width, patch.height)
  for (let y = 0; y < patch.height; y++) {
    for (let x = 0; x < patch.width; x++) {
      out[y * patch.width + x] = patch.cells[y * patch.width + (patch.width - 1 - x)]
    }
  }
  return { ...patch, cells: out }
}

export function flipPatchV(patch: Patch): Patch {
  const out = createCells(patch.width, patch.height)
  for (let y = 0; y < patch.height; y++) {
    for (let x = 0; x < patch.width; x++) {
      out[y * patch.width + x] = patch.cells[(patch.height - 1 - y) * patch.width + x]
    }
  }
  return { ...patch, cells: out }
}

/** Quarter turn clockwise; width and height swap. */
export function rotatePatch(patch: Patch): Patch {
  const w = patch.height
  const h = patch.width
  const out = createCells(w, h)
  for (let y = 0; y < patch.height; y++) {
    for (let x = 0; x < patch.width; x++) {
      out[x * w + (patch.height - 1 - y)] = patch.cells[y * patch.width + x]
    }
  }
  return { width: w, height: h, cells: out }
}

/**
 * Nearest-neighbour rescale. Interpolation is deliberately absent: a stitch is
 * one thread or none, so a blended colour would be meaningless.
 */
export function scalePatch(patch: Patch, newW: number, newH: number): Patch {
  const w = Math.max(1, Math.round(newW))
  const h = Math.max(1, Math.round(newH))
  const out = createCells(w, h)
  for (let y = 0; y < h; y++) {
    const sy = Math.min(patch.height - 1, Math.floor((y * patch.height) / h))
    for (let x = 0; x < w; x++) {
      const sx = Math.min(patch.width - 1, Math.floor((x * patch.width) / w))
      out[y * w + x] = patch.cells[sy * patch.width + sx]
    }
  }
  return { width: w, height: h, cells: out }
}

/** Build a patch from a boolean mask, painting every set pixel with `thread`. */
export function patchFromMask(
  mask: Uint8Array,
  width: number,
  height: number,
  thread: number,
): Patch {
  const out = createCells(width, height)
  for (let i = 0; i < out.length; i++) out[i] = mask[i] ? thread : EMPTY
  return { width, height, cells: out }
}

export function patchIsEmpty(patch: Patch): boolean {
  for (let i = 0; i < patch.cells.length; i++) {
    if (patch.cells[i] !== EMPTY) return false
  }
  return true
}

/* ---------------------------------------------------- free-form selection */

export function rectSelection(rect: Rect): Selection {
  return { ...rect, mask: new Uint8Array(rect.w * rect.h).fill(1) }
}

export function selectionHas(sel: Selection, x: number, y: number): boolean {
  const lx = x - sel.x
  const ly = y - sel.y
  if (lx < 0 || ly < 0 || lx >= sel.w || ly >= sel.h) return false
  return sel.mask[ly * sel.w + lx] === 1
}

/** Shrink a selection to the stitches it really holds; null when empty. */
function trimSelection(sel: Selection): Selection | null {
  let minX = sel.w
  let minY = sel.h
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < sel.h; y++) {
    for (let x = 0; x < sel.w; x++) {
      if (!sel.mask[y * sel.w + x]) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  if (maxX < 0) return null
  if (minX === 0 && minY === 0 && maxX === sel.w - 1 && maxY === sel.h - 1) return sel
  const w = maxX - minX + 1
  const h = maxY - minY + 1
  const mask = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) mask[y * w + x] = sel.mask[(y + minY) * sel.w + x + minX]
  }
  return { x: sel.x + minX, y: sel.y + minY, w, h, mask }
}

/** Add a rectangle to a selection, or carve it out. */
export function combineSelection(
  base: Selection | null,
  rect: Rect,
  mode: 'add' | 'subtract',
): Selection | null {
  if (!base) return mode === 'add' ? rectSelection(rect) : null
  const x0 = mode === 'add' ? Math.min(base.x, rect.x) : base.x
  const y0 = mode === 'add' ? Math.min(base.y, rect.y) : base.y
  const x1 = mode === 'add' ? Math.max(base.x + base.w, rect.x + rect.w) : base.x + base.w
  const y1 = mode === 'add' ? Math.max(base.y + base.h, rect.y + rect.h) : base.y + base.h
  const w = x1 - x0
  const h = y1 - y0
  const mask = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const gx = x0 + x
      const gy = y0 + y
      const inRect = gx >= rect.x && gy >= rect.y && gx < rect.x + rect.w && gy < rect.y + rect.h
      const inBase = selectionHas(base, gx, gy)
      mask[y * w + x] = (mode === 'add' ? inBase || inRect : inBase && !inRect) ? 1 : 0
    }
  }
  return trimSelection({ x: x0, y: y0, w, h, mask })
}

/** Clip a selection to the grid; null when nothing is left. */
export function clampSelection(sel: Selection, width: number, height: number): Selection | null {
  const x0 = Math.max(0, sel.x)
  const y0 = Math.max(0, sel.y)
  const x1 = Math.min(width, sel.x + sel.w)
  const y1 = Math.min(height, sel.y + sel.h)
  if (x1 <= x0 || y1 <= y0) return null
  if (x0 === sel.x && y0 === sel.y && x1 === sel.x + sel.w && y1 === sel.y + sel.h) return sel
  const w = x1 - x0
  const h = y1 - y0
  const mask = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) mask[y * w + x] = sel.mask[(y + y0 - sel.y) * sel.w + x + x0 - sel.x]
  }
  return trimSelection({ x: x0, y: y0, w, h, mask })
}

/** Lift the selected stitches; everything outside the mask comes out empty. */
export function extractSelection(cells: Int16Array, width: number, sel: Selection): Patch {
  const patch = extractPatch(cells, width, sel)
  for (let i = 0; i < sel.mask.length; i++) if (!sel.mask[i]) patch.cells[i] = EMPTY
  return patch
}

export function clearSelectionCells(
  cells: Int16Array,
  width: number,
  height: number,
  sel: Selection,
): void {
  for (let y = 0; y < sel.h; y++) {
    const gy = sel.y + y
    if (gy < 0 || gy >= height) continue
    for (let x = 0; x < sel.w; x++) {
      const gx = sel.x + x
      if (gx < 0 || gx >= width || !sel.mask[y * sel.w + x]) continue
      cells[idx(width, gx, gy)] = EMPTY
    }
  }
}

/** Mask stored as a patch (1 / EMPTY) so it can share `scalePatch`. */
export function maskToPatch(mask: Uint8Array, w: number, h: number): Patch {
  return patchFromMask(mask, w, h, 1)
}

export function patchToSelection(patch: Patch, x: number, y: number): Selection | null {
  const mask = new Uint8Array(patch.cells.length)
  for (let i = 0; i < mask.length; i++) mask[i] = patch.cells[i] === EMPTY ? 0 : 1
  return trimSelection({ x, y, w: patch.width, h: patch.height, mask })
}

/**
 * Boundary of a selection as unit segments in grid coordinates
 * ([x1, y1, x2, y2]), so free-form shapes get their true outline.
 */
export function selectionOutline(sel: Selection): number[][] {
  const out: number[][] = []
  const has = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < sel.w && y < sel.h && sel.mask[y * sel.w + x] === 1
  for (let y = 0; y < sel.h; y++) {
    for (let x = 0; x < sel.w; x++) {
      if (!has(x, y)) continue
      const gx = sel.x + x
      const gy = sel.y + y
      if (!has(x, y - 1)) out.push([gx, gy, gx + 1, gy])
      if (!has(x, y + 1)) out.push([gx, gy + 1, gx + 1, gy + 1])
      if (!has(x - 1, y)) out.push([gx, gy, gx, gy + 1])
      if (!has(x + 1, y)) out.push([gx + 1, gy, gx + 1, gy + 1])
    }
  }
  return out
}

/* ------------------------------------------------- between projects */

/** Renumber a patch's threads; `indexMap[i]` is the new index of thread i. */
export function remapPatch(patch: Patch, indexMap: number[]): Patch {
  const cells = new Int16Array(patch.cells.length)
  for (let i = 0; i < cells.length; i++) {
    const value = patch.cells[i]
    cells[i] = value === EMPTY ? EMPTY : (indexMap[value] ?? EMPTY)
  }
  return { ...patch, cells }
}

/** A whole project as a patch, cropped to its embroidered stitches; null if empty. */
export function projectToPatch(project: { width: number; height: number; cells: Int16Array }): Patch | null {
  let minX = project.width
  let minY = project.height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < project.height; y++) {
    for (let x = 0; x < project.width; x++) {
      if (project.cells[idx(project.width, x, y)] === EMPTY) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  if (maxX < 0) return null
  return extractPatch(project.cells, project.width, {
    x: minX,
    y: minY,
    w: maxX - minX + 1,
    h: maxY - minY + 1,
  })
}
