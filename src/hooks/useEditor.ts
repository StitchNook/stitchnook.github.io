import { useCallback, useMemo, useRef, useState } from 'react'
import {
  constrain45,
  ellipsePoints,
  floodFillIndices,
  linePoints,
  rectFromDrag,
  rectPoints,
} from '../lib/draw'
import { EMPTY, clampRect, createCells, idx, inBounds } from '../lib/grid'
import {
  clampSelection,
  clearSelectionCells,
  combineSelection,
  extractSelection,
  flipPatchH,
  flipPatchV,
  maskToPatch,
  patchToSelection,
  remapPatch,
  rectSelection,
  rotatePatch,
  scalePatch,
  selectionHas,
  stampPatch,
} from '../lib/selection'
import type { Patch, Point, Project, Rect, Selection, ToolId } from '../lib/types'
import type { ProjectApi } from './useProject'
import { MAX_BRUSH, MIN_BRUSH, brushOffsets, stampBrush, type Brush, type BrushTool } from '../lib/brush'

/**
 * A patch hovering above the grid, not yet stamped into it. Nothing touches
 * the project until it is committed, so cancelling never loses a stitch.
 */
type FloatingShape = {
  /** Line direction at creation (shapes), so "Réinitialiser" can restore it. */
  shapeDiagonal?: 'down' | 'up'
  /** The motif at its original resolution, flips and rotations applied. */
  base: Patch
  /** Its shape (1 / EMPTY), transformed alongside `base`. */
  baseMask: Patch
  /** Displayed size; always rescaled from `base`, so resizing is lossless. */
  width: number
  height: number
  x: number
  y: number
}

export type Floating = FloatingShape & {
  /** Stitches the motif was lifted from, cleared on commit (null for a paste). */
  origin: Selection | null
  /** State when the motif started floating, for "Réinitialiser". */
  initial: FloatingShape
  /** A live text preview, refreshed by the text panel as settings change. */
  kind?: 'text'
  /** Threads added to the palette for this preview; dropped again on cancel. */
  addedThreads?: string[]
  /**
   * A drawn shape: redrawn at every size instead of being scaled, so its
   * outline stays one stitch thin and an ellipse stays round.
   */
  shape?: ShapeSpec
}

export type ShapeSpec = {
  type: 'line' | 'rect' | 'ellipse'
  filled: boolean
  thread: number
  /** Line direction within its box: top-left → bottom-right, or bottom-left → top-right. */
  diagonal: 'down' | 'up'
}

/** Stitches of a shape spec drawn in a `w × h` box. */
export function renderShape(spec: ShapeSpec, w: number, h: number): Patch {
  const cells = createCells(w, h)
  const box = { x: 0, y: 0, w, h }
  const points =
    spec.type === 'line'
      ? spec.diagonal === 'down'
        ? linePoints(0, 0, w - 1, h - 1)
        : linePoints(0, h - 1, w - 1, 0)
      : spec.type === 'rect'
        ? rectPoints(box, spec.filled)
        : ellipsePoints(box, spec.filled)
  for (const { x, y } of points) {
    if (x >= 0 && y >= 0 && x < w && y < h) cells[y * w + x] = spec.thread
  }
  return { width: w, height: h, cells }
}

/** A flip or a quarter turn reverses a line's diagonal; boxes are symmetric. */
const turnShape = (spec: ShapeSpec): ShapeSpec =>
  spec.type === 'line' ? { ...spec, diagonal: spec.diagonal === 'down' ? 'up' : 'down' } : spec

/** Copied stitches plus the DMC code of each thread, so they paste into any project. */
export type Clipboard = { patch: Patch; codes: string[] }

function makeFloating(shape: FloatingShape, origin: Selection | null): Floating {
  return { ...shape, origin, initial: shape }
}

/** Whether the motif was moved or transformed since it started floating. */
export function floatingModified(f: Floating): boolean {
  const i = f.initial
  return (
    f.base !== i.base ||
    f.x !== i.x ||
    f.y !== i.y ||
    f.width !== i.width ||
    f.height !== i.height ||
    (f.shape !== undefined && f.shape.diagonal !== i.shapeDiagonal)
  )
}

/** Transform handles around a selection, named by compass direction. */
export type Handle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

const scaled = (patch: Patch, w: number, h: number) =>
  w === patch.width && h === patch.height ? patch : scalePatch(patch, w, h)

