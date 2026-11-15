import { useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronRight, RotateCcw } from 'lucide-react'
import { KEYS } from '../lib/platform'
import { keyLabel } from '../lib/keys'
import { useKeyLayout } from '../hooks/useKeyLabels'
import { PanelHeaderContext } from './panelContext'
import { formatNumber as formatLocale } from '../i18n'
import { t } from './ui.i18n'

/** Small building blocks shared by every panel, so spacing stays consistent. */

/** Remembered open / closed state of a collapsible section. */
function useStoredOpen(storageKey: string | undefined, defaultOpen = true): [boolean, (open: boolean) => void] {
  const key = storageKey ? `stitchly.panel.${storageKey}` : null
  const [open, setOpen] = useState(() => {
    if (!key) return defaultOpen
    try {
      const stored = localStorage.getItem(key)
      return stored === null ? defaultOpen : stored !== 'closed'
    } catch {
      return defaultOpen
    }
  })
  const update = (next: boolean) => {
    setOpen(next)
    if (!key) return
    try {
      localStorage.setItem(key, next ? 'open' : 'closed')
    } catch {
      /* Storage unavailable: the state lasts for this session. */
    }
  }
  return [open, update]
}

export function Panel(props: {
  title: string
  icon?: ReactNode
  children: ReactNode
  actions?: ReactNode
  /** Clicking the title folds the section; the state is remembered under this key. */
  storageKey?: string
}) {
  const collapsible = props.storageKey !== undefined
  const [open, setOpen] = useStoredOpen(props.storageKey)
  const withHeader = useContext(PanelHeaderContext)
  if (!withHeader) {
    return (
      <section className="border-b border-panel-line/70">
        {props.actions ? <div className="flex justify-end gap-1 px-3 pt-2">{props.actions}</div> : null}
        <div className="px-3 pt-2 pb-3">{props.children}</div>
      </section>
    )
  }
  const title = (
    <>
      {props.icon ? <span className="text-slate-400">{props.icon}</span> : null}
      <h2 className="flex-1 text-left text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
        {props.title}
      </h2>
    </>
  )
  return (
    <section className="border-b border-panel-line/70">
      <header className="flex items-center gap-2 px-3 pt-3 pb-2">
        {collapsible ? (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            title={open ? t.fold : t.unfold}
            className="flex min-w-0 flex-1 items-center gap-2"
          >
            <ChevronRight size={12} className={`shrink-0 text-slate-500 transition ${open ? 'rotate-90' : ''}`} />
            {title}
          </button>
        ) : (
          title
        )}
        {open ? props.actions : null}
      </header>
      {open ? <div className="px-3 pb-3">{props.children}</div> : null}
    </section>
  )
}

/** A foldable sub-section inside a panel (state remembered). */
export function Disclosure(props: {
  title: ReactNode
  storageKey: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useStoredOpen(props.storageKey, props.defaultOpen)
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="mb-1.5 flex w-full items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-200"
      >
        <ChevronRight size={12} className={`transition ${open ? 'rotate-90' : ''}`} />
        {props.title}
      </button>
      {open ? props.children : null}
    </div>
  )
}

/** A titled group of settings inside a panel, separated by a thin rule. */
export function Section(props: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2 border-t border-panel-line/60 pt-2.5 first:border-t-0 first:pt-0">
      <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-500 uppercase">{props.title}</p>
      {props.children}
    </div>
  )
}

/** A list area with a maximum height that scrolls. */
export function ScrollArea(props: { maxHeight: string; children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-y-auto pr-1 ${props.className ?? ''}`} style={{ maxHeight: props.maxHeight }}>
      {props.children}
    </div>
  )
}

export function Field(props: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-400">{props.label}</span>
      {props.children}
      {props.hint ? <span className="mt-1 block text-[11px] text-slate-500">{props.hint}</span> : null}
    </label>
  )
}

const CONTROL =
  'w-full rounded-md border border-panel-line bg-panel-soft px-2.5 py-1.5 text-sm text-slate-100 ' +
  'outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props
  return <input {...rest} className={`${CONTROL} ${className}`} />
}


export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', ...rest } = props
  return <select {...rest} className={`${CONTROL} ${className}`} />
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = '', ...rest } = props
  return <textarea {...rest} className={`${CONTROL} resize-y ${className}`} />
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
}

const VARIANTS: Record<NonNullable<ButtonProps['variant']>, string> = {
  default: 'bg-panel-soft text-slate-100 border border-panel-line hover:bg-panel-line',
  primary: 'bg-sky-600 text-white border border-sky-500 hover:bg-sky-500',
  danger: 'bg-rose-700/80 text-white border border-rose-600 hover:bg-rose-600',
  ghost: 'bg-transparent text-slate-300 border border-transparent hover:bg-panel-soft',
}

export function Button({ variant = 'default', size = 'md', className = '', ...rest }: ButtonProps) {
  const sizing = size === 'sm' ? 'px-2 py-1 text-xs gap-1' : 'px-2.5 py-1.5 text-sm gap-1.5'
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTS[variant]} ${sizing} ${className}`}
    />
  )
}

