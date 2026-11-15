import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Strikethrough,
  Type,
  Underline,
} from 'lucide-react'
import { DEFAULT_FAMILY, closestWeight, findFont } from '../lib/fonts'
import { composeText, rasterizeText, type TextAlign } from '../lib/text'
import { useGoogleFont } from '../hooks/useGoogleFont'
import { FontPicker } from './FontPicker'
import { Button, Field, NumberField, Panel, RangeField, Section, SegmentedControl, TextArea, ToggleRow } from './ui'
import type { Patch, Thread } from '../lib/types'
import { t } from './TextPanel.i18n'

export type TextPanelProps = {
  /** The text tool is selected; previews are only sent while it is. */
  active: boolean
  activeThread: number
  palette: Thread[]
  /** Hex colour per palette index. */
  colors: string[]
  /** A text preview is currently floating on the grid. */
  previewActive: boolean
  /** Another preview (paste, lifted selection) is pending and blocks this one. */
  blocked: boolean
  onPreview: (patch: Patch) => void
  /** Incremented to show again a preview dismissed by a validation or Escape. */
  restoreToken: number
  /** Whether the dismissed preview can be shown again. */
  onRestorableChange: (restorable: boolean) => void
}

/** Starting values, also what each slider's ↺ returns to. */
const TEXT_DEFAULTS = { threshold: 0.45, arc: 0 }

const WEIGHT_LABELS: Record<number, string> = t.weights

/** One effect: its name and numeric settings on a line, then its thread. */
function Effect(props: { label: string; settings: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
        <span>{props.label}</span>
        <span className="flex items-center gap-1">{props.settings}</span>
      </div>
      {props.children}
    </div>
  )
}

/** Thread chooser for an effect: "none" or one of the palette's threads. */
function ThreadDots(props: {
  palette: Thread[]
  colors: string[]
  value: number
  onChange: (index: number) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <button
        type="button"
        onClick={() => props.onChange(-1)}
        className={`h-5 rounded border px-1.5 text-[10px] ${
          props.value < 0 ? 'border-sky-500 text-sky-300' : 'border-panel-line text-slate-500'
        }`}
      >
        {t.none}
      </button>
      {props.palette.map((thread, index) => (
        <button
          key={`${thread.code}-${index}`}
          type="button"
          title={`DMC ${thread.code}`}
          onClick={() => props.onChange(index)}
          className={`h-5 w-5 rounded border ${
            props.value === index ? 'border-sky-400 ring-2 ring-sky-500/60' : 'border-black/30'
          }`}
          style={{ background: props.colors[index] }}
        />
      ))}
    </div>
  )
}

