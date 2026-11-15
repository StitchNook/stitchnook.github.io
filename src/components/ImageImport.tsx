import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { rememberMotifFolder } from '../lib/folders'
import { CreateBody } from './CreateLayout'
import { Crop, ImagePlus, Maximize2, RotateCcw, Replace, Trash2, Undo2, ZoomIn, ZoomOut } from 'lucide-react'
import { IS_MAC } from '../lib/platform'
import { DMCModal } from './DMCModal'
import { FabricSizeFields } from './FabricSizeFields'
import { Button, RangeField, Field, Modal, SegmentedControl, TextInput, ToggleRow } from './ui'
import { dmcByCode, readableInk } from '../lib/dmc'
import { EMPTY, MAX_SIZE, MIN_SIZE, clampSize } from '../lib/grid'
import {
  NO_ADJUSTMENTS,
  adjustPixels,
  applyReplacements,
  buildPalette,
  FULL_CROP,
  convertIllustration,
  convertImage,
  detectBackground,
  loadImageFile,
  sampleImage,
} from '../lib/imageConvert'
import type { Adjustments, ConversionOptions, ConversionResult, CropRect } from '../lib/imageConvert'
import type { Fabric, ProjectKind, Thread } from '../lib/types'
import { t } from './ImageImport.i18n'

export type ImageImportResult = {
  name: string
  width: number
  height: number
  fabric: Fabric
  palette: Thread[]
  cells: Int16Array
  kind: ProjectKind
  folderId?: string
}

export type ImageImportProps = {
  fabric: Fabric
  /** Shared header of the « Créer » window (type and source). */
  header: ReactNode
  /** Chosen in that header. */
  kind: ProjectKind
  folderId?: string
  onCreate: (result: ImageImportResult) => void
  onClose: () => void
}

const DEFAULT_OPTIONS: ConversionOptions = {
  style: 'illustration',
  maxColors: 20,
  dither: false,
  removeBackground: false,
  backgroundColor: '#ffffff',
  tolerance: 12,
  cleanup: true,
  minRegion: 3,
  backgroundFromEdges: true,
}

/** Longest side, in stitches, proposed when an image is first loaded. */
const DEFAULT_LONG_SIDE = 100

/** Plain fabric colour shown behind empty stitches in the preview. */
const FABRIC_HEX = '#f4efe4'

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function runConversion(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  adjust: Adjustments,
  options: ConversionOptions,
  crop: CropRect,
): ConversionResult {
  if (options.style === 'illustration') return convertIllustration(bitmap, width, height, adjust, options, crop)
  const sampled = sampleImage(bitmap, width, height, crop)
  return convertImage(sampled, adjustPixels(sampled, adjust), options)
}

