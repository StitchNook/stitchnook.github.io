import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Check, FlipHorizontal, FlipVertical, History, RotateCw, X } from 'lucide-react'
import { EMPTY, idx, inBounds } from '../lib/grid'
import { readableInk } from '../lib/dmc'
import { selectionHas, selectionOutline } from '../lib/selection'
import type { Reference } from '../lib/reference'
import { brushShape, isBrushTool } from '../lib/brush'
import { isTextEntry } from '../lib/keys'
import type { DisplayMode, FilterMode, Point, Project, Rect, Selection } from '../lib/types'
import { floatingModified, type EditorApi, type Handle, type PointerInfo } from '../hooks/useEditor'
import { Button } from './ui'
import type { ViewportApi } from '../hooks/useViewport'
import type { PrintLayout } from '../lib/printLayout'
import { t } from './GridCanvas.i18n'

const FABRIC = '#f7f4ee'
const GRID_LINE = '#cfc9bd'
const GRID_LINE_BOLD = '#8d8477'
const GRID_LINE_CENTER = '#5a7fb5'
const PAGE_LINE = '#ea580c'
/** Colours around the fabric, per theme (the fabric and stitches never change). */
const SURROUND = {
  dark: { backdrop: '#20242e', frame: '#4b5563', label: '#6b7280' },
  light: { backdrop: '#e6e4df', frame: '#78716c', label: '#57534e' },
}

export type GridCanvasProps = {
  project: Project
  /** Hex colour per palette index. */
  colors: string[]
  symbols: string[]
  display: DisplayMode
  showGrid: boolean
  showLabels: boolean
  /** When set, the print view's page cuts are drawn over the grid. */
  printLayout?: PrintLayout
  showProgress: boolean
  filterMode: FilterMode
  activeFilter: Set<number>
  editor: EditorApi
  viewportApi: ViewportApi
  theme: 'light' | 'dark'
  /** Image to trace by hand (never printed). */
  reference?: Reference | null
  /** Placing the reference: handles on it, the stitches are not touched. */
  referenceEditing?: boolean
  onReferenceChange?: (reference: Reference) => void
  /** Reports the drawing area size so the toolbar can zoom and fit. */
  onSizeChange?: (size: { width: number; height: number }) => void
}

type Size = { width: number; height: number }
type View = { scale: number; x: number; y: number }

/** Tools that act on the stitch under the cursor, and so outline it. */
const PAINT_TOOLS = new Set<string>(['pencil', 'eraser', 'fill', 'picker', 'line', 'rect', 'ellipse', 'progress'])

/** Side of a transform handle, in screen pixels. */
const HANDLE = 8

const HANDLE_CURSOR: Record<Handle, string> = {
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize',
}

function handlePositions(box: Rect, view: View): { handle: Handle; px: number; py: number }[] {
  const left = view.x + box.x * view.scale
  const top = view.y + box.y * view.scale
  const right = left + box.w * view.scale
  const bottom = top + box.h * view.scale
  const midX = (left + right) / 2
  const midY = (top + bottom) / 2
  return [
    { handle: 'nw', px: left, py: top },
    { handle: 'n', px: midX, py: top },
    { handle: 'ne', px: right, py: top },
    { handle: 'e', px: right, py: midY },
    { handle: 'se', px: right, py: bottom },
    { handle: 's', px: midX, py: bottom },
    { handle: 'sw', px: left, py: bottom },
    { handle: 'w', px: left, py: midY },
  ]
}

/** Band just outside each corner where dragging rotates, as in Photoshop. */
const ROTATE_REACH = 18

// No native rotation cursor exists: a small curved arrow, white-outlined so it
// reads on any colour.
const ROTATE_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">' +
    '<g stroke="#fff" stroke-width="4"><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 3v5h-5"/></g>' +
    '<g stroke="#0f172a" stroke-width="2"><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 3v5h-5"/></g>' +
    '</svg>',
)}") 12 12, alias`

function hitRotate(box: Rect, view: View, px: number, py: number): boolean {
  const left = view.x + box.x * view.scale
  const top = view.y + box.y * view.scale
  const right = left + box.w * view.scale
  const bottom = top + box.h * view.scale
  if (px >= left && px <= right && py >= top && py <= bottom) return false
  const reach = HANDLE / 2 + 3 + ROTATE_REACH
  for (const [cx, cy] of [
    [left, top],
    [right, top],
    [right, bottom],
    [left, bottom],
  ]) {
    if (Math.abs(px - cx) <= reach && Math.abs(py - cy) <= reach) return true
  }
  return false
}

