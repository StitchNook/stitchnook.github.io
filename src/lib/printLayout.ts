/**
 * A4 print layout: given how many sheets the user is willing to print, find
 * the split and orientation that give the biggest (most legible) stitches.
 */

import { t } from './printLayout.i18n'

/** A4 minus the 10mm margins declared in the @page rules. */
export const A4_SHORT_MM = 190
export const A4_LONG_MM = 277
export const HEADER_MM = 12
export const FOOTER_MM = 6
/** Band around the chart holding the numbers and centre markers. */
export const RULER_MM = 5
export const MAX_CELL_MM = 8
/** Below this, symbols get hard to follow while stitching. */
export const MIN_READABLE_CELL_MM = 3
export const MAX_SHEETS = 30

export type Orientation = 'portrait' | 'landscape'

export type PrintLayout = {
  orientation: Orientation
  pagesX: number
  pagesY: number
  /** Stitches per page, not counting the repeated overlap row/column. */
  cols: number
  rows: number
  /** Stitch size in mm, rounded down to 0.1mm. */
  cell: number
  pageW: number
  pageH: number
}

export function pageSize(orientation: Orientation) {
  return orientation === 'portrait'
    ? { pageW: A4_SHORT_MM, pageH: A4_LONG_MM }
    : { pageW: A4_LONG_MM, pageH: A4_SHORT_MM }
}

function cellFor(orientation: Orientation, cols: number, rows: number, pagesX: number, pagesY: number) {
  const { pageW, pageH } = pageSize(orientation)
  const availW = pageW - 2 * RULER_MM
  const availH = pageH - HEADER_MM - FOOTER_MM - 2 * RULER_MM
  // Every page after the first repeats one row/column of its neighbour.
  const viewCols = cols + (pagesX > 1 ? 1 : 0)
  const viewRows = rows + (pagesY > 1 ? 1 : 0)
  return Math.min(MAX_CELL_MM, availW / viewCols, availH / viewRows)
}

/** Round a split up to a multiple of ten when it barely costs any legibility. */
function snapToTens(size: number, pages: number, total: number, cellOf: (n: number) => number) {
  if (pages === 1) return size
  const snapped = Math.ceil(size / 10) * 10
  if (snapped === size || Math.ceil(total / snapped) !== pages) return size
  return cellOf(snapped) >= cellOf(size) * 0.95 ? snapped : size
}

export function computeLayout(width: number, height: number, sheets: number): PrintLayout {
  let best: PrintLayout | null = null
  for (const orientation of ['portrait', 'landscape'] as const) {
    for (let pagesX = 1; pagesX <= sheets; pagesX++) {
      for (let pagesY = 1; pagesX * pagesY <= sheets; pagesY++) {
        if (pagesX > width || pagesY > height) continue
        let cols = Math.ceil(width / pagesX)
        let rows = Math.ceil(height / pagesY)
        // Balanced splits can leave a page empty (e.g. 10 wide on 4 pages).
        if (Math.ceil(width / cols) !== pagesX || Math.ceil(height / rows) !== pagesY) continue
        cols = snapToTens(cols, pagesX, width, (n) => cellFor(orientation, n, rows, pagesX, pagesY))
        rows = snapToTens(rows, pagesY, height, (n) => cellFor(orientation, cols, n, pagesX, pagesY))
        const cell = Math.floor(cellFor(orientation, cols, rows, pagesX, pagesY) * 10) / 10
        const pages = pagesX * pagesY
        const better =
          !best ||
          cell > best.cell + 1e-9 ||
          (Math.abs(cell - best.cell) < 1e-9 && pages < best.pagesX * best.pagesY)
        if (better) {
          best = { orientation, pagesX, pagesY, cols, rows, cell, ...pageSize(orientation) }
        }
      }
    }
  }
  // width/height are always >= 1, so the 1×1 portrait split always exists.
  return best as PrintLayout
}

/** Fewest sheets that keep stitches readable. */
export function autoSheets(width: number, height: number): number {
  for (let sheets = 1; sheets <= MAX_SHEETS; sheets++) {
    if (computeLayout(width, height, sheets).cell >= MIN_READABLE_CELL_MM) return sheets
  }
  return MAX_SHEETS
}

/** "Auto" or a fixed number of sheets, shared by the editor and the print view. */
export type SheetsChoice = number | 'auto'

export function resolveSheets(width: number, height: number, choice: SheetsChoice): number {
  return choice === 'auto' ? autoSheets(width, height) : choice
}

export function layoutSummary(layout: PrintLayout): string {
  const sheets = layout.pagesX * layout.pagesY
  return t.summary(sheets, layout.orientation === 'landscape', layout.pagesX, layout.pagesY, layout.cell)
}
