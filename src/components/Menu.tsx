import { useEffect, useRef, useState, type ReactNode } from 'react'

export type MenuItem =
  | {
      label: string
      icon?: ReactNode
      onSelect: () => void
      danger?: boolean
      disabled?: boolean
      /** Tooltip, e.g. why the item is disabled. */
      title?: string
      /** Shortcut shown on the right, e.g. "⌘S". */
      hint?: string
    }
  | 'separator'
  /** Small section title, not clickable. */
  | { heading: string }

/**
 * A button that drops down a small list of actions. The list is
 * fixed-positioned, so scrolling containers (tab strip, modal body) never
 * clip it; it closes on an outside click, on Escape, or after a choice.
 */
export function Menu(props: {
  /** Renders the trigger; `toggle` must be wired to its click. */
  trigger: (toggle: (event: React.MouseEvent<HTMLElement>) => void, open: boolean) => ReactNode
  items: MenuItem[]
  /** Align the list's right edge with the trigger (for menus at a row's end). */
  alignRight?: boolean
  width?: number
}) {
  const [at, setAt] = useState<{ left: number; top: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const width = props.width ?? 224

  useEffect(() => {
    if (!at) return
    const onDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setAt(null)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        setAt(null)
      }
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [at])

  const toggle = (event: React.MouseEvent<HTMLElement>) => {
    if (at) {
      setAt(null)
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    const left = props.alignRight ? rect.right - width : rect.left
    setAt({ left: Math.max(8, Math.min(left, window.innerWidth - width - 8)), top: rect.bottom + 4 })
  }

  return (
    <div ref={rootRef} className="inline-flex">
      {props.trigger(toggle, at !== null)}
      {at ? (
        <div
          role="menu"
          className="fixed z-[60] rounded-md border border-panel-line bg-panel p-1 shadow-xl"
          style={{ left: at.left, top: at.top, width }}
        >
          {props.items.map((item, i) =>
            item === 'separator' ? (
              <div key={`sep-${i}`} className="my-1 h-px bg-panel-line" />
            ) : 'heading' in item ? (
              <div
                key={`h-${item.heading}`}
                role="presentation"
                className={`px-2 pb-1 text-[10px] font-semibold tracking-[0.12em] text-slate-500 uppercase ${i > 0 ? 'mt-1.5 border-t border-panel-line pt-2' : 'pt-1'}`}
              >
                {item.heading}
              </div>
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                title={item.title}
                disabled={item.disabled}
                onClick={() => {
                  setAt(null)
                  item.onSelect()
                }}
                className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs disabled:cursor-not-allowed disabled:opacity-40 ${
                  item.danger ? 'text-rose-300 hover:bg-rose-500/15' : 'text-slate-200 hover:bg-panel-line'
                }`}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {item.hint ? <span className="text-[10px] text-slate-500">{item.hint}</span> : null}
              </button>
            ),
          )}
        </div>
      ) : null}
    </div>
  )
}

/**
 * Like Menu, but with free content (a small settings panel). `content`
 * receives `close`, for actions that should dismiss it (e.g. "Placer").
 */
export function Popover(props: {
  trigger: (toggle: (event: React.MouseEvent<HTMLElement>) => void, open: boolean) => ReactNode
  content: (close: () => void) => ReactNode
  width?: number
  alignRight?: boolean
}) {
  const [at, setAt] = useState<{ left: number; top: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const width = props.width ?? 300

  useEffect(() => {
    if (!at) return
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) setAt(null)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        setAt(null)
      }
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [at])

  const toggle = (event: React.MouseEvent<HTMLElement>) => {
    if (at) {
      setAt(null)
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    const left = props.alignRight ? rect.right - width : rect.left
    setAt({ left: Math.max(8, Math.min(left, window.innerWidth - width - 8)), top: rect.bottom + 4 })
  }

  return (
    <div ref={rootRef} className="inline-flex">
      {props.trigger(toggle, at !== null)}
      {at ? (
        <div
          ref={panelRef}
          role="dialog"
          className="fixed z-[60] max-h-[75vh] overflow-y-auto rounded-lg border border-panel-line bg-panel shadow-2xl"
          style={{ left: at.left, top: at.top, width }}
        >
          {props.content(() => setAt(null))}
        </div>
      ) : null}
    </div>
  )
}
