import type { Point, Selection } from './types'

/** Footprint of the pencil, eraser and progress tools. */
export type Brush = { shape: 'square' | 'round'; size: number }

export const MIN_BRUSH = 1
export const MAX_BRUSH = 15

/** Tools that paint with a brush footprint; each keeps its own settings. */
export type BrushTool = 'pencil' | 'eraser' | 'progress'

export function isBrushTool(tool: string): tool is BrushTool {
  return tool === 'pencil' || tool === 'eraser' || tool === 'progress'
}

const cache = new Map<string, Point[]>()

/**
 * Offsets covered by a brush centred on a stitch. Square: n×n. Round: the
 * stitches whose centre lies inside a circle of diameter n (shifted half a
 * stitch for even sizes, so the disc stays symmetric).
 */
export function brushOffsets(brush: Brush): Point[] {
  const size = Math.min(MAX_BRUSH, Math.max(MIN_BRUSH, Math.round(brush.size)))
  const key = `${brush.shape}:${size}`
  const hit = cache.get(key)
  if (hit) return hit
  const lo = -Math.floor((size - 1) / 2) || 0
  const hi = lo + size - 1
  // Centre of the footprint, relative to the stitch under the cursor.
  const c = (lo + hi) / 2
  // Slightly inside the true circle, so a size-3 disc is a plus, not a square.
  const r2 = (size / 2 - 0.1) ** 2
  const out: Point[] = []
  for (let dy = lo; dy <= hi; dy++) {
    for (let dx = lo; dx <= hi; dx++) {
      if (brush.shape === 'round' && size > 2 && (dx - c) ** 2 + (dy - c) ** 2 > r2) continue
      out.push({ x: dx, y: dy })
    }
  }
  cache.set(key, out)
  return out
}

/** Expand every point of a stroke by the brush footprint, without duplicates. */
export function stampBrush(points: Point[], offsets: Point[]): Point[] {
  if (offsets.length === 1 && offsets[0].x === 0 && offsets[0].y === 0) return points
  const seen = new Set<string>()
  const out: Point[] = []
  for (const p of points) {
    for (const o of offsets) {
      const x = p.x + o.x
      const y = p.y + o.y
      const key = `${x},${y}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ x, y })
    }
  }
  return out
}

/** The footprint as a selection-shaped mask, to draw its outline. */
export function brushShape(brush: Brush, at: Point): Selection {
  const offsets = brushOffsets(brush)
  let lo = 0
  let hi = 0
  for (const o of offsets) {
    lo = Math.min(lo, o.x, o.y)
    hi = Math.max(hi, o.x, o.y)
  }
  const n = hi - lo + 1
  const mask = new Uint8Array(n * n)
  for (const o of offsets) mask[(o.y - lo) * n + (o.x - lo)] = 1
  return { x: at.x + lo, y: at.y + lo, w: n, h: n, mask }
}