/** The stitches a floating motif will actually stamp. */
export function floatingPatch(f: Floating): Patch {
  return f.shape ? renderShape(f.shape, f.width, f.height) : scaled(f.base, f.width, f.height)
}

export type PointerInfo = {
  cell: Point
  /** Nearest grid line, used by the resize handles. */
  edge: Point
  /** Exact position in grid units, used by the rotation drag. */
  pos: Point
  /** Pointer is in a rotation zone, just outside a corner. */
  rotate?: boolean
  shift: boolean
  alt: boolean
  /** Handle under the pointer, detected in screen pixels by the canvas. */
  handle?: Handle | null
}

type DragMode = 'none' | 'paint' | 'shape' | 'marquee' | 'move' | 'resize' | 'rotate' | 'progress'
type MarqueeMode = 'replace' | 'add' | 'subtract'

type DragState = {
  mode: DragMode
  start: Point
  last: Point
  /** Offset between the grab point and the floating patch origin. */
  grab: Point
  marqueeMode: MarqueeMode
  /** Selection before an add / subtract drag started. */
  marqueeBase: Selection | null
  handle: Handle | null
  /** Floating motif as it was when a resize / rotation started. */
  source: Floating | null
  /** Rotation drag: pivot and starting angle. */
  center: Point
  angle0: number
  /** The press itself lifted the selection; an idle click puts it back. */
  lifted: boolean
  /** Progress strokes: 1 marks, 0 unmarks, decided once when the stroke starts. */
  progressValue: number
  /** Shift state at the last move, so pressing / releasing it re-evaluates. */
  lastShift: boolean
}

/** Axis a Shift-drag is locked to, and the grid line it keeps (for the guide). */
export type MoveLock = { axis: 'x' | 'y'; at: number } | null

const NO_DRAG: DragState = {
  mode: 'none',
  start: { x: 0, y: 0 },
  last: { x: 0, y: 0 },
  grab: { x: 0, y: 0 },
  marqueeMode: 'replace',
  marqueeBase: null,
  handle: null,
  source: null,
  center: { x: 0, y: 0 },
  angle0: 0,
  lifted: false,
  progressValue: 1,
  lastShift: false,
}

function pointsToCells(
  project: Project,
  points: Point[],
  value: number,
): Int16Array | null {
  let next: Int16Array | null = null
  for (const { x, y } of points) {
    if (!inBounds(project.width, project.height, x, y)) continue
    const at = idx(project.width, x, y)
    if (project.cells[at] === value) continue
    if (!next) next = new Int16Array(project.cells)
    next[at] = value
  }
  return next
}

type Axis = { pos: number; len: number; flip: boolean; anchor: number }

/**
 * One axis of a handle drag. The opposite side is the anchor; dragging past
 * it extends the box on the other side and flips the motif, as in Photoshop.
 */
function dragAxis(start: number, size: number, side: 'min' | 'max' | null, edge: number): Axis {
  if (!side) return { pos: start, len: size, flip: false, anchor: start }
  if (side === 'max') {
    const anchor = start
    if (edge > anchor) return { pos: anchor, len: edge - anchor, flip: false, anchor }
    if (edge < anchor) return { pos: edge, len: anchor - edge, flip: true, anchor }
    return { pos: anchor, len: 1, flip: false, anchor }
  }
  const anchor = start + size
  if (edge < anchor) return { pos: edge, len: anchor - edge, flip: false, anchor }
  if (edge > anchor) return { pos: anchor, len: edge - anchor, flip: true, anchor }
  return { pos: anchor - 1, len: 1, flip: false, anchor }
}

/**
 * New box for a handle drag, plus whether each axis ended up mirrored.
 * Corners keep the motif's proportions unless `free` (Shift) is held.
 */
function resizeRect(
  start: Rect,
  handle: Handle,
  edge: Point,
  ratio: number,
  free: boolean,
): { rect: Rect; flipX: boolean; flipY: boolean } {
  const sideX = handle.includes('e') ? 'max' : handle.includes('w') ? 'min' : null
  const sideY = handle.includes('s') ? 'max' : handle.includes('n') ? 'min' : null
  const ax = dragAxis(start.x, start.w, sideX, edge.x)
  const ay = dragAxis(start.y, start.h, sideY, edge.y)
  if (sideX && sideY && !free) {
    // Follow whichever axis moved the most, and derive the other from it.
    if (Math.abs(ax.len / start.w - 1) >= Math.abs(ay.len / start.h - 1)) {
      ay.len = Math.max(1, Math.round(ax.len * ratio))
    } else {
      ax.len = Math.max(1, Math.round(ay.len / ratio))
    }
    // Keep the box on the side of its anchor it was dragged to.
    if (ax.pos < ax.anchor) ax.pos = ax.anchor - ax.len
    if (ay.pos < ay.anchor) ay.pos = ay.anchor - ay.len
  }
  return { rect: { x: ax.pos, y: ay.pos, w: ax.len, h: ay.len }, flipX: ax.flip, flipY: ay.flip }
}