export function ToggleRow(props: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-1 text-sm text-slate-300">
      <span>{props.label}</span>
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={props.checked}
        onChange={(event) => props.onChange(event.target.checked)}
      />
    </label>
  )
}

/** Segmented control used for display mode, units, filter mode… */
export function SegmentedControl<T extends string>(props: {
  value: T
  options: { value: T; label: ReactNode; title?: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="flex rounded-md border border-panel-line bg-panel-soft p-0.5">
      {props.options.map((option) => (
        <button
          key={option.value}
          type="button"
          title={option.title}
          aria-pressed={props.value === option.value}
          onClick={() => props.onChange(option.value)}
          className={`flex-1 rounded px-2 py-1 text-xs font-medium transition ${
            props.value === option.value
              ? 'bg-sky-600 text-white'
              : 'text-slate-300 hover:bg-panel-line'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Modal(props: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
  /** Extra-wide variant, for side-by-side settings and preview. */
  xl?: boolean
  /**
   * Full-height window whose body does not scroll: the content lays out its
   * own scrolling areas (e.g. settings scroll while the preview stays put).
   */
  fill?: boolean
}) {
  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) props.onClose()
      }}
    >
      <div
        className={`flex w-full flex-col overflow-hidden rounded-xl border border-panel-line bg-panel shadow-2xl ${
          props.fill ? 'h-[88vh]' : 'max-h-[88vh]'
        } ${
          props.xl ? 'max-w-6xl' : props.wide ? 'max-w-4xl' : 'max-w-lg'
        }`}
      >
        <header className="flex items-center justify-between border-b border-panel-line px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-100">{props.title}</h2>
          <Button variant="ghost" size="sm" onClick={props.onClose} aria-label={t.close}>
            ✕
          </Button>
        </header>
        <div className={`min-h-0 flex-1 px-4 py-4 ${props.fill ? 'overflow-hidden' : 'overflow-auto'}`}>
          {props.children}
        </div>
        {props.footer ? (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-panel-line px-4 py-3">
            {props.footer}
          </footer>
        ) : null}
      </div>
    </div>
  )
}

/**
 * Slider with its value and a ↺ that brings it back to its default. The ↺
 * only shows once the value has moved (its slot stays reserved so nothing
 * shifts); double-clicking the slider resets too.
 */
export function RangeField(props: {
  label: ReactNode
  value: number
  min: number
  max: number
  step?: number
  defaultValue: number
  onChange: (value: number) => void
  format?: (value: number) => string
  /** One line, for toolbars. */
  compact?: boolean
  className?: string
}) {
  const format = props.format ?? String
  const changed = props.value !== props.defaultValue
  const reset = (
    <button
      type="button"
      onClick={() => props.onChange(props.defaultValue)}
      title={t.resetTo(format(props.defaultValue))}
      aria-label={t.reset}
      className={`grid h-4 w-4 shrink-0 place-items-center rounded text-slate-400 hover:bg-panel-line hover:text-slate-100 ${
        changed ? '' : 'invisible'
      }`}
    >
      <RotateCcw size={11} />
    </button>
  )
  const slider = (
    <input
      type="range"
      min={props.min}
      max={props.max}
      step={props.step}
      value={props.value}
      // Filled part of the hand-drawn track (see index.css).
      style={{ '--fill': `${((props.value - props.min) / (props.max - props.min || 1)) * 100}%` } as React.CSSProperties}
      onChange={(event) => props.onChange(Number(event.target.value))}
      onDoubleClick={() => props.onChange(props.defaultValue)}
      // Give focus back once released: a focused slider would swallow the
      // arrow keys meant for the selection, and confuse the shortcuts.
      onPointerUp={(event) => event.currentTarget.blur()}
      title={t.sliderReset}
      className={`${props.compact ? 'w-24' : 'w-full'}`}
    />
  )

  if (props.compact) {
    return (
      <div className={`flex items-center gap-2 text-[11px] text-slate-400 ${props.className ?? ''}`}>
        <span>{props.label}</span>
        {slider}
        {/* Slider, value and ↺ stay together; the slot's spare width (one
            more digit) falls after the ↺, so nothing shifts or gapes. */}
        <span className="-ml-1 flex min-w-14 items-center gap-0.5">
          <span className="tabular-nums text-slate-300">{format(props.value)}</span>
          {reset}
        </span>
      </div>
    )
  }
  return (
    <div className={`block ${props.className ?? ''}`}>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs text-slate-400">
        <span>{props.label}</span>
        <span className="tabular-nums text-slate-300">{format(props.value)}</span>
      </div>
      {/* ↺ sits right at the end of the slider, where the hand already is. */}
      <div className="flex items-center gap-1.5">
        <div className="min-w-0 flex-1">{slider}</div>
        {reset}
      </div>
    </div>
  )
}

/** A key a hint refers to: a modifier (named per OS) or a literal key label. */
export type HintKey = 'shift' | 'alt' | 'mod' | 'space' | (string & {})

const MODIFIER_LABELS: Record<string, () => string> = {
  shift: () => KEYS.shift,
  alt: () => KEYS.alt,
  mod: () => KEYS.mod,
  space: () => t.keys.space,
  // Named keys and mouse actions: callers pass the French token (or the id),
  // shown in the session's language.
  Entrée: () => t.keys.enter,
  enter: () => t.keys.enter,
  Échap: () => t.keys.escape,
  escape: () => t.keys.escape,
  glisser: () => t.keys.drag,
  drag: () => t.keys.drag,
  clic: () => t.keys.click,
  click: () => t.keys.click,
  molette: () => t.keys.wheel,
  Suppr: () => KEYS.del,
  wheel: () => t.keys.wheel,
}

/** A keyboard key, drawn like a keycap, with the OS-appropriate name. */
export function Kbd(props: { k: HintKey; active?: boolean }) {
  useKeyLayout()
  const label = props.k.startsWith('code:')
    ? keyLabel(props.k.slice(5))
    : (MODIFIER_LABELS[props.k]?.() ?? props.k)
  return (
    <kbd
      className={`inline-flex h-[18px] items-center rounded border border-b-2 px-1 font-sans text-[10px] font-semibold leading-none transition-colors ${
        props.active
          ? 'border-sky-300 bg-white text-sky-700'
          : 'border-slate-500/60 bg-panel-soft text-slate-200'
      }`}
    >
      {label}
    </kbd>
  )
}

/** One shortcut and its effect; it lights up while its modifier is held. */
export function HintChip(props: {
  keys: HintKey[]
  label: string
  active?: boolean
  title?: string
  /** Alternatives (« a / b ») rather than a combination (« a + b »). */
  either?: boolean
}) {
  return (
    <span
      title={props.title}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full py-0.5 pr-2 pl-0.5 text-[11px] transition-colors ${
        props.active ? 'bg-sky-600 text-white shadow-[0_0_0_2px_rgba(56,189,248,0.35)]' : 'text-slate-400'
      }`}
    >
      {props.keys.map((k, i) => (
        <span key={`${k}-${i}`} className="inline-flex items-center gap-0.5">
          {i > 0 ? <span className="text-[10px] opacity-70">{props.either ? '/' : '+'}</span> : null}
          <Kbd k={k} active={props.active} />
        </span>
      ))}
      <span>{props.label}</span>
    </span>
  )
}

/** "10,5" / "10.5" → 10.5; null while the text is not (yet) a number. */
function parseNumber(text: string): number | null {
  const clean = text.trim().replace(',', '.')
  if (clean === '' || clean === '-' || clean === '.' || clean === '-.') return null
  const value = Number(clean)
  return Number.isFinite(value) ? value : null
}

function formatNumber(value: number, decimals: number): string {
  if (decimals === 0) return String(Math.round(value))
  // No grouping: what is shown must parse back (see parseNumber).
  return formatLocale(Number(value.toFixed(decimals)), { maximumFractionDigits: decimals, useGrouping: false })
}

/**
 * Numeric field that never fights the user. While focused it shows exactly
 * what is typed (clear it, type "1", "12", "120"…) and applies each valid,
 * in-range value live; on blur / Enter the value is clamped and reformatted;
 * Escape restores the value it had on focus. ↑ / ↓, the wheel (when focused)
 * and the ▲▼ buttons step from the real value (Shift: × 10); `nudge` lets the
 * caller guarantee every step changes something (e.g. lengths in cm).
 */
export function NumberField(props: {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  /** Decimal places kept (0: integers). */
  decimals?: number
  /** Custom stepping; when given, it applies the change itself. */
  nudge?: (direction: 1 | -1, big: boolean) => void
  suffix?: string
  disabled?: boolean
  className?: string
  title?: string
  'aria-label'?: string
  id?: string
  /** Called after the field's own handling (e.g. Enter also validates a preview). */
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
}) {
  const { value, min = -Infinity, max = Infinity, step = 1, decimals = 0 } = props
  const [draft, setDraft] = useState<string | null>(null)
  const startValue = useRef(value)
  const inputRef = useRef<HTMLInputElement>(null)

  const round = (n: number) => {
    const f = 10 ** decimals
    return Math.round(n * f) / f
  }
  const clamp = (n: number) => Math.min(max, Math.max(min, n))

  const stepBy = (direction: 1 | -1, big: boolean) => {
    setDraft(null)
    if (props.nudge) {
      props.nudge(direction, big)
      return
    }
    const next = clamp(round(value + direction * step * (big ? 10 : 1)))
    if (next !== value) props.onChange(next)
  }
  // Latest stepper for the wheel listener below.
  const stepRef = useRef(stepBy)
  useLayoutEffect(() => {
    stepRef.current = stepBy
  })

  // Wheel steps the value only while the field is focused (never hijacks scrolling).
  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    const onWheel = (event: WheelEvent) => {
      if (document.activeElement !== input || event.deltaY === 0) return
      event.preventDefault()
      stepRef.current(event.deltaY < 0 ? 1 : -1, event.shiftKey)
    }
    input.addEventListener('wheel', onWheel, { passive: false })
    return () => input.removeEventListener('wheel', onWheel)
  }, [])

  const commit = () => {
    if (draft === null) return
    const parsed = parseNumber(draft)
    if (parsed !== null) {
      const next = clamp(round(parsed))
      if (next !== value) props.onChange(next)
    }
    setDraft(null)
  }

  return (
    <div className={`relative ${props.className ?? ''}`}>
      <input
        ref={inputRef}
        id={props.id}
        type="text"
        inputMode={decimals > 0 || min < 0 ? 'decimal' : 'numeric'}
        autoComplete="off"
        spellCheck={false}
        disabled={props.disabled}
        title={props.title}
        aria-label={props['aria-label']}
        value={draft ?? formatNumber(value, decimals)}
        onFocus={(event) => {
          startValue.current = value
          event.currentTarget.select()
        }}
        onChange={(event) => {
          const text = event.target.value
          setDraft(text)
          const parsed = parseNumber(text)
          if (parsed !== null && parsed >= min && parsed <= max) {
            const next = round(parsed)
            if (next !== value) props.onChange(next)
          }
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            commit()
          } else if (event.key === 'Escape') {
            event.preventDefault()
            event.stopPropagation()
            setDraft(null)
            if (startValue.current !== value) props.onChange(startValue.current)
          } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault()
            stepBy(event.key === 'ArrowUp' ? 1 : -1, event.shiftKey)
          }
          props.onKeyDown?.(event)
        }}
        className={`${CONTROL} tabular-nums ${props.suffix ? 'pr-12' : 'pr-6'}`}
      />
      {props.suffix ? (
        <span className="pointer-events-none absolute top-1/2 right-6 -translate-y-1/2 text-[11px] text-slate-500">
          {props.suffix}
        </span>
      ) : null}
      <span className="absolute inset-y-0.5 right-0.5 flex w-4 flex-col">
        {([1, -1] as const).map((direction) => (
          <button
            key={direction}
            type="button"
            tabIndex={-1}
            disabled={props.disabled}
            aria-label={direction === 1 ? t.increase : t.decrease}
            // Keep focus (and any draft) in the field.
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => stepBy(direction, event.shiftKey)}
            className="flex flex-1 items-center justify-center rounded-sm text-[8px] leading-none text-slate-500 hover:bg-panel-line hover:text-slate-200 disabled:opacity-40"
          >
            {direction === 1 ? '▲' : '▼'}
          </button>
        ))}
      </span>
    </div>
  )
}