/** Build a stitch chart from a picture, with live preview and thread swaps. */
export function ImageImport(props: ImageImportProps) {
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [name, setName] = useState(t.defaultName)
  const { kind, folderId } = props
  const motif = kind === 'motif'
  const [fabric, setFabric] = useState<Fabric>(props.fabric)
  const [width, setWidth] = useState(80)
  const [height, setHeight] = useState(80)
  const [keepRatio, setKeepRatio] = useState(true)
  const [adjust, setAdjust] = useState<Adjustments>(NO_ADJUSTMENTS)
  const [options, setOptions] = useState<ConversionOptions>(DEFAULT_OPTIONS)
  const [replacements, setReplacements] = useState<Map<string, string | null>>(new Map())
  const [view, setView] = useState<'result' | 'original'>('result')
  const [showGrid, setShowGrid] = useState(true)
  const [hovered, setHovered] = useState<number | null>(null)
  const [replacing, setReplacing] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Escape inside the nested catalogue must only close the catalogue.
  useEffect(() => {
    if (replacing === null) return
    const handler = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      setReplacing(null)
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [replacing])

  // Part of the image kept (Recadrer); proportions follow the crop.
  const [crop, setCrop] = useState<CropRect>(FULL_CROP)
  const [cropping, setCropping] = useState(false)
  const ratio = bitmap ? (bitmap.height * crop.h) / (bitmap.width * crop.w) : 1

  const loadFile = async (file: File) => {
    setError(null)
    try {
      const image = await loadImageFile(file)
      const r = image.height / image.width
      const w = clampSize(r <= 1 ? DEFAULT_LONG_SIDE : DEFAULT_LONG_SIDE / r)
      const h = clampSize(r <= 1 ? DEFAULT_LONG_SIDE * r : DEFAULT_LONG_SIDE)
      setBitmap(image)
      setCrop(FULL_CROP)
      setCropping(false)
      setWidth(w)
      setHeight(h)
      setReplacements(new Map())
      setOptions((current) => ({
        ...current,
        backgroundColor: detectBackground(sampleImage(image, w, h)),
      }))
      const base = file.name.replace(/\.[^.]+$/, '').trim()
      if (base) setName(base)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.importFailed)
    }
  }

  // With linked proportions the other side always comes from the image's own
  // ratio (never from the other rounded value), so edits never drift. When
  // that side would leave the allowed range, both are fitted and we say so.
  const [ratioNote, setRatioNote] = useState<string | null>(null)
  const applyLinked = (w: number, h: number, edited: 'w' | 'h') => {
    if (h > MAX_SIZE || w > MAX_SIZE) {
      const scale = Math.min(MAX_SIZE / w, MAX_SIZE / h)
      w = Math.max(MIN_SIZE, Math.round(w * scale))
      h = Math.max(MIN_SIZE, Math.round(h * scale))
      setRatioNote(t.ratioLimited(MAX_SIZE))
    } else {
      setRatioNote(null)
    }
    setWidth(edited === 'w' ? w : clampSize(w))
    setHeight(edited === 'h' ? h : clampSize(h))
  }
  const changeWidth = (w: number) => {
    if (keepRatio && bitmap) applyLinked(w, Math.max(MIN_SIZE, Math.round(w * ratio)), 'w')
    else setWidth(w)
  }
  const changeHeight = (h: number) => {
    if (keepRatio && bitmap) applyLinked(Math.max(MIN_SIZE, Math.round(h / ratio)), h, 'h')
    else setHeight(h)
  }

  /* ------------------------------------------------------------ conversion */

  const live = useMemo(
    () => ({ width, height, adjust, options, crop }),
    [width, height, adjust, options, crop],
  )
  const params = useDebounced(live, 200)

  const base = useMemo(
    () =>
      bitmap
        ? runConversion(bitmap, params.width, params.height, params.adjust, params.options, params.crop)
        : null,
    [bitmap, params],
  )
  const result = useMemo(
    () => (base ? applyReplacements(base, replacements) : null),
    [base, replacements],
  )
  const stitches = result ? result.counts.reduce((sum, n) => sum + n, 0) : 0
  const pending = live !== params

  const setReplacement = (code: string, target: string | null | undefined) => {
    setReplacements((current) => {
      const next = new Map(current)
      if (target === undefined || target === code) next.delete(code)
      else next.set(code, target)
      return next
    })
  }

  const create = () => {
    if (!bitmap) return
    // Recompute from the live values so a click right after a change is not stale.
    const fresh = applyReplacements(runConversion(bitmap, width, height, adjust, options, crop), replacements)
    props.onCreate({
      name: name.trim() || t.defaultName,
      width: fresh.width,
      height: fresh.height,
      fabric,
      palette: buildPalette(fresh.codes),
      cells: fresh.cells,
      kind,
      folderId: motif ? folderId : undefined,
    })
    if (motif) rememberMotifFolder(folderId)
  }

  const usedCodes = useMemo(() => new Set(result?.codes ?? []), [result])

  return (
    <Modal
      // Empty: a compact window around the drop zone. With an image: the
      // full-height two-column layout (settings scroll, preview stays put).
      // One size whatever the source or step, so the « Créer » window never jumps.
      xl
      fill
      title={motif ? t.createMotif : t.createProject}
      onClose={props.onClose}
      footer={
        <>
          <span className="mr-auto self-center text-xs text-slate-500">
            {result
              ? t.footer(result.width, result.height, stitches, result.codes.length)
              : t.chooseToStart}
          </span>
          <Button onClick={props.onClose}>{t.cancel}</Button>
          <Button variant="primary" disabled={!bitmap || stitches === 0} onClick={create}>
            {motif ? t.createMotifButton : t.createProjectButton}
          </Button>
        </>
      }
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) void loadFile(file)
        }}
      />

      <CreateBody header={props.header} scroll={false}>
      {!bitmap ? (
        <div className="mx-auto w-full max-w-2xl space-y-3 overflow-y-auto pt-6">
          {error ? <ErrorBox message={error} /> : null}
          <DropZone
            dragging={dragging}
            onDragging={setDragging}
            onFile={(file) => void loadFile(file)}
            onBrowse={() => fileRef.current?.click()}
          />
        </div>
      ) : (
        // Settings scroll on their own; the preview column stays in view.
        // (Narrow screens: one column, scrolling as a whole.)
        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto lg:grid-cols-[360px_minmax(0,1fr)] lg:overflow-hidden">
          {/* ---------------------------------------------------- settings */}
          <div className="min-h-0 space-y-4 lg:overflow-y-auto lg:pr-2">
            {error ? <ErrorBox message={error} /> : null}

            <div className="flex items-center gap-3 rounded-lg border border-panel-line bg-panel-soft/50 p-2">
              <BitmapThumb bitmap={bitmap} />
              <div className="min-w-0 flex-1 text-xs text-slate-400">
                <p>{t.source(bitmap.width, bitmap.height)}</p>
                <Button size="sm" className="mt-1" onClick={() => fileRef.current?.click()}>
                  <ImagePlus size={13} /> {t.changeImage}
                </Button>
              </div>
            </div>

            <Field label={motif ? t.motifName : t.projectName}>
              <TextInput value={name} onChange={(event) => setName(event.target.value)} />
            </Field>

            <FabricSizeFields
              fabric={fabric}
              onFabricChange={setFabric}
              width={width}
              height={height}
              onWidthChange={changeWidth}
              onHeightChange={changeHeight}
              linked={keepRatio}
              onLinkedChange={(linked) => {
                setKeepRatio(linked)
                if (linked && bitmap) applyLinked(width, Math.max(MIN_SIZE, Math.round(width * ratio)), 'w')
                else setRatioNote(null)
              }}
              extra={
                <p className="text-[11px] text-slate-500">
                  {ratioNote ??
                    (keepRatio
                      ? t.ratioKept
                      : t.ratioFree)}
                </p>
              }
            />

            <div className="space-y-3 rounded-lg border border-panel-line bg-panel-soft/50 p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                  {t.conversion}
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  title={t.resetTitle}
                  onClick={() => {
                    setAdjust(NO_ADJUSTMENTS)
                    setOptions((current) => ({
                      ...DEFAULT_OPTIONS,
                      backgroundColor: current.backgroundColor,
                    }))
                  }}
                >
                  <RotateCcw size={13} /> {t.reset}
                </Button>
              </div>

              <SegmentedControl<ConversionOptions['style']>
                value={options.style}
                onChange={(style) => setOptions({ ...options, style })}
                options={[
                  { value: 'illustration', label: t.illustration, title: t.illustrationTitle },
                  { value: 'photo', label: t.photo, title: t.photoTitle },
                ]}
              />
              <p className="-mt-1 text-[11px] text-slate-500">
                {options.style === 'illustration'
                  ? t.illustrationHelp
                  : t.photoHelp}
              </p>
              <RangeField
                label={t.maxColors}
                defaultValue={DEFAULT_OPTIONS.maxColors}
                min={2}
                max={60}
                value={options.maxColors}
                onChange={(maxColors) => setOptions({ ...options, maxColors })}
              />
              <RangeField
                label={t.brightness}
                defaultValue={NO_ADJUSTMENTS.brightness}
                min={-100}
                max={100}
                value={adjust.brightness}
                onChange={(brightness) => setAdjust({ ...adjust, brightness })}
              />
              <RangeField
                label={t.contrast}
                defaultValue={NO_ADJUSTMENTS.contrast}
                min={-100}
                max={100}
                value={adjust.contrast}
                onChange={(contrast) => setAdjust({ ...adjust, contrast })}
              />
              <RangeField
                label={t.saturation}
                defaultValue={NO_ADJUSTMENTS.saturation}
                min={-100}
                max={100}
                value={adjust.saturation}
                onChange={(saturation) => setAdjust({ ...adjust, saturation })}
              />

              <RangeField
                label={t.minRegion}
                defaultValue={DEFAULT_OPTIONS.minRegion}
                min={0}
                max={6}
                value={options.minRegion}
                format={t.minRegionValue}
                onChange={(minRegion) => setOptions({ ...options, minRegion })}
              />

              <div>
                {options.style === 'photo' ? (
                  <>
                    <ToggleRow
                      label={t.dither}
                      checked={options.dither}
                      onChange={(dither) => setOptions({ ...options, dither })}
                    />
                    <ToggleRow
                      label={t.cleanup}
                      checked={options.cleanup}
                      onChange={(cleanup) => setOptions({ ...options, cleanup })}
                    />
                  </>
                ) : null}
                <ToggleRow
                  label={t.removeBackground}
                  checked={options.removeBackground}
                  onChange={(removeBackground) => setOptions({ ...options, removeBackground })}
                />
              </div>

              {options.removeBackground ? (
                <div className="space-y-2 rounded-md border border-panel-line p-2">
                  <label className="flex items-center justify-between text-xs text-slate-400">
                    {t.backgroundColor}
                    <input
                      type="color"
                      value={options.backgroundColor}
                      onChange={(event) =>
                        setOptions({ ...options, backgroundColor: event.target.value })
                      }
                      className="h-6 w-10 cursor-pointer rounded border border-panel-line bg-transparent"
                    />
                  </label>
                  <RangeField
                    label={t.tolerance}
                    defaultValue={DEFAULT_OPTIONS.tolerance}
                    min={0}
                    max={60}
                    value={options.tolerance}
                    onChange={(tolerance) => setOptions({ ...options, tolerance })}
                  />
                  <ToggleRow
                    label={t.removeInside}
                    checked={!options.backgroundFromEdges}
                    onChange={(inside) => setOptions({ ...options, backgroundFromEdges: !inside })}
                  />
                  <p className="text-[11px] text-slate-500">
                    {options.backgroundFromEdges
                      ? t.edgesOnly
                      : t.everywhere}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {/* ----------------------------------------------------- preview */}
          <div className="flex min-h-0 min-w-0 flex-col gap-3">
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <div className="w-56">
                <SegmentedControl
                  value={view}
                  onChange={setView}
                  options={[
                    { value: 'result', label: t.stitchedPreview },
                    { value: 'original', label: t.originalImage },
                  ]}
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-400">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={showGrid}
                  onChange={(event) => setShowGrid(event.target.checked)}
                />
                {t.grid}
              </label>
              <Button
                size="sm"
                variant={cropping ? 'primary' : 'default'}
                onClick={() => setCropping(!cropping)}
                title={t.cropTitle}
              >
                <Crop size={13} /> {t.crop}{crop !== FULL_CROP ? ' ✓' : ''}
              </Button>
              {pending ? <span className="text-xs text-slate-500">{t.computing}</span> : null}
            </div>

            {cropping ? (
              <CropEditor
                bitmap={bitmap}
                crop={crop}
                onCancel={() => setCropping(false)}
                onApply={(next) => {
                  setCropping(false)
                  setCrop(next)
                  // Proportions and background follow the new framing.
                  const r = (bitmap.height * next.h) / (bitmap.width * next.w)
                  if (keepRatio) applyLinked(width, Math.max(MIN_SIZE, Math.round(width * r)), 'w')
                  setOptions((current) => ({
                    ...current,
                    backgroundColor: detectBackground(sampleImage(bitmap, width, Math.max(1, Math.round(width * r)), next)),
                  }))
                }}
              />
            ) : (
              <PreviewCanvas
                bitmap={bitmap}
                crop={crop}
                result={result}
                base={base}
                view={view}
                showGrid={showGrid}
                highlight={hovered}
              />
            )}

            {cropping ? null : (
            <ThreadList
              base={base}
              replacements={replacements}
              onHover={setHovered}
              onReplace={setReplacing}
              onRemove={(code) => setReplacement(code, null)}
              onRestore={(code) => setReplacement(code, undefined)}
            />
            )}
          </div>
        </div>
      )}
      </CreateBody>

      {replacing !== null ? (
        <DMCModal
          title={t.replaceTitle(replacing)}
          paletteCodes={usedCodes}
          onPick={(code) => {
            setReplacement(replacing, code)
            setReplacing(null)
          }}
          onClose={() => setReplacing(null)}
        />
      ) : null}
    </Modal>
  )
}