/** Text tool: typed text becomes a live, transformable preview on the grid. */
export function TextPanel(props: TextPanelProps) {
  const [text, setText] = useState(t.sample)
  const [family, setFamily] = useState(DEFAULT_FAMILY)
  const [weight, setWeight] = useState(400)
  const [italic, setItalic] = useState(false)
  const [size, setSize] = useState(14)
  const [letterSpacing, setLetterSpacing] = useState(0)
  const [lineGap, setLineGap] = useState(1)
  const [threshold, setThreshold] = useState(TEXT_DEFAULTS.threshold)
  const [align, setAlign] = useState<TextAlign>('center')
  const [uppercase, setUppercase] = useState(false)
  const [underline, setUnderline] = useState(false)
  const [strike, setStrike] = useState(false)
  const [arc, setArc] = useState(TEXT_DEFAULTS.arc)
  const [outline, setOutline] = useState({ width: 1, thread: -1 })
  const [shadow, setShadow] = useState({ dx: 1, dy: 1, thread: -1 })
  const [frame, setFrame] = useState({ padding: 2, width: 1, thread: -1 })

  const font = findFont(family)
  const effectiveWeight = closestWeight(font, weight)
  const status = useGoogleFont(family, effectiveWeight, italic && font.italic)

  const raster = useMemo(() => {
    // `status` is a dependency on purpose: the glyphs change once the webfont
    // lands, so the raster has to be recomputed even with identical settings.
    void status
    return rasterizeText(text, {
      family,
      weight: effectiveWeight,
      size,
      italic,
      letterSpacing,
      threshold,
      lineGap,
      align,
      uppercase,
      underline,
      strike,
      arc,
    })
  }, [align, arc, effectiveWeight, family, italic, letterSpacing, lineGap, size, status, strike, text, threshold, underline, uppercase])

  // Threads that left the palette fall back to "none".
  const paletteSize = props.palette.length
  const valid = (index: number) => (index < paletteSize ? index : -1)
  const patch = useMemo(() => {
    const keep = (index: number) => (index < paletteSize ? index : -1)
    return composeText(raster, {
      text: props.activeThread,
      outline: { ...outline, thread: keep(outline.thread) },
      shadow: { ...shadow, thread: keep(shadow.thread) },
      frame: { ...frame, thread: keep(frame.thread) },
    })
  }, [frame, outline, paletteSize, props.activeThread, raster, shadow])

  // After a validation (or Escape), the same settings must not pop the
  // preview straight back: it returns on the next change, or on demand.
  const [dismissed, setDismissed] = useState<Patch | null>(null)
  const wasActive = useRef(props.previewActive)
  useEffect(() => {
    if (wasActive.current && !props.previewActive) setDismissed(patch)
    wasActive.current = props.previewActive
  }, [patch, props.previewActive])

  // Coalesce rapid typing into one grid refresh per animation frame.
  const { onPreview, blocked, active } = props
  useEffect(() => {
    if (!active || !patch || blocked || patch === dismissed) return
    const frameId = requestAnimationFrame(() => onPreview(patch))
    return () => cancelAnimationFrame(frameId)
  }, [active, blocked, dismissed, onPreview, patch])

  // "Show the preview again", requested from the shared preview bar.
  const lastRestore = useRef(props.restoreToken)
  useEffect(() => {
    if (props.restoreToken === lastRestore.current) return
    lastRestore.current = props.restoreToken
    setDismissed(null)
  }, [props.restoreToken])

  const restorable = !props.previewActive && !props.blocked && patch !== null && patch === dismissed
  const { onRestorableChange } = props
  useEffect(() => onRestorableChange(restorable), [onRestorableChange, restorable])

  const noThread = props.activeThread < 0
  const warning = noThread
    ? t.noThread
    : props.blocked
      ? t.blocked
      : !patch || raster.width === 0
        ? t.empty
        : null

  return (
    <Panel title={t.title} icon={<Type size={14} />}>
      <div className="space-y-2.5">
        <TextArea
          rows={2}
          value={text}
          placeholder={t.placeholder}
          onChange={(event) => setText(event.target.value)}
        />

        {warning ? <p className="text-[11px] text-amber-300">{warning}</p> : null}

        <Section title={t.font}>
          <FontPicker value={family} onChange={setFamily} />
          {status === 'loading' ? (
            <p className="text-[11px] text-slate-500">{t.fontLoading}</p>
          ) : status === 'fallback' ? (
            <p className="text-[11px] text-amber-300">
              {t.fontFallback}
            </p>
          ) : null}
          <div className="grid grid-cols-2 items-end gap-2">
            <Field label={t.weight}>
              <select
                value={effectiveWeight}
                onChange={(event) => setWeight(Number(event.target.value))}
                disabled={font.weights.length < 2}
                className="w-full rounded-md border border-panel-line bg-panel-soft px-2 py-1.5 text-sm text-slate-100"
              >
                {font.weights.map((value) => (
                  <option key={value} value={value}>
                    {WEIGHT_LABELS[value] ?? value}
                  </option>
                ))}
              </select>
            </Field>
            <ToggleRow label={t.italic} checked={italic} onChange={setItalic} />
          </div>
        </Section>

        <Section title={t.sizeSection}>
          <div className="grid grid-cols-2 gap-2">
            <Field label={t.height}>
              <NumberField min={4} max={160} value={size} onChange={setSize} suffix={t.heightSuffix} aria-label={t.heightAria} />
            </Field>
            <Field label={t.spacing}>
              <NumberField
                min={-10}
                max={20}
                step={0.5}
                decimals={1}
                value={letterSpacing}
                onChange={setLetterSpacing}
                aria-label={t.spacingAria}
              />
            </Field>
            <Field label={t.lineGap}>
              <NumberField min={0} max={40} value={lineGap} onChange={setLineGap} aria-label={t.lineGap} />
            </Field>
            <RangeField
              label={t.threshold}
              min={5}
              max={90}
              value={Math.round(threshold * 100)}
              defaultValue={Math.round(TEXT_DEFAULTS.threshold * 100)}
              format={t.percent}
              onChange={(value) => setThreshold(value / 100)}
              className="self-end"
            />
          </div>
        </Section>

        <Section title={t.formatSection}>
          <div className="flex items-center gap-2">
            <div className="w-28">
              <SegmentedControl<TextAlign>
                value={align}
                onChange={setAlign}
                options={[
                  { value: 'left', label: <AlignLeft size={13} className="mx-auto" />, title: t.alignLeft },
                  { value: 'center', label: <AlignCenter size={13} className="mx-auto" />, title: t.alignCenter },
                  { value: 'right', label: <AlignRight size={13} className="mx-auto" />, title: t.alignRight },
                ]}
              />
            </div>
            <Button
              size="sm"
              variant={uppercase ? 'primary' : 'default'}
              onClick={() => setUppercase(!uppercase)}
              title={t.uppercase}
            >
              AA
            </Button>
            <Button
              size="sm"
              variant={underline ? 'primary' : 'default'}
              onClick={() => setUnderline(!underline)}
              title={t.underline}
            >
              <Underline size={13} />
            </Button>
            <Button
              size="sm"
              variant={strike ? 'primary' : 'default'}
              onClick={() => setStrike(!strike)}
              title={t.strike}
            >
              <Strikethrough size={13} />
            </Button>
          </div>
          <RangeField
            label={t.arc}
            min={-100}
            max={100}
            value={arc}
            defaultValue={TEXT_DEFAULTS.arc}
            format={t.arcValue}
            onChange={setArc}
          />
        </Section>

        <Section title={t.effects}>
          <Effect
            label={t.outline}
            settings={
              <>
                {t.outlineWidth}
                <NumberField min={1} max={3} value={outline.width} onChange={(width) => setOutline({ ...outline, width })} className="w-16" aria-label={t.outlineWidthAria} />
              </>
            }
          >
            <ThreadDots
              palette={props.palette}
              colors={props.colors}
              value={valid(outline.thread)}
              onChange={(thread) => setOutline({ ...outline, thread })}
            />
          </Effect>
          <Effect
            label={t.shadow}
            settings={
              <>
                x
                <NumberField min={-3} max={3} value={shadow.dx} onChange={(dx) => setShadow({ ...shadow, dx })} className="w-16" aria-label={t.shadowXAria} />
                y
                <NumberField min={-3} max={3} value={shadow.dy} onChange={(dy) => setShadow({ ...shadow, dy })} className="w-16" aria-label={t.shadowYAria} />
              </>
            }
          >
            <ThreadDots
              palette={props.palette}
              colors={props.colors}
              value={valid(shadow.thread)}
              onChange={(thread) => setShadow({ ...shadow, thread })}
            />
          </Effect>
          <Effect
            label={t.frame}
            settings={
              <>
                {t.frameMargin}
                <NumberField min={0} max={10} value={frame.padding} onChange={(padding) => setFrame({ ...frame, padding })} className="w-16" aria-label={t.frameMarginAria} />
                {t.frameWidth}
                <NumberField min={1} max={3} value={frame.width} onChange={(width) => setFrame({ ...frame, width })} className="w-16" aria-label={t.frameWidthAria} />
              </>
            }
          >
            <ThreadDots
              palette={props.palette}
              colors={props.colors}
              value={valid(frame.thread)}
              onChange={(thread) => setFrame({ ...frame, thread })}
            />
          </Effect>
        </Section>
      </div>
    </Panel>
  )
}