function hitHandle(box: Rect, view: View, px: number, py: number): Handle | null {
  const reach = HANDLE / 2 + 3
  for (const h of handlePositions(box, view)) {
    if (Math.abs(px - h.px) <= reach && Math.abs(py - h.py) <= reach) return h.handle
  }
  return null
}

export function GridCanvas(props: GridCanvasProps) {
  const {
    project,
    colors,
    symbols,
    display,
    showGrid,
    showLabels,
    printLayout,
    theme,
    reference,
    referenceEditing = false,
    showProgress,
    filterMode,
    activeFilter,
    editor,
    viewportApi,
  } = props
  const { viewport, zoomAt, panBy, fit } = viewportApi

  const containerRef = useRef<HTMLDivElement>(null)
  const baseRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })
  const [spaceHeld, setSpaceHeld] = useState(false)
  const panning = useRef(false)
  // Held in a ref so a new callback identity never re-creates the observer.
  const onSizeChange = useRef(props.onSizeChange)
  useEffect(() => {
    onSizeChange.current = props.onSizeChange
  }, [props.onSizeChange])

  /* ------------------------------------------------------------ geometry */

  useLayoutEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      const next = { width: Math.round(entry.contentRect.width), height: Math.round(entry.contentRect.height) }
      setSize(next)
      onSizeChange.current?.(next)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // Frame a project the first time it is shown. Coming back to a tab keeps
  // the framing it had, which the tab restores itself.
  const fitted = useRef(new Set<string>())
  useEffect(() => {
    if (size.width === 0 || size.height === 0) return
    if (fitted.current.has(project.id)) return
    fitted.current.add(project.id)
    fit(project.width, project.height, size)
  }, [fit, project.id, project.width, project.height, size])

  const toCell = useCallback(
    (event: { clientX: number; clientY: number }): Point => {
      const canvas = overlayRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      return {
        x: Math.floor((event.clientX - rect.left - viewport.x) / viewport.scale),
        y: Math.floor((event.clientY - rect.top - viewport.y) / viewport.scale),
      }
    },
    [viewport.scale, viewport.x, viewport.y],
  )

  /* -------------------------------------------------------------- layers */

  const prepare = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (!canvas || size.width === 0 || size.height === 0) return null
      const dpr = window.devicePixelRatio || 1
      const w = Math.round(size.width * dpr)
      const h = Math.round(size.height * dpr)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, size.width, size.height)
      return ctx
    },
    [size.height, size.width],
  )

  const liftedFrom = editor.floating?.origin ?? null

  // The reference image, decoded once per source.
  const [referenceImage, setReferenceImage] = useState<HTMLImageElement | null>(null)
  const referenceSrc = reference?.src ?? null
  useEffect(() => {
    if (!referenceSrc) return
    const image = new Image()
    let cancelled = false
    image.onload = () => {
      if (!cancelled) setReferenceImage(image)
    }
    image.src = referenceSrc
    return () => {
      cancelled = true
    }
  }, [referenceSrc])
  const shownReference =
    reference && reference.visible && referenceImage && referenceImage.src === reference.src ? reference : null
  const drawReference = useCallback((ctx: CanvasRenderingContext2D, ox: number, oy: number, scale: number) => {
    if (!shownReference || !referenceImage) return
    ctx.save()
    ctx.globalAlpha = shownReference.opacity
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(
      referenceImage,
      ox + shownReference.x * scale,
      oy + shownReference.y * scale,
      shownReference.w * scale,
      shownReference.h * scale,
    )
    ctx.restore()
  }, [referenceImage, shownReference])

  // Box that carries transform handles: the floating motif, or the selection
  // while the selection tool is active.
  const { floating: floatingBox, selection: selectionBox, tool: activeTool } = editor
  const handleBox = useMemo<Rect | null>(() => {
    if (floatingBox) {
      return { x: floatingBox.x, y: floatingBox.y, w: floatingBox.width, h: floatingBox.height }
    }
    return selectionBox && activeTool === 'select' ? selectionBox : null
  }, [activeTool, floatingBox, selectionBox])

  // Base layer: fabric, stitches, grid lines, coordinates.
  useEffect(() => {
    const ctx = prepare(baseRef.current)
    if (!ctx) return
    const { scale, x: ox, y: oy } = viewport
    const { width, height, cells, done } = project

    const surround = SURROUND[theme]
    ctx.fillStyle = surround.backdrop
    ctx.fillRect(0, 0, size.width, size.height)

    ctx.fillStyle = FABRIC
    ctx.fillRect(ox, oy, width * scale, height * scale)
    // Reference under the stitches: what is already stitched covers it.
    if (shownReference && !shownReference.above) drawReference(ctx, ox, oy, scale)

    // Only touch the stitches that can actually land on screen.
    const x0 = Math.max(0, Math.floor(-ox / scale))
    const y0 = Math.max(0, Math.floor(-oy / scale))
    const x1 = Math.min(width, Math.ceil((size.width - ox) / scale) + 1)
    const y1 = Math.min(height, Math.ceil((size.height - oy) / scale) + 1)

    const filtering = filterMode !== 'off' && activeFilter.size > 0
    let lastValue = -2
    let lastAlpha = 1
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const value = cells[idx(width, x, y)]
        if (value === EMPTY) continue
        let alpha = 1
        if (filtering && !activeFilter.has(value)) {
          if (filterMode === 'isolate') continue
          alpha = 0.12
        }
        // fillStyle changes are the expensive part; runs of one colour are common.
        if (value !== lastValue || alpha !== lastAlpha) {
          ctx.fillStyle = colors[value] ?? '#888888'
          ctx.globalAlpha = alpha
          lastValue = value
          lastAlpha = alpha
        }
        ctx.fillRect(ox + x * scale, oy + y * scale, scale + 0.5, scale + 0.5)
      }
    }
    ctx.globalAlpha = 1

    // Symbols, only once a stitch is big enough to hold a readable glyph.
    if (display !== 'color' && scale >= 9) {
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `${Math.floor(scale * 0.72)}px ui-sans-serif, system-ui, sans-serif`
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const value = cells[idx(width, x, y)]
          if (value === EMPTY) continue
          if (filtering && !activeFilter.has(value) && filterMode === 'isolate') continue
          if (display === 'symbol') {
            ctx.fillStyle = FABRIC
            ctx.fillRect(ox + x * scale, oy + y * scale, scale + 0.5, scale + 0.5)
            ctx.fillStyle = '#1f2937'
          } else {
            ctx.fillStyle = readableInk(colors[value] ?? '#888888')
          }
          ctx.fillText(
            symbols[value] ?? '?',
            ox + x * scale + scale / 2,
            oy + y * scale + scale / 2 + scale * 0.04,
          )
        }
      }
    }

    // Stitches already embroidered get greyed out and ticked.
    if (showProgress) {
      ctx.save()
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const at = idx(width, x, y)
          if (cells[at] === EMPTY || !done[at]) continue
          const px = ox + x * scale
          const py = oy + y * scale
          ctx.fillStyle = 'rgba(248, 250, 252, 0.68)'
          ctx.fillRect(px, py, scale + 0.5, scale + 0.5)
          if (scale >= 7) {
            ctx.strokeStyle = '#16a34a'
            ctx.lineWidth = Math.max(1, scale * 0.12)
            ctx.beginPath()
            ctx.moveTo(px + scale * 0.22, py + scale * 0.54)
            ctx.lineTo(px + scale * 0.44, py + scale * 0.76)
            ctx.lineTo(px + scale * 0.8, py + scale * 0.26)
            ctx.stroke()
          }
        }
      }
      ctx.restore()
    }

    // A lifted motif's source stitches stay visible, faded: they will only be
    // cleared when the motif is committed.
    if (liftedFrom) {
      ctx.fillStyle = FABRIC
      ctx.globalAlpha = 0.55
      for (let y = 0; y < liftedFrom.h; y++) {
        for (let x = 0; x < liftedFrom.w; x++) {
          if (!liftedFrom.mask[y * liftedFrom.w + x]) continue
          const gx = liftedFrom.x + x
          const gy = liftedFrom.y + y
          if (cells[idx(width, gx, gy)] === EMPTY) continue
          ctx.fillRect(ox + gx * scale, oy + gy * scale, scale + 0.5, scale + 0.5)
        }
      }
      ctx.globalAlpha = 1
    }

    // Reference over the stitches (tracing mode), under the grid lines.
    if (shownReference && shownReference.above) drawReference(ctx, ox, oy, scale)

    // Grid lines: thin every stitch, bold every ten, blue on the centre axes.
    if (showGrid && scale >= 4) {
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.strokeStyle = GRID_LINE
      for (let x = x0; x <= x1; x++) {
        if (x % 10 === 0) continue
        const px = Math.round(ox + x * scale) + 0.5
        ctx.moveTo(px, oy)
        ctx.lineTo(px, oy + height * scale)
      }
      for (let y = y0; y <= y1; y++) {
        if (y % 10 === 0) continue
        const py = Math.round(oy + y * scale) + 0.5
        ctx.moveTo(ox, py)
        ctx.lineTo(ox + width * scale, py)
      }
      ctx.stroke()
    }

    // Centre of the pattern, exactly as on the printed chart: a grid line
    // when the dimension is even, the middle of the centre stitch when odd.
    const centerX = width / 2
    const centerY = height / 2
    const cx = Math.round(ox + centerX * scale) + 0.5
    const cy = Math.round(oy + centerY * scale) + 0.5

    if (showGrid) {
      ctx.lineWidth = scale >= 4 ? 1.5 : 1
      ctx.beginPath()
      ctx.strokeStyle = GRID_LINE_BOLD
      for (let x = Math.floor(x0 / 10) * 10; x <= x1; x += 10) {
        if (x === centerX) continue
        const px = Math.round(ox + x * scale) + 0.5
        ctx.moveTo(px, oy)
        ctx.lineTo(px, oy + height * scale)
      }
      for (let y = Math.floor(y0 / 10) * 10; y <= y1; y += 10) {
        if (y === centerY) continue
        const py = Math.round(oy + y * scale) + 0.5
        ctx.moveTo(ox, py)
        ctx.lineTo(ox + width * scale, py)
      }
      ctx.stroke()

      ctx.beginPath()
      ctx.strokeStyle = GRID_LINE_CENTER
      ctx.lineWidth = 2
      ctx.moveTo(cx, oy)
      ctx.lineTo(cx, oy + height * scale)
      ctx.moveTo(ox, cy)
      ctx.lineTo(ox + width * scale, cy)
      ctx.stroke()
    }

    // Where the print view will cut the pattern into sheets.
    if (printLayout) {
      const { cols, rows, pagesX, pagesY } = printLayout
      ctx.save()
      ctx.strokeStyle = PAGE_LINE
      ctx.lineWidth = 2
      ctx.setLineDash([8, 5])
      ctx.beginPath()
      for (let i = 1; i < pagesX; i++) {
        const px = Math.round(ox + i * cols * scale) + 0.5
        ctx.moveTo(px, oy)
        ctx.lineTo(px, oy + height * scale)
      }
      for (let j = 1; j < pagesY; j++) {
        const py = Math.round(oy + j * rows * scale) + 0.5
        ctx.moveTo(ox, py)
        ctx.lineTo(ox + width * scale, py)
      }
      ctx.stroke()
      ctx.setLineDash([])
      ctx.font = 'bold 12px ui-sans-serif, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (let j = 0; j < pagesY; j++) {
        for (let i = 0; i < pagesX; i++) {
          const bx = ox + i * cols * scale + 6
          const by = oy + j * rows * scale + 6
          ctx.fillStyle = PAGE_LINE
          ctx.beginPath()
          ctx.roundRect(bx, by, 22, 18, 4)
          ctx.fill()
          ctx.fillStyle = '#ffffff'
          ctx.fillText(String(j * pagesX + i + 1), bx + 11, by + 9.5)
        }
      }
      ctx.restore()
    }

    // Outer frame.
    ctx.strokeStyle = surround.frame
    ctx.lineWidth = 2
    ctx.strokeRect(ox - 1, oy - 1, width * scale + 2, height * scale + 2)

    // Centre markers on the four sides, pointing inwards like on the sheet.
    const TRI = 6
    if (showGrid) {
      const top = oy - 3
      const bottom = oy + height * scale + 3
      const left = ox - 3
      const right = ox + width * scale + 3
      ctx.fillStyle = GRID_LINE_CENTER
      ctx.beginPath()
      ctx.moveTo(cx, top)
      ctx.lineTo(cx - TRI, top - TRI * 1.5)
      ctx.lineTo(cx + TRI, top - TRI * 1.5)
      ctx.closePath()
      ctx.moveTo(cx, bottom)
      ctx.lineTo(cx - TRI, bottom + TRI * 1.5)
      ctx.lineTo(cx + TRI, bottom + TRI * 1.5)
      ctx.closePath()
      ctx.moveTo(left, cy)
      ctx.lineTo(left - TRI * 1.5, cy - TRI)
      ctx.lineTo(left - TRI * 1.5, cy + TRI)
      ctx.closePath()
      ctx.moveTo(right, cy)
      ctx.lineTo(right + TRI * 1.5, cy - TRI)
      ctx.lineTo(right + TRI * 1.5, cy + TRI)
      ctx.closePath()
      ctx.fill()
    }

    if (showLabels && scale >= 5) {
      // Numbers that would sit under a centre marker are skipped.
      const nearMarker = (k: number, centre: number) =>
        showGrid && Math.abs(k - centre) * scale < TRI * 2.5
      ctx.fillStyle = surround.label
      ctx.font = '11px ui-sans-serif, system-ui, sans-serif'
      ctx.textAlign = 'center'
      for (let x = Math.floor(x0 / 10) * 10; x <= x1; x += 10) {
        if (x === 0 || nearMarker(x, centerX)) continue
        ctx.textBaseline = 'bottom'
        ctx.fillText(String(x), ox + x * scale, oy - 4)
        ctx.textBaseline = 'top'
        ctx.fillText(String(x), ox + x * scale, oy + height * scale + 5)
      }
      ctx.textBaseline = 'middle'
      for (let y = Math.floor(y0 / 10) * 10; y <= y1; y += 10) {
        if (y === 0 || nearMarker(y, centerY)) continue
        ctx.textAlign = 'right'
        ctx.fillText(String(y), ox - 6, oy + y * scale)
        ctx.textAlign = 'left'
        ctx.fillText(String(y), ox + width * scale + 6, oy + y * scale)
      }
    }
  }, [
    activeFilter,
    colors,
    display,
    filterMode,
    liftedFrom,
    prepare,
    printLayout,
    project,
    theme,
    shownReference,
    drawReference,
    showGrid,
    showLabels,
    showProgress,
    size.height,
    size.width,
    symbols,
    viewport,
  ])

  // Overlay layer: cursor, shape preview, marquee, floating patch.
  useEffect(() => {
    const ctx = prepare(overlayRef.current)
    if (!ctx) return
    const { scale, x: ox, y: oy } = viewport
    const { preview, selection, floating, hover, activeThread, tool } = editor
    const activeColor = colors[activeThread] ?? '#334155'

    if (preview) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(ox, oy, project.width * scale, project.height * scale)
      ctx.clip()
      ctx.globalAlpha = 0.75
      ctx.fillStyle = activeThread >= 0 ? activeColor : '#94a3b8'
      for (const { x, y } of preview) {
        ctx.fillRect(ox + x * scale, oy + y * scale, scale + 0.5, scale + 0.5)
      }
      ctx.restore()
    }

    const patch = editor.floatingStitches
    if (floating && patch) {
      const { x: fx, y: fy } = floating
      // Translucent, so the model it will cover stays readable underneath.
      ctx.globalAlpha = 0.6
      for (let y = 0; y < patch.height; y++) {
        for (let x = 0; x < patch.width; x++) {
          const value = patch.cells[y * patch.width + x]
          if (value === EMPTY) continue
          ctx.fillStyle = colors[value] ?? '#888888'
          ctx.fillRect(ox + (fx + x) * scale, oy + (fy + y) * scale, scale + 0.5, scale + 0.5)
        }
      }
      ctx.globalAlpha = 1
    }

    const strokeOutline = (sel: Selection, color: string, dash: number[]) => {
      ctx.save()
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.setLineDash(dash)
      ctx.beginPath()
      for (const [x1, y1, x2, y2] of selectionOutline(sel)) {
        ctx.moveTo(ox + x1 * scale, oy + y1 * scale)
        ctx.lineTo(ox + x2 * scale, oy + y2 * scale)
      }
      ctx.stroke()
      ctx.restore()
    }

    if (floating?.origin) strokeOutline(floating.origin, '#94a3b8', [3, 3])

    if (floating) {
      ctx.save()
      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 2
      ctx.setLineDash([6, 4])
      ctx.strokeRect(
        ox + floating.x * scale,
        oy + floating.y * scale,
        floating.width * scale,
        floating.height * scale,
      )
      ctx.restore()
    } else if (selection) {
      strokeOutline(selection, '#0ea5e9', [5, 3])
    }

    // Shift-drag guide: the row / column the motif is held on.
    const lock = editor.moveLock
    if (lock) {
      ctx.save()
      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      if (lock.axis === 'x') {
        const py = Math.round(oy + lock.at * scale) + 0.5
        ctx.moveTo(ox, py)
        ctx.lineTo(ox + project.width * scale, py)
      } else {
        const px = Math.round(ox + lock.at * scale) + 0.5
        ctx.moveTo(px, oy)
        ctx.lineTo(px, oy + project.height * scale)
      }
      ctx.stroke()
      ctx.restore()
    }

    // Placing the reference: dashed frame and handles.
    if (referenceEditing && reference) {
      const box = { x: reference.x, y: reference.y, w: reference.w, h: reference.h }
      ctx.save()
      ctx.strokeStyle = '#a855f7'
      ctx.lineWidth = 2
      ctx.setLineDash([6, 4])
      ctx.strokeRect(ox + box.x * scale, oy + box.y * scale, box.w * scale, box.h * scale)
      ctx.setLineDash([])
      ctx.fillStyle = '#ffffff'
      for (const { px, py } of handlePositions(box, viewport)) {
        ctx.fillRect(px - HANDLE / 2, py - HANDLE / 2, HANDLE, HANDLE)
        ctx.strokeRect(px - HANDLE / 2, py - HANDLE / 2, HANDLE, HANDLE)
      }
      ctx.restore()
    }

    // Transform handles, Photoshop style.
    const box = handleBox
    if (box) {
      ctx.save()
      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = '#0284c7'
      ctx.lineWidth = 1.5
      for (const { px, py } of handlePositions(box, viewport)) {
        ctx.fillRect(px - HANDLE / 2, py - HANDLE / 2, HANDLE, HANDLE)
        ctx.strokeRect(px - HANDLE / 2, py - HANDLE / 2, HANDLE, HANDLE)
      }
      ctx.restore()
    }

    // The stitch outline under the cursor only makes sense for tools that
    // act on one stitch, and only on the grid itself.
    const paints = PAINT_TOOLS.has(tool) && !floating
    if (
      paints &&
      hover &&
      !panning.current &&
      scale >= 3 &&
      inBounds(project.width, project.height, hover.x, hover.y)
    ) {
      const color = tool === 'eraser' ? '#ef4444' : tool === 'progress' ? '#16a34a' : '#0f172a'
      if (isBrushTool(tool) && (editor.brushes[tool].size > 1)) {
        // Outline of the whole brush footprint, clipped to the grid.
        ctx.save()
        ctx.beginPath()
        ctx.rect(ox, oy, project.width * scale, project.height * scale)
        ctx.clip()
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.beginPath()
        for (const [x1, y1, x2, y2] of selectionOutline(brushShape(editor.brushes[tool], hover))) {
          ctx.moveTo(Math.round(ox + x1 * scale) + 0.5, Math.round(oy + y1 * scale) + 0.5)
          ctx.lineTo(Math.round(ox + x2 * scale) + 0.5, Math.round(oy + y2 * scale) + 0.5)
        }
        ctx.stroke()
        ctx.restore()
      } else {
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.strokeRect(
          Math.round(ox + hover.x * scale) + 0.5,
          Math.round(oy + hover.y * scale) + 0.5,
          scale,
          scale,
        )
      }
    }
  }, [colors, editor, handleBox, prepare, project.height, project.width, reference, referenceEditing, viewport])

  /* ------------------------------------------------------------- pointer */

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !isTextEntry(event.target)) {
        event.preventDefault()
        setSpaceHeld(true)
      }
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') setSpaceHeld(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  // Latest brush state for the (long-lived) wheel listener.
  const brushRef = useRef(editor)
  useLayoutEffect(() => {
    brushRef.current = editor
  })

  // Wheel needs a non-passive listener to be able to cancel page scrolling.
  useEffect(() => {
    const canvas = overlayRef.current
    if (!canvas) return
    let sizeDelta = 0
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      // ⌥ / Alt + wheel: brush size, a gesture that works on every keyboard.
      if (event.altKey && !event.ctrlKey && !event.metaKey) {
        const { tool, brushes, setBrush } = brushRef.current
        if (!isBrushTool(tool)) return
        sizeDelta += event.deltaY || event.deltaX
        // Trackpads send many small deltas: one step per ~40px of scrolling.
        const steps = Math.trunc(sizeDelta / 40)
        if (steps !== 0) {
          sizeDelta -= steps * 40
          setBrush(tool, { size: brushes[tool].size - steps })
        }
        return
      }
      const rect = canvas.getBoundingClientRect()
      if (event.ctrlKey || event.metaKey) {
        zoomAt(
          { x: event.clientX - rect.left, y: event.clientY - rect.top },
          Math.exp(-event.deltaY * 0.0025),
        )
        return
      }
      if (event.shiftKey) panBy(-event.deltaY, 0)
      else panBy(-event.deltaX, -event.deltaY)
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [panBy, zoomAt])

  const pointerInfo = (event: React.PointerEvent<HTMLCanvasElement>): PointerInfo => {
    const rect = event.currentTarget.getBoundingClientRect()
    const px = event.clientX - rect.left
    const py = event.clientY - rect.top
    const gx = (px - viewport.x) / viewport.scale
    const gy = (py - viewport.y) / viewport.scale
    const handle = handleBox ? hitHandle(handleBox, viewport, px, py) : null
    return {
      cell: toCell(event),
      edge: { x: Math.round(gx), y: Math.round(gy) },
      pos: { x: gx, y: gy },
      shift: event.shiftKey,
      alt: event.altKey,
      handle,
      rotate: !handle && handleBox !== null && hitRotate(handleBox, viewport, px, py),
    }
  }

  // The cursor tells what a click would do: resize, move, add, subtract…
  const lastInfo = useRef<PointerInfo | null>(null)
  const cursorFor = (info: PointerInfo | null, shift: boolean, alt: boolean): string => {
    if (spaceHeld) return 'grab'
    const { floating, selection, tool } = editor
    if (info?.handle) return HANDLE_CURSOR[info.handle]
    if (info?.rotate) return ROTATE_CURSOR
    if (floating) {
      const inside =
        info !== null &&
        info.cell.x >= floating.x &&
        info.cell.y >= floating.y &&
        info.cell.x < floating.x + floating.width &&
        info.cell.y < floating.y + floating.height
      return inside ? 'move' : 'default'
    }
    switch (tool) {
      case 'select':
        if (shift) return 'copy'
        if (alt) return 'alias'
        if (info && selection && selectionHas(selection, info.cell.x, info.cell.y)) return 'move'
        return 'crosshair'
      case 'picker':
        return 'copy'
      case 'text':
      case 'motif':
        return 'default'
      default:
        return 'crosshair'
    }
  }
  const applyCursor = (shift = lastInfo.current?.shift ?? false, alt = lastInfo.current?.alt ?? false) => {
    // While placing the reference, the pointer handler owns the cursor.
    if (referenceEditing) return
    const canvas = overlayRef.current
    if (canvas) canvas.style.cursor = cursorFor(lastInfo.current, shift, alt)
  }
  // Last pointer position during a drag, replayed when Shift changes.
  const dragInfo = useRef<PointerInfo | null>(null)
  const moveRef = useRef(editor.onPointerMove)
  useLayoutEffect(() => {
    moveRef.current = editor.onPointerMove
  })

  // Keep the latest closure reachable from the key listeners below.
  const applyCursorRef = useRef(applyCursor)
  useLayoutEffect(() => {
    applyCursorRef.current = applyCursor
    applyCursor()
  })

  // Shift / Alt change the selection cursor even when the mouse stands still.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Shift' || event.key === 'Alt') {
        applyCursorRef.current(event.shiftKey, event.altKey)
        // Mid-drag, Shift locks / unlocks the axis even if the mouse is still.
        const last = dragInfo.current
        if (last) moveRef.current({ ...last, shift: event.shiftKey, alt: event.altKey })
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
    }
  }, [])

  /* Placing the reference: move it, or resize from a handle. */
  const referenceDrag = useRef<{ handle: Handle | null; start: Reference; gx: number; gy: number } | null>(null)
  const gridPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      px: event.clientX - rect.left,
      py: event.clientY - rect.top,
      gx: (event.clientX - rect.left - viewport.x) / viewport.scale,
      gy: (event.clientY - rect.top - viewport.y) / viewport.scale,
    }
  }
  const referenceHit = (px: number, py: number, gx: number, gy: number) => {
    if (!reference) return { handle: null as Handle | null, inside: false }
    const box = { x: reference.x, y: reference.y, w: reference.w, h: reference.h }
    const handle = hitHandle(box, viewport, px, py)
    const inside = gx >= box.x && gy >= box.y && gx <= box.x + box.w && gy <= box.y + box.h
    return { handle, inside }
  }
  const moveReference = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = referenceDrag.current
    if (!drag || !props.onReferenceChange) return
    const { gx, gy } = gridPoint(event)
    const s0 = drag.start
    if (!drag.handle) {
      props.onReferenceChange({ ...s0, x: s0.x + gx - drag.gx, y: s0.y + gy - drag.gy })
      return
    }
    // The opposite side / corner stays fixed; corners keep proportions (Shift: free).
    let left = s0.x
    let top = s0.y
    let right = s0.x + s0.w
    let bottom = s0.y + s0.h
    const h = drag.handle
    if (h.includes('w')) left = Math.min(gx, right - 1)
    if (h.includes('e')) right = Math.max(gx, left + 1)
    if (h.includes('n')) top = Math.min(gy, bottom - 1)
    if (h.includes('s')) bottom = Math.max(gy, top + 1)
    let w = right - left
    let hh = bottom - top
    if (h.length === 2 && !event.shiftKey) {
      const ratio = s0.h / s0.w
      if (w * ratio >= hh) hh = w * ratio
      else w = hh / ratio
      if (h.includes('w')) left = right - w
      if (h.includes('n')) top = bottom - hh
    }
    props.onReferenceChange({ ...s0, x: left, y: top, w, h: hh })
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    // Leave any text field, so arrow keys then move the preview / selection.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    event.currentTarget.setPointerCapture(event.pointerId)
    if (event.button === 1 || spaceHeld || event.button === 2) {
      panning.current = true
      return
    }
    if (event.button !== 0) return
    if (referenceEditing && reference) {
      const { px, py, gx, gy } = gridPoint(event)
      const hit = referenceHit(px, py, gx, gy)
      if (hit.handle || hit.inside) referenceDrag.current = { handle: hit.handle, start: reference, gx, gy }
      return
    }
    editor.onPointerDown(pointerInfo(event))
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (panning.current) {
      panBy(event.movementX, event.movementY)
      return
    }
    if (referenceEditing) {
      if (referenceDrag.current) {
        moveReference(event)
      } else {
        const { px, py, gx, gy } = gridPoint(event)
        const hit = referenceHit(px, py, gx, gy)
        event.currentTarget.style.cursor = hit.handle ? HANDLE_CURSOR[hit.handle] : hit.inside ? 'move' : 'default'
      }
      return
    }
    const info = pointerInfo(event)
    // Mid-drag the cursor stays what it was when the drag began.
    if (event.buttons === 0) {
      lastInfo.current = info
      dragInfo.current = null
      applyCursor(info.shift, info.alt)
    } else {
      dragInfo.current = info
    }
    editor.onPointerMove(info)
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (panning.current) {
      panning.current = false
      return
    }
    if (referenceEditing) {
      referenceDrag.current = null
      return
    }
    dragInfo.current = null
    editor.onPointerUp(pointerInfo(event))
  }

  // Contextual bar under the selection, kept inside the visible area.
  const BAR_W = editor.floating ? 470 : 250
  const bar = handleBox
    ? (() => {
        const left = viewport.x + handleBox.x * viewport.scale
        const top = viewport.y + handleBox.y * viewport.scale
        const bottom = top + handleBox.h * viewport.scale
        const below = bottom + 12
        return {
          left: Math.min(Math.max(8, left), Math.max(8, size.width - BAR_W - 8)),
          top: below + 36 > size.height ? Math.max(8, top - 48) : below,
        }
      })()
    : null

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden"
      style={{ background: SURROUND[theme].backdrop }}>
      <canvas ref={baseRef} className="absolute inset-0 h-full w-full" />
      <canvas
        ref={overlayRef}
        className="absolute inset-0 h-full w-full touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={editor.onPointerLeave}
        onContextMenu={(event) => event.preventDefault()}
      />
      {bar ? (
        <div
          className="no-print absolute z-10 flex items-center gap-1 rounded-lg border border-panel-line bg-panel/95 p-1 shadow-xl"
          style={{ left: bar.left, top: bar.top }}
        >
          <Button size="sm" onClick={editor.flipHorizontal} title={t.flipH}>
            <FlipHorizontal size={14} />
          </Button>
          <Button size="sm" onClick={editor.flipVertical} title={t.flipV}>
            <FlipVertical size={14} />
          </Button>
          <Button size="sm" onClick={editor.rotate} title={t.rotate}>
            <RotateCw size={14} />
          </Button>
          <Button size="sm" onClick={() => editor.rescale(0.5)} title={t.halve}>
            ÷2
          </Button>
          <Button size="sm" onClick={() => editor.rescale(2)} title={t.double}>
            ×2
          </Button>
          {editor.floating ? (
            <>
              <Button
                size="sm"
                onClick={editor.resetFloating}
                disabled={!floatingModified(editor.floating)}
                title={t.resetTitle}
              >
                <History size={14} /> {t.reset}
              </Button>
              <span className="mx-0.5 h-5 w-px bg-panel-line" />
              <Button size="sm" variant="primary" onClick={editor.commitFloating} title={t.applyTitle}>
                <Check size={14} /> {t.apply}
              </Button>
              <Button size="sm" variant="danger" onClick={editor.cancelFloating} title={t.cancelTitle}>
                <X size={14} />
              </Button>
            </>
          ) : (
            <>
              <span className="mx-0.5 h-5 w-px bg-panel-line" />
              <Button size="sm" onClick={editor.clearSelection} title={t.deselectTitle}>
                <X size={14} />
              </Button>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