/* ------------------------------------------------------------------ pieces */

function ErrorBox(props: { message: string }) {
  return (
    <p className="rounded-md border border-rose-700/60 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
      {props.message}
    </p>
  )
}

function DropZone(props: {
  dragging: boolean
  onDragging: (dragging: boolean) => void
  onFile: (file: File) => void
  onBrowse: () => void
}) {
  return (
    <div
      onDragOver={(event) => {
        event.preventDefault()
        props.onDragging(true)
      }}
      onDragLeave={() => props.onDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        props.onDragging(false)
        const file = event.dataTransfer.files[0]
        if (file) props.onFile(file)
      }}
      className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-16 text-center transition ${
        props.dragging ? 'border-sky-500 bg-sky-500/10' : 'border-panel-line'
      }`}
    >
      <ImagePlus size={32} className="text-slate-500" />
      <p className="text-sm text-slate-300">{t.dropHere}</p>
      <p className="text-xs text-slate-500">{t.formats}</p>
      <Button variant="primary" onClick={props.onBrowse}>
        {t.chooseImage}
      </Button>
    </div>
  )
}

function BitmapThumb(props: { bitmap: ImageBitmap }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const scale = Math.min(64 / props.bitmap.width, 64 / props.bitmap.height)
    canvas.width = Math.max(1, Math.round(props.bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(props.bitmap.height * scale))
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(props.bitmap, 0, 0, canvas.width, canvas.height)
  }, [props.bitmap])
  return (
    <div className="grid h-16 w-16 shrink-0 place-items-center rounded bg-black/30">
      <canvas ref={ref} className="max-h-16 max-w-16" />
    </div>
  )
}

/** Preview zoom: 1 = fit the frame; centre in stitch coordinates. */
type PreviewView = { zoom: number; cx: number; cy: number }
const MAX_PREVIEW_ZOOM = 16

function PreviewCanvas(props: {
  bitmap: ImageBitmap
  crop: CropRect
  result: ConversionResult | null
  base: ConversionResult | null
  view: 'result' | 'original'
  showGrid: boolean
  /** Index into `base.codes` whose stitches are emphasised. */
  highlight: number | null
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [box, setBox] = useState({ width: 0, height: 0 })
  const { result, base } = props
  const cols = result?.width ?? 1
  const rows = result?.height ?? 1

  // Zoom / pan survive the Result ⇄ Original switch, and reset when the grid
  // size changes (a different pattern to look at).
  const sizeKey = `${cols}x${rows}`
  const [view, setView] = useState<PreviewView & { key: string }>({ key: sizeKey, zoom: 1, cx: cols / 2, cy: rows / 2 })
  if (view.key !== sizeKey) setView({ key: sizeKey, zoom: 1, cx: cols / 2, cy: rows / 2 })
  const fit = () => setView({ key: sizeKey, zoom: 1, cx: cols / 2, cy: rows / 2 })

  useEffect(() => {
    const element = boxRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      setBox({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const fitCell = box.width > 0 ? Math.min(box.width / cols, box.height / rows) : 1
  const cell = fitCell * view.zoom
  const originX = box.width / 2 - view.cx * cell
  const originY = box.height / 2 - view.cy * cell

  /** Zoom by `factor` keeping the stitch under (px, py) in place. */
  const zoomAt = (factor: number, px = box.width / 2, py = box.height / 2) => {
    setView((current) => {
      const zoom = Math.min(MAX_PREVIEW_ZOOM, Math.max(1, current.zoom * factor))
      const oldCell = fitCell * current.zoom
      const newCell = fitCell * zoom
      // Stitch coordinates under the pointer stay fixed.
      const sx = current.cx + (px - box.width / 2) / oldCell
      const sy = current.cy + (py - box.height / 2) / oldCell
      if (zoom === 1) return { ...current, zoom, cx: cols / 2, cy: rows / 2 }
      return {
        ...current,
        zoom,
        cx: clampX(sx - (px - box.width / 2) / newCell),
        cy: clampY(sy - (py - box.height / 2) / newCell),
      }
    })
  }
  // The view centre never leaves the pattern, so it can't be lost off-screen.
  const clampX = (x: number) => Math.min(cols, Math.max(0, x))
  const clampY = (y: number) => Math.min(rows, Math.max(0, y))
  const panBy = (dx: number, dy: number) =>
    setView((current) => ({ ...current, cx: clampX(current.cx - dx / cell), cy: clampY(current.cy - dy / cell) }))

  // Latest handlers for the non-passive wheel listener.
  const wheelRef = useRef<(event: WheelEvent) => void>(() => {})
  useLayoutEffect(() => {
    wheelRef.current = (event: WheelEvent) => {
      event.preventDefault()
      const rect = canvasRef.current!.getBoundingClientRect()
      if (event.ctrlKey || event.metaKey) {
        // Ctrl / ⌘ + wheel, and the trackpad pinch (sent with ctrlKey).
        // A mouse notch (~100) is one step of ×1.4; trackpad pinches send small deltas.
        const speed = Math.abs(event.deltaY) < 30 ? 0.02 : 0.0035
        zoomAt(Math.exp(-event.deltaY * speed), event.clientX - rect.left, event.clientY - rect.top)
      } else if (view.zoom > 1) {
        panBy(-event.deltaX, -event.deltaY)
      }
    }
  })
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onWheel = (event: WheelEvent) => wheelRef.current(event)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [])

  const drag = useRef<{ x: number; y: number } | null>(null)

  // One pixel per stitch, rebuilt only when the result or highlight change.
  const stitchImage = useMemo(() => {
    if (!result) return null
    const small = document.createElement('canvas')
    small.width = result.width
    small.height = result.height
    const sctx = small.getContext('2d')
    if (!sctx) return null
    const image = sctx.createImageData(result.width, result.height)
    const rgb = result.codes.map((code) => {
      const hex = dmcByCode(code).hex.replace('#', '')
      return [0, 2, 4].map((o) => parseInt(hex.slice(o, o + 2), 16))
    })
    const fabricRgb = [0xf4, 0xef, 0xe4]
    const dim = props.highlight !== null && base !== null
    for (let i = 0; i < result.cells.length; i++) {
      const v = result.cells[i]
      let [r, g, b] = v === EMPTY ? fabricRgb : rgb[v]
      if (dim && base.cells[i] !== props.highlight) {
        r = r * 0.25 + 30
        g = g * 0.25 + 30
        b = b * 0.25 + 30
      }
      image.data[i * 4] = r
      image.data[i * 4 + 1] = g
      image.data[i * 4 + 2] = b
      image.data[i * 4 + 3] = 255
    }
    sctx.putImageData(image, 0, 0)
    return small
  }, [base, props.highlight, result])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !result || box.width === 0) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(box.width * dpr)
    canvas.height = Math.round(box.height * dpr)
    canvas.style.width = `${box.width}px`
    canvas.style.height = `${box.height}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, box.width, box.height)

    const w = cols * cell
    const h = rows * cell
    ctx.fillStyle = FABRIC_HEX
    ctx.fillRect(originX, originY, w, h)
    if (props.view === 'original') {
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      const crop = props.crop
      const bw = props.bitmap.width
      const bh = props.bitmap.height
      ctx.drawImage(props.bitmap, crop.x * bw, crop.y * bh, crop.w * bw, crop.h * bh, originX, originY, w, h)
    } else if (stitchImage) {
      // Scaled up without smoothing; the browser only rasterises what is visible.
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(stitchImage, originX, originY, w, h)
    }

    if (props.showGrid && cell >= 4) {
      // Only the lines that are on screen.
      const x0 = Math.max(0, Math.floor(-originX / cell))
      const x1 = Math.min(cols, Math.ceil((box.width - originX) / cell))
      const y0 = Math.max(0, Math.floor(-originY / cell))
      const y1 = Math.min(rows, Math.ceil((box.height - originY) / cell))
      const line = (bold: boolean) => {
        ctx.beginPath()
        for (let x = x0; x <= x1; x++) {
          if ((x % 10 === 0) !== bold) continue
          const px = Math.round(originX + x * cell) + 0.5
          ctx.moveTo(px, Math.max(0, originY))
          ctx.lineTo(px, Math.min(box.height, originY + h))
        }
        for (let y = y0; y <= y1; y++) {
          if ((y % 10 === 0) !== bold) continue
          const py = Math.round(originY + y * cell) + 0.5
          ctx.moveTo(Math.max(0, originX), py)
          ctx.lineTo(Math.min(box.width, originX + w), py)
        }
        ctx.strokeStyle = bold ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.15)'
        ctx.lineWidth = 1
        ctx.stroke()
      }
      line(false)
      line(true)
    }
  }, [box, cell, cols, originX, originY, props.bitmap, props.crop, props.showGrid, props.view, result, rows, stitchImage])

  return (
    <div
      ref={boxRef}
      className="relative h-[52vh] min-h-64 overflow-hidden rounded-lg border border-panel-line bg-black/30 lg:h-auto lg:min-h-0 lg:flex-1"
    >
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 touch-none ${view.zoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onPointerDown={(event) => {
          if (view.zoom <= 1) return
          event.currentTarget.setPointerCapture(event.pointerId)
          drag.current = { x: event.clientX, y: event.clientY }
        }}
        onPointerMove={(event) => {
          if (!drag.current) return
          panBy(event.clientX - drag.current.x, event.clientY - drag.current.y)
          drag.current = { x: event.clientX, y: event.clientY }
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onDoubleClick={fit}
      />
      <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md border border-panel-line bg-panel/90 p-0.5 shadow">
        <Button size="sm" variant="ghost" onClick={() => zoomAt(1 / 1.5)} disabled={view.zoom <= 1} title={t.zoomOut}>
          <ZoomOut size={13} />
        </Button>
        <span className="w-12 text-center text-[11px] tabular-nums text-slate-300">{t.zoom(Math.round(view.zoom * 100))}</span>
        <Button size="sm" variant="ghost" onClick={() => zoomAt(1.5)} disabled={view.zoom >= MAX_PREVIEW_ZOOM} title={t.zoomIn}>
          <ZoomIn size={13} />
        </Button>
        <Button size="sm" variant="ghost" onClick={fit} disabled={view.zoom === 1} title={t.fit}>
          <Maximize2 size={13} />
        </Button>
      </div>
      {view.zoom === 1 ? (
        <p className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white/80">
          {t.zoomHint(IS_MAC)}
        </p>
      ) : null}
    </div>
  )
}

/**
 * Pick the part of the image to keep: drag the frame or its corners; the
 * darkened outside is dropped from the conversion.
 */
export function CropEditor(props: {
  bitmap: ImageBitmap
  crop: CropRect
  onApply: (crop: CropRect) => void
  onCancel: () => void
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [box, setBox] = useState({ width: 0, height: 0 })
  const [rect, setRect] = useState<CropRect>(props.crop)
  const drag = useRef<{ mode: 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'new'; x: number; y: number; start: CropRect } | null>(null)

  useEffect(() => {
    const element = boxRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setBox({ width: entry.contentRect.width, height: entry.contentRect.height }))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // The image, fitted in the frame.
  const { bitmap } = props
  const scale = box.width > 0 ? Math.min(box.width / bitmap.width, box.height / bitmap.height) : 1
  const iw = bitmap.width * scale
  const ih = bitmap.height * scale
  const ix = (box.width - iw) / 2
  const iy = (box.height - ih) / 2

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || box.width === 0) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(box.width * dpr)
    canvas.height = Math.round(box.height * dpr)
    canvas.style.width = `${box.width}px`
    canvas.style.height = `${box.height}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, box.width, box.height)
    ctx.drawImage(bitmap, ix, iy, iw, ih)
    const rx = ix + rect.x * iw
    const ry = iy + rect.y * ih
    const rw = rect.w * iw
    const rh = rect.h * ih
    // Darken what will be dropped.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
    ctx.fillRect(ix, iy, iw, ry - iy)
    ctx.fillRect(ix, ry + rh, iw, iy + ih - ry - rh)
    ctx.fillRect(ix, ry, rx - ix, rh)
    ctx.fillRect(rx + rw, ry, ix + iw - rx - rw, rh)
    ctx.strokeStyle = '#38bdf8'
    ctx.lineWidth = 2
    ctx.strokeRect(rx, ry, rw, rh)
    ctx.fillStyle = '#ffffff'
    for (const [hx, hy] of [[rx, ry], [rx + rw, ry], [rx, ry + rh], [rx + rw, ry + rh]]) {
      ctx.fillRect(hx - 5, hy - 5, 10, 10)
      ctx.strokeRect(hx - 5, hy - 5, 10, 10)
    }
  }, [bitmap, box, ih, iw, ix, iy, rect])

  const toImage = (event: React.PointerEvent) => {
    const bounds = canvasRef.current!.getBoundingClientRect()
    return {
      x: Math.min(1, Math.max(0, (event.clientX - bounds.left - ix) / iw)),
      y: Math.min(1, Math.max(0, (event.clientY - bounds.top - iy) / ih)),
    }
  }
  const MIN = 0.02

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div ref={boxRef} className="relative h-[52vh] min-h-64 overflow-hidden rounded-lg border border-panel-line bg-black/40 lg:h-auto lg:min-h-0 lg:flex-1">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair touch-none"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)
            const p = toImage(event)
            const near = (cx: number, cy: number) => Math.abs((p.x - cx) * iw) < 10 && Math.abs((p.y - cy) * ih) < 10
            const { x, y, w, h } = rect
            const mode = near(x, y)
              ? 'nw'
              : near(x + w, y)
                ? 'ne'
                : near(x, y + h)
                  ? 'sw'
                  : near(x + w, y + h)
                    ? 'se'
                    : // A frame covering the whole image can't move: dragging draws a new one.
                      p.x > x && p.x < x + w && p.y > y && p.y < y + h && (w < 0.98 || h < 0.98)
                      ? 'move'
                      : 'new'
            drag.current = { mode, x: p.x, y: p.y, start: mode === 'new' ? { x: p.x, y: p.y, w: 0, h: 0 } : rect }
          }}
          onPointerMove={(event) => {
            const d = drag.current
            if (!d) return
            const p = toImage(event)
            const s = d.start
            let left = s.x
            let top = s.y
            let right = s.x + s.w
            let bottom = s.y + s.h
            if (d.mode === 'move') {
              const dx = Math.min(1 - right, Math.max(-left, p.x - d.x))
              const dy = Math.min(1 - bottom, Math.max(-top, p.y - d.y))
              left += dx
              right += dx
              top += dy
              bottom += dy
            } else if (d.mode === 'new') {
              left = Math.min(d.x, p.x)
              right = Math.max(d.x, p.x)
              top = Math.min(d.y, p.y)
              bottom = Math.max(d.y, p.y)
            } else {
              if (d.mode.includes('w')) left = Math.min(p.x, right - MIN)
              if (d.mode.includes('e')) right = Math.max(p.x, left + MIN)
              if (d.mode.includes('n')) top = Math.min(p.y, bottom - MIN)
              if (d.mode.includes('s')) bottom = Math.max(p.y, top + MIN)
            }
            setRect({ x: left, y: top, w: right - left, h: bottom - top })
          }}
          onPointerUp={() => {
            drag.current = null
            setRect((r) => (r.w < MIN || r.h < MIN ? props.crop : r))
          }}
        />
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <span className="mr-auto text-[11px] text-slate-500">
          {t.cropHelp}
        </span>
        <Button size="sm" variant="ghost" onClick={() => setRect(FULL_CROP)}>
          {t.keepAll}
        </Button>
        <Button size="sm" onClick={props.onCancel}>
          {t.cancel}
        </Button>
        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            const full = rect.x < 0.001 && rect.y < 0.001 && rect.w > 0.999 && rect.h > 0.999
            props.onApply(full ? FULL_CROP : rect)
          }}
        >
          {t.applyCrop}
        </Button>
      </div>
    </div>
  )
}

function ThreadList(props: {
  base: ConversionResult | null
  replacements: ReadonlyMap<string, string | null>
  onHover: (index: number | null) => void
  onReplace: (code: string) => void
  onRemove: (code: string) => void
  onRestore: (code: string) => void
}) {
  const { base } = props
  if (!base) return null
  if (base.codes.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-panel-line px-3 py-4 text-center text-xs text-slate-500">
        {t.noStitches}
      </p>
    )
  }
  return (
    <div className="shrink-0 rounded-lg border border-panel-line bg-panel-soft/40">
      <h3 className="border-b border-panel-line px-3 py-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
        {t.threadsHeading}
      </h3>
      <ul
        className="grid max-h-40 gap-1 overflow-y-auto p-2 sm:grid-cols-2"
        onMouseLeave={() => props.onHover(null)}
      >
        {base.codes.map((code, index) => {
          const color = dmcByCode(code)
          const replaced = props.replacements.has(code)
          const target = props.replacements.get(code)
          const targetColor = target ? dmcByCode(target) : null
          return (
            <li
              key={code}
              onMouseEnter={() => props.onHover(index)}
              className="flex items-center gap-2 rounded-md border border-transparent px-1.5 py-1 hover:border-panel-line hover:bg-panel-soft"
            >
              <span
                className={`h-6 w-6 shrink-0 rounded border border-black/30 ${replaced ? 'opacity-40' : ''}`}
                style={{ background: color.hex }}
              />
              <span className="min-w-0 flex-1 text-xs">
                <span className="flex items-center gap-1 font-semibold text-slate-100">
                  <span className={replaced ? 'text-slate-500 line-through' : ''}>DMC {code}</span>
                  {replaced ? (
                    targetColor ? (
                      <>
                        →
                        <span
                          className="inline-block rounded px-1"
                          style={{ background: targetColor.hex, color: readableInk(targetColor.hex) }}
                        >
                          {targetColor.code}
                        </span>
                      </>
                    ) : (
                      <span className="text-rose-300">{t.removed}</span>
                    )
                  ) : null}
                </span>
                <span className="block truncate text-[11px] text-slate-400">
                  {targetColor ? targetColor.name : color.name} · {t.count(base.counts[index])}
                </span>
              </span>
              {replaced ? (
                <button
                  type="button"
                  title={t.restore}
                  onClick={() => props.onRestore(code)}
                  className="shrink-0 rounded p-1 text-slate-500 transition hover:bg-panel-line hover:text-slate-200"
                >
                  <Undo2 size={14} />
                </button>
              ) : null}
              <button
                type="button"
                title={t.replace}
                onClick={() => props.onReplace(code)}
                className="shrink-0 rounded p-1 text-slate-500 transition hover:bg-sky-500/15 hover:text-sky-300"
              >
                <Replace size={14} />
              </button>
              {target !== null || !replaced ? (
                <button
                  type="button"
                  title={t.removeThread}
                  onClick={() => props.onRemove(code)}
                  className="shrink-0 rounded p-1 text-slate-500 transition hover:bg-rose-500/15 hover:text-rose-400"
                >
                  <Trash2 size={14} />
                </button>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