function rotateTimes(patch: Patch, quarterTurns: number): Patch {
  let out = patch
  for (let i = 0; i < quarterTurns; i++) out = rotatePatch(out)
  return out
}

/** What a progress stroke does: decided by the first stitch, or forced. */
export type ProgressMode = 'auto' | 'mark' | 'unmark'

const DEFAULT_BRUSHES: Record<BrushTool, Brush> = {
  pencil: { shape: 'square', size: 1 },
  eraser: { shape: 'square', size: 1 },
  progress: { shape: 'square', size: 1 },
}

export function useEditor(api: ProjectApi) {
  const { project } = api

  const [tool, setTool] = useState<ToolId>('pencil')
  const [activeThread, setActiveThread] = useState(-1)
  const [shapeFilled, setShapeFilled] = useState(false)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [floating, setFloating] = useState<Floating | null>(null)
  const [clipboard, setClipboard] = useState<Clipboard | null>(null)
  const [preview, setPreview] = useState<Point[] | null>(null)
  const [hover, setHover] = useState<Point | null>(null)
  const [brushes, setBrushes] = useState(DEFAULT_BRUSHES)
  const [progressMode, setProgressMode] = useState<ProgressMode>('auto')
  const [moveLock, setMoveLock] = useState<MoveLock>(null)

  /** Each brush tool keeps its own shape and size. */
  const setBrush = useCallback((target: BrushTool, change: Partial<Brush>) => {
    setBrushes((current) => {
      const next = { ...current[target], ...change }
      next.size = Math.min(MAX_BRUSH, Math.max(MIN_BRUSH, Math.round(next.size)))
      return { ...current, [target]: next }
    })
  }, [])

  const drag = useRef<DragState>(NO_DRAG)

  /* ------------------------------------------------------------ floating */

  // Memoised so the canvas and panel share one rescaled patch per change.
  const floatingStitches = useMemo(() => (floating ? floatingPatch(floating) : null), [floating])

  /** Write the floating motif into the project, as a single undo step. */
  const commitFloating = useCallback(() => {
    if (!floating || !floatingStitches) return
    const { x, y, origin } = floating
    const patch = floatingStitches
    api.apply((current) => {
      const cells = new Int16Array(current.cells)
      if (origin) clearSelectionCells(cells, current.width, current.height, origin)
      return {
        ...current,
        cells: stampPatch(cells, current.width, current.height, patch, x, y),
      }
    })
    setFloating(null)
    // The selection keeps the motif's shape where it landed.
    const shape = patchToSelection(scaled(floating.baseMask, floating.width, floating.height), x, y)
    // A drawn shape stays a shape: no selection outline after it is written.
    setSelection(floating.shape ? null : shape && clampSelection(shape, project.width, project.height))
  }, [api, floating, floatingStitches, project.height, project.width])

  /** Drop the preview; the project was never modified. */
  const cancelFloating = useCallback(() => {
    // Threads brought in by a paste / insert leave with it if nothing uses them.
    if (floating?.addedThreads?.length) api.pruneThreads(floating.addedThreads)
    setFloating(null)
  }, [api, floating])

  /**
   * Show text as a floating preview, or refresh the one already shown while
   * keeping its position. Never replaces another pending preview (a paste or
   * a lifted selection): that one has to be validated or cancelled first.
   */
  const previewText = useCallback((patch: Patch, centre: Point) => {
    setFloating((current) => {
      if (current && current.kind !== 'text') return current
      // Same text again (e.g. back on the text tool): keep the user's transforms.
      if (current && current.initial.base === patch) return current
      const shape: FloatingShape = {
        base: patch,
        baseMask: maskToPatch(new Uint8Array(patch.cells.length).fill(1), patch.width, patch.height),
        width: patch.width,
        height: patch.height,
        x: current ? current.x : Math.round(centre.x - patch.width / 2),
        y: current ? current.y : Math.round(centre.y - patch.height / 2),
      }
      const initial = current ? { ...shape, x: current.initial.x, y: current.initial.y } : shape
      return { ...shape, origin: null, initial, kind: 'text' }
    })
  }, [])

  /** Undo every move / transform of the preview, which stays floating. */
  const resetFloating = useCallback(() => {
    setFloating((current) =>
      current
        ? {
            ...current,
            ...current.initial,
            shape: current.shape && current.initial.shapeDiagonal
              ? { ...current.shape, diagonal: current.initial.shapeDiagonal }
              : current.shape,
          }
        : null,
    )
  }, [])

  /** Drop a patch onto the grid as a floating selection, centred if possible. */
  const placePatch = useCallback(
    (patch: Patch, at?: Point, addedThreads?: string[]) => {
      const x = at?.x ?? Math.max(0, Math.floor((project.width - patch.width) / 2))
      const y = at?.y ?? Math.max(0, Math.floor((project.height - patch.height) / 2))
      const mask = new Uint8Array(patch.cells.length).fill(1)
      setFloating(
        makeFloating(
          {
            base: patch,
            baseMask: maskToPatch(mask, patch.width, patch.height),
            width: patch.width,
            height: patch.height,
            x,
            y,
          },
          null,
        ),
      )
      if (addedThreads?.length) setFloating((current) => current && { ...current, addedThreads })
      // The motif library stays open while its motif is placed.
      setTool((current) => (current === 'motif' ? current : 'select'))
    },
    [project.height, project.width],
  )

  /**
   * Place stitches coming from another project (clipboard, inserted model):
   * threads are matched by DMC code, the missing ones added to the palette.
   */
  const placeForeign = useCallback(
    (patch: Patch, codes: string[], at?: Point) => {
      const { indexMap, added } = api.mergeThreads(codes)
      placePatch(remapPatch(patch, indexMap), at, added)
    },
    [api, placePatch],
  )

  const moveFloating = useCallback((dx: number, dy: number) => {
    setFloating((current) => (current ? { ...current, x: current.x + dx, y: current.y + dy } : null))
  }, [])

  /**
   * Turn the current selection into a floating motif. The stitches stay in the
   * project; the canvas only shows them faded until commit.
   */
  const liftSelection = useCallback((): Floating | null => {
    if (floating) return floating
    if (!selection) return null
    const sel = clampSelection(selection, project.width, project.height)
    if (!sel) return null
    return makeFloating(
      {
        base: extractSelection(project.cells, project.width, sel),
        baseMask: maskToPatch(sel.mask, sel.w, sel.h),
        width: sel.w,
        height: sel.h,
        x: sel.x,
        y: sel.y,
      },
      sel,
    )
  }, [floating, project.cells, project.width, project.height, selection])

  /**
   * Arrow keys: move the floating motif, or lift the selection first (still
   * non-destructive: Escape puts it back, Enter applies).
   */
  const nudge = useCallback(
    (dx: number, dy: number) => {
      if (floating) {
        moveFloating(dx, dy)
        return
      }
      if (tool !== 'select') return
      const lifted = liftSelection()
      if (lifted) setFloating({ ...lifted, x: lifted.x + dx, y: lifted.y + dy })
    },
    [floating, liftSelection, moveFloating, tool],
  )

  /** Flip or rotate the original motif, keeping the displayed size in step. */
  const transformFloating = useCallback(
    (transform: (patch: Patch) => Patch, swapsAxes = false) => {
      const source = liftSelection()
      if (!source) return
      setFloating({
        ...source,
        base: transform(source.base),
        baseMask: transform(source.baseMask),
        shape: source.shape ? turnShape(source.shape) : undefined,
        width: swapsAxes ? source.height : source.width,
        height: swapsAxes ? source.width : source.height,
      })
    },
    [liftSelection],
  )

  const flipHorizontal = useCallback(() => transformFloating(flipPatchH), [transformFloating])
  const flipVertical = useCallback(() => transformFloating(flipPatchV), [transformFloating])
  const rotate = useCallback(() => transformFloating(rotatePatch, true), [transformFloating])

  /** Move and resize the floating motif in one go, always from the original. */
  const setFloatingRect = useCallback(
    (rect: Rect, from?: Floating) => {
      const source = from ?? liftSelection()
      if (!source) return
      setFloating({
        ...source,
        x: rect.x,
        y: rect.y,
        width: Math.max(1, Math.round(rect.w)),
        height: Math.max(1, Math.round(rect.h)),
      })
    },
    [liftSelection],
  )

  /** Live resize from the panel fields; the top-left corner stays put. */
  const resizeFloating = useCallback(
    (width: number, height: number) => {
      const source = liftSelection()
      if (!source) return
      const w = Math.max(1, Math.round(width))
      const h = Math.max(1, Math.round(height))
      if (source === floating && w === source.width && h === source.height) return
      setFloatingRect({ x: source.x, y: source.y, w, h }, source)
    },
    [floating, liftSelection, setFloatingRect],
  )

  const rescale = useCallback(
    (factor: number) => {
      const source = liftSelection()
      if (!source) return
      resizeFloating(source.width * factor, source.height * factor)
    },
    [liftSelection, resizeFloating],
  )

  /* ---------------------------------------------------------- clipboard */

  const copy = useCallback(() => {
    const codes = project.palette.map((thread) => thread.code)
    if (floatingStitches) {
      setClipboard({ patch: floatingStitches, codes })
      return
    }
    const sel = selection && clampSelection(selection, project.width, project.height)
    if (!sel) return
    setClipboard({ patch: extractSelection(project.cells, project.width, sel), codes })
  }, [floatingStitches, project.cells, project.palette, project.width, project.height, selection])

  const deleteSelection = useCallback(() => {
    // Deleting a lifted motif erases where it came from; a pasted one just goes.
    const sel = floating ? floating.origin : selection
    if (floating?.addedThreads?.length) api.pruneThreads(floating.addedThreads)
    setFloating(null)
    if (!sel) return
    api.apply((current) => {
      const cells = new Int16Array(current.cells)
      clearSelectionCells(cells, current.width, current.height, sel)
      return { ...current, cells }
    })
  }, [api, floating, selection])

  const cut = useCallback(() => {
    copy()
    deleteSelection()
  }, [copy, deleteSelection])

  const paste = useCallback(() => {
    // Never silently replace a preview that has not been validated yet.
    if (!clipboard || floating) return
    const at = selection ? { x: selection.x, y: selection.y } : undefined
    placeForeign(clipboard.patch, clipboard.codes, at)
  }, [clipboard, floating, placeForeign, selection])

  const selectAll = useCallback(() => {
    setFloating(null)
    setSelection(rectSelection({ x: 0, y: 0, w: project.width, h: project.height }))
    setTool('select')
  }, [project.height, project.width])

  const clearSelection = useCallback(() => setSelection(null), [])

  /** Contour / plein and the active thread also restyle a shape being previewed. */
  const changeShapeFilled = useCallback((filled: boolean) => {
    setShapeFilled(filled)
    setFloating((current) => (current?.shape ? { ...current, shape: { ...current.shape, filled } } : current))
  }, [])
  const changeActiveThread = useCallback((thread: number) => {
    setActiveThread(thread)
    if (thread < 0) return
    setFloating((current) => (current?.shape ? { ...current, shape: { ...current.shape, thread } } : current))
  }, [])

  /** Switching to a painting tool drops the selection outline. */
  const changeTool = useCallback((next: ToolId) => {
    setTool(next)
    if (next !== 'select') setSelection(null)
  }, [])

  /* ------------------------------------------------------- grid painting */

  const paint = useCallback(
    (points: Point[], value: number) => {
      api.applyStroke((current) => {
        const cells = pointsToCells(current, points, value)
        return cells ? { ...current, cells } : current
      })
    },
    [api],
  )

  const markProgress = useCallback(
    (points: Point[], value: number) => {
      api.applyStroke((current) => {
        let next: Uint8Array | null = null
        for (const { x, y } of points) {
          if (!inBounds(current.width, current.height, x, y)) continue
          const at = idx(current.width, x, y)
          // Only stitches that actually carry a thread can be ticked off.
          if (current.cells[at] === EMPTY) continue
          if (current.done[at] === value) continue
          if (!next) next = new Uint8Array(current.done)
          next[at] = value
        }
        return next ? { ...current, done: next } : current
      })
    },
    [api],
  )

  const shapePoints = useCallback(
    (start: Point, end: Point, shift: boolean): Point[] => {
      if (tool === 'line') {
        const target = shift ? constrain45(start.x, start.y, end.x, end.y) : end
        return linePoints(start.x, start.y, target.x, target.y)
      }
      const rect = rectFromDrag(start, end, shift)
      return tool === 'ellipse' ? ellipsePoints(rect, shapeFilled) : rectPoints(rect, shapeFilled)
    },
    [shapeFilled, tool],
  )

  /* --------------------------------------------------------- pointer API */

  /** Marquee result, never reaching past the grid. */
  const marqueeSelection = useCallback(
    (base: Selection | null, rect: Rect, mode: MarqueeMode) => {
      const area = clampRect(rect, project.width, project.height)
      if (!area) return mode === 'replace' ? null : base
      return mode === 'replace' ? rectSelection(area) : combineSelection(base, area, mode)
    },
    [project.height, project.width],
  )

  const startMove = (f: Floating, cell: Point, lifted = false) => {
    drag.current = {
      ...NO_DRAG,
      lifted,
      source: f,
      mode: 'move',
      start: cell,
      last: cell,
      grab: { x: cell.x - f.x, y: cell.y - f.y },
    }
  }
  const startResize = (f: Floating, cell: Point, handle: Handle, lifted = false) => {
    drag.current = { ...NO_DRAG, mode: 'resize', start: cell, last: cell, handle, source: f, lifted }
  }
  const startRotate = (f: Floating, info: PointerInfo, lifted = false) => {
    const center = { x: f.x + f.width / 2, y: f.y + f.height / 2 }
    drag.current = {
      ...NO_DRAG,
      lifted,
      mode: 'rotate',
      start: info.cell,
      last: info.cell,
      source: f,
      center,
      angle0: Math.atan2(info.pos.y - center.y, info.pos.x - center.x),
    }
  }

  const onPointerDown = useCallback(
    (info: PointerInfo) => {
      const { cell, alt, shift, handle } = info
      setHover(cell)

      // While a motif floats, the grid is read-only: it can be dragged or
      // resized, and only Enter / Valider writes it. Clicks beside it do nothing.
      if (floating) {
        if (handle) {
          startResize(floating, cell, handle)
          return
        }
        if (info.rotate) {
          startRotate(floating, info)
          return
        }
        const inside =
          cell.x >= floating.x &&
          cell.y >= floating.y &&
          cell.x < floating.x + floating.width &&
          cell.y < floating.y + floating.height
        if (inside) {
          startMove(floating, cell)
          return
        }
        // With a shape tool, drawing beside the current shape validates it
        // and starts the next one; otherwise a click beside does nothing.
        const shapeTool = tool === 'line' || tool === 'rect' || tool === 'ellipse'
        if (!(floating.shape && shapeTool)) return
        commitFloating()
      }

      switch (tool) {
        case 'picker': {
          if (!inBounds(project.width, project.height, cell.x, cell.y)) return
          const value = project.cells[idx(project.width, cell.x, cell.y)]
          if (value !== EMPTY) setActiveThread(value)
          return
        }
        case 'fill': {
          if (!inBounds(project.width, project.height, cell.x, cell.y)) return
          const value = alt || activeThread < 0 ? EMPTY : activeThread
          const indices = floodFillIndices(project.cells, project.width, project.height, cell.x, cell.y)
          if (indices.length === 0) return
          api.apply((current) => {
            const cells = new Int16Array(current.cells)
            for (const at of indices) cells[at] = value
            return { ...current, cells }
          })
          return
        }
        case 'line':
        case 'rect':
        case 'ellipse': {
          drag.current = { ...NO_DRAG, mode: 'shape', start: cell, last: cell }
          setPreview(shapePoints(cell, cell, shift))
          return
        }
        case 'select': {
          const modifier = shift || alt
          // Handles and the inside of a selection lift its content.
          const grabs = handle || info.rotate || (selection && selectionHas(selection, cell.x, cell.y))
          if (selection && !modifier && grabs) {
            const lifted = liftSelection()
            if (lifted) {
              setFloating(lifted)
              if (handle) startResize(lifted, cell, handle, true)
              else if (info.rotate) startRotate(lifted, info, true)
              else startMove(lifted, cell, true)
              return
            }
          }
          const marqueeMode: MarqueeMode = shift ? 'add' : alt ? 'subtract' : 'replace'
          drag.current = {
            ...NO_DRAG,
            mode: 'marquee',
            start: cell,
            last: cell,
            marqueeMode,
            marqueeBase: selection,
          }
          setSelection(marqueeSelection(selection, { x: cell.x, y: cell.y, w: 1, h: 1 }, marqueeMode))
          return
        }
        case 'progress': {
          // Auto: starting on a stitch already done undoes; otherwise it marks.
          // Alt / Option inverts whatever the mode says.
          let value = progressMode === 'unmark' ? 0 : 1
          if (progressMode === 'auto' && inBounds(project.width, project.height, cell.x, cell.y)) {
            const at = idx(project.width, cell.x, cell.y)
            if (project.cells[at] !== EMPTY && project.done[at]) value = 0
          }
          if (alt) value = 1 - value
          drag.current = { ...NO_DRAG, mode: 'progress', start: cell, last: cell, progressValue: value }
          api.beginStroke()
          markProgress(stampBrush([cell], brushOffsets(brushes.progress)), value)
          return
        }
        case 'text':
        case 'motif':
          return
        default: {
          drag.current = { ...NO_DRAG, mode: 'paint', start: cell, last: cell }
          api.beginStroke()
          const value = tool === 'eraser' || alt ? EMPTY : activeThread
          const brush = tool === 'eraser' ? brushes.eraser : brushes.pencil
          if (value === EMPTY || value >= 0) paint(stampBrush([cell], brushOffsets(brush)), value)
        }
      }
    },
    [
      activeThread,
      api,
      brushes,
      commitFloating,
      floating,
      liftSelection,
      markProgress,
      marqueeSelection,
      paint,
      progressMode,
      project.cells,
      project.done,
      project.height,
      project.width,
      selection,
      shapePoints,
      tool,
    ],
  )

  const onPointerMove = useCallback(
    (info: PointerInfo) => {
      const { cell, alt, shift } = info
      setHover(cell)
      const state = drag.current
      if (state.mode === 'none') return

      if (state.mode === 'resize') {
        const source = state.source
        if (!source || !state.handle) return
        const ratio = source.base.height / source.base.width
        const start = { x: source.x, y: source.y, w: source.width, h: source.height }
        const { rect, flipX, flipY } = resizeRect(start, state.handle, info.edge, ratio, shift)
        // Always derived from the drag's starting state, so coming back undoes the flip.
        const flip = (patch: Patch) => {
          let out = patch
          if (flipX) out = flipPatchH(out)
          if (flipY) out = flipPatchV(out)
          return out
        }
        setFloatingRect(rect, {
          ...source,
          base: flip(source.base),
          baseMask: flip(source.baseMask),
          shape: source.shape && flipX !== flipY ? turnShape(source.shape) : source.shape,
        })
        return
      }

      if (state.mode === 'rotate') {
        const source = state.source
        if (!source) return
        const { center } = state
        const delta = Math.atan2(info.pos.y - center.y, info.pos.x - center.x) - state.angle0
        // A stitch grid only turns by quarter turns; screen y points down, so a
        // positive angle is clockwise, like rotatePatch.
        const turns = (((Math.round(delta / (Math.PI / 2)) % 4) + 4) % 4)
        const odd = turns % 2 === 1
        const w = odd ? source.height : source.width
        const h = odd ? source.width : source.height
        setFloating({
          ...source,
          base: rotateTimes(source.base, turns),
          baseMask: rotateTimes(source.baseMask, turns),
          shape: source.shape && odd ? turnShape(source.shape) : source.shape,
          width: w,
          height: h,
          x: Math.round(center.x - w / 2),
          y: Math.round(center.y - h / 2),
        })
        return
      }

      const same = cell.x === state.last.x && cell.y === state.last.y
      if (same && state.mode !== 'shape' && !(state.mode === 'move' && shift !== state.lastShift)) return

      switch (state.mode) {
        case 'paint': {
          const value = tool === 'eraser' || alt ? EMPTY : activeThread
          if (value !== EMPTY && value < 0) break
          // Interpolate: a fast drag skips cells between two pointer events.
          const brush = tool === 'eraser' ? brushes.eraser : brushes.pencil
          paint(stampBrush(linePoints(state.last.x, state.last.y, cell.x, cell.y), brushOffsets(brush)), value)
          break
        }
        case 'progress':
          markProgress(
            stampBrush(linePoints(state.last.x, state.last.y, cell.x, cell.y), brushOffsets(brushes.progress)),
            state.progressValue,
          )
          break
        case 'shape':
          setPreview(shapePoints(state.start, cell, shift))
          break
        case 'marquee': {
          const rect = rectFromDrag(state.start, cell, false)
          setSelection(marqueeSelection(state.marqueeBase, rect, state.marqueeMode))
          break
        }
        case 'move': {
          // Shift locks the move to its dominant axis, measured from where the
          // drag started, so the original row / column alignment is kept.
          let dx = cell.x - state.start.x
          let dy = cell.y - state.start.y
          const axis = shift ? (Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y') : null
          if (axis === 'x') dy = 0
          if (axis === 'y') dx = 0
          const x0 = state.start.x - state.grab.x
          const y0 = state.start.y - state.grab.y
          const size = state.source
          setMoveLock(
            axis && size
              ? { axis, at: axis === 'x' ? y0 + size.height / 2 : x0 + size.width / 2 }
              : null,
          )
          setFloating((current) => (current ? { ...current, x: x0 + dx, y: y0 + dy } : null))
          break
        }
      }
      drag.current = { ...state, last: cell, lastShift: shift }
    },
    [activeThread, brushes, markProgress, marqueeSelection, paint, setFloatingRect, shapePoints, tool],
  )

  const onPointerUp = useCallback(
    (info: PointerInfo) => {
      const state = drag.current
      drag.current = NO_DRAG
      setMoveLock(null)
      if (state.mode === 'shape') {
        setPreview(null)
        const value = info.alt || activeThread < 0 ? EMPTY : activeThread
        if (value === EMPTY) {
          // Erasing with a shape (Alt) is applied straight away.
          const points = shapePoints(state.start, info.cell, info.shift)
          if (points.length > 0) {
            api.beginStroke()
            paint(points, value)
            api.endStroke()
          }
          return
        }
        // The shape becomes a preview to place, resize and validate.
        let box: Rect
        let diagonal: ShapeSpec['diagonal'] = 'down'
        if (tool === 'line') {
          const end = info.shift ? constrain45(state.start.x, state.start.y, info.cell.x, info.cell.y) : info.cell
          box = {
            x: Math.min(state.start.x, end.x),
            y: Math.min(state.start.y, end.y),
            w: Math.abs(end.x - state.start.x) + 1,
            h: Math.abs(end.y - state.start.y) + 1,
          }
          diagonal = (end.x - state.start.x) * (end.y - state.start.y) >= 0 ? 'down' : 'up'
        } else {
          box = rectFromDrag(state.start, info.cell, info.shift)
        }
        const type = tool === 'line' ? 'line' : tool === 'ellipse' ? 'ellipse' : 'rect'
        const spec: ShapeSpec = { type, filled: shapeFilled, thread: value, diagonal }
        const base = renderShape(spec, box.w, box.h)
        const full = new Uint8Array(box.w * box.h).fill(1)
        setFloating({
          ...makeFloating(
            {
              base,
              baseMask: maskToPatch(full, box.w, box.h),
              width: box.w,
              height: box.h,
              x: box.x,
              y: box.y,
              shapeDiagonal: diagonal,
            },
            null,
          ),
          shape: spec,
        })
        return
      }
      // Pressing a selection lifts it; if nothing was actually changed, put it
      // back. A plain click inside it deselects, as in image editors.
      if (state.lifted) {
        setFloating((current) => (current && !floatingModified(current) ? null : current))
        const clicked = state.start.x === state.last.x && state.start.y === state.last.y
        if (state.mode === 'move' && clicked) setSelection(null)
      }
      if (state.mode === 'marquee') {
        // A plain click without dragging deselects, as in image editors.
        const clicked = state.start.x === state.last.x && state.start.y === state.last.y
        if (clicked && state.marqueeMode === 'replace') setSelection(null)
        else setSelection((current) => current && clampSelection(current, project.width, project.height))
      }
      api.endStroke()
    },
    [activeThread, api, paint, project.height, project.width, shapeFilled, shapePoints, tool],
  )

  const onPointerLeave = useCallback(() => setHover(null), [])

  return {
    tool,
    setTool: changeTool,
    activeThread,
    setActiveThread: changeActiveThread,
    shapeFilled,
    setShapeFilled: changeShapeFilled,
    brushes,
    setBrush,
    progressMode,
    setProgressMode,
    selection,
    setSelection,
    floating,
    floatingStitches,
    clipboard,
    preview,
    hover,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
    commitFloating,
    cancelFloating,
    resetFloating,
    placePatch,
    placeForeign,
    previewText,
    nudge,
    moveLock,
    moveFloating,
    flipHorizontal,
    flipVertical,
    rotate,
    rescale,
    resizeFloating,
    copy,
    cut,
    paste,
    deleteSelection,
    selectAll,
    clearSelection,
  }
}

export type EditorApi = ReturnType<typeof useEditor>
