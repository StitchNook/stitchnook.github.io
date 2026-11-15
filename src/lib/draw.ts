import { idx, inBounds } from './grid'
import type { Point, Rect } from './types'

/** Bresenham line, inclusive of both endpoints. */
export function linePoints(x0: number, y0: number, x1: number, y1: number): Point[] {
  const points: Point[] = []
  const dx = Math.abs(x1 - x0)
  const dy = -Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx + dy
  let x = x0
  let y = y0
  for (;;) {
    points.push({ x, y })
    if (x === x1 && y === y1) break
    const e2 = 2 * err
    if (e2 >= dy) {
      err += dy
      x += sx
    }
    if (e2 <= dx) {
      err += dx
      y += sy
    }
  }
  return points
}

/** Snap the end of a drag to the nearest horizontal, vertical or 45° axis. */
export function constrain45(x0: number, y0: number, x1: number, y1: number): Point {
  const dx = x1 - x0
  const dy = y1 - y0
  const adx = Math.abs(dx)
  const ady = Math.abs(dy)
  if (adx > ady * 2) return { x: x1, y: y0 }
  if (ady > adx * 2) return { x: x0, y: y1 }
  const d = Math.max(adx, ady)
  return { x: x0 + Math.sign(dx) * d, y: y0 + Math.sign(dy) * d }
}

/** Normalised rectangle covering both drag corners, inclusive. */
export function rectFromDrag(a: Point, b: Point, square = false): Rect {
  let x1 = b.x
  let y1 = b.y
  if (square) {
    const d = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y))
    x1 = a.x + Math.sign(b.x - a.x || 1) * d
    y1 = a.y + Math.sign(b.y - a.y || 1) * d
  }
  const x = Math.min(a.x, x1)
  const y = Math.min(a.y, y1)
  return { x, y, w: Math.abs(x1 - a.x) + 1, h: Math.abs(y1 - a.y) + 1 }
}

export function rectPoints(rect: Rect, filled: boolean): Point[] {
  const points: Point[] = []
  const { x, y, w, h } = rect
  if (filled) {
    for (let j = y; j < y + h; j++) {
      for (let i = x; i < x + w; i++) points.push({ x: i, y: j })
    }
    return points
  }
  for (let i = x; i < x + w; i++) {
    points.push({ x: i, y })
    if (h > 1) points.push({ x: i, y: y + h - 1 })
  }
  for (let j = y + 1; j < y + h - 1; j++) {
    points.push({ x, y: j })
    if (w > 1) points.push({ x: x + w - 1, y: j })
  }
  return points
}

/**
 * Ellipse inscribed in `rect`, by testing every cell centre against the
 * implicit equation. A midpoint rasteriser is faster but misbehaves on
 * even-sized bounding boxes; at stitch resolution the extra work is free and
 * the result is symmetric for any width/height.
 */
export function ellipsePoints(rect: Rect, filled: boolean): Point[] {
  const { x, y, w, h } = rect
  const rx = w / 2
  const ry = h / 2
  const cx = x + rx
  const cy = y + ry
  const inside = (i: number, j: number) => {
    const nx = (i + 0.5 - cx) / rx
    const ny = (j + 0.5 - cy) / ry
    return nx * nx + ny * ny <= 1
  }
  const points: Point[] = []
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      if (!inside(i, j)) continue
      if (filled) {
        points.push({ x: i, y: j })
        continue
      }
      // Keep only the rim: a filled cell with at least one empty 4-neighbour.
      const edge =
        !inside(i - 1, j) || !inside(i + 1, j) || !inside(i, j - 1) || !inside(i, j + 1)
      if (edge) points.push({ x: i, y: j })
    }
  }
  return points
}

/**
 * Scanline flood fill returning flat cell indices. Iterative on purpose: a
 * recursive fill blows the stack well before a 600x600 grid is covered.
 */
export function floodFillIndices(
  cells: Int16Array,
  width: number,
  height: number,
  startX: number,
  startY: number,
): number[] {
  if (!inBounds(width, height, startX, startY)) return []
  const target = cells[idx(width, startX, startY)]
  const visited = new Uint8Array(width * height)
  const out: number[] = []
  const stack: number[] = [startX, startY]

  while (stack.length > 0) {
    const y = stack.pop()!
    let x = stack.pop()!
    if (!inBounds(width, height, x, y)) continue
    let left = x
    while (left >= 0 && cells[idx(width, left, y)] === target && !visited[idx(width, left, y)]) {
      left--
    }
    left++
    if (left > x || cells[idx(width, x, y)] !== target) continue

    let spanAbove = false
    let spanBelow = false
    for (x = left; x < width && cells[idx(width, x, y)] === target; x++) {
      const at = idx(width, x, y)
      if (visited[at]) break
      visited[at] = 1
      out.push(at)

      const above = y > 0 && cells[idx(width, x, y - 1)] === target && !visited[idx(width, x, y - 1)]
      if (above && !spanAbove) {
        stack.push(x, y - 1)
        spanAbove = true
      } else if (!above) {
        spanAbove = false
      }

      const below =
        y < height - 1 && cells[idx(width, x, y + 1)] === target && !visited[idx(width, x, y + 1)]
      if (below && !spanBelow) {
        stack.push(x, y + 1)
        spanBelow = true
      } else if (!below) {
        spanBelow = false
      }
    }
  }
  return out
}
