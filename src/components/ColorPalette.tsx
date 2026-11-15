import { Palette, Plus, Replace, Trash2 } from 'lucide-react'
import { dmcByCode, readableInk } from '../lib/dmc'
import { SYMBOL_POOL } from '../lib/symbols'
import { useEffect, useRef } from 'react'
import { Button, Panel, ScrollArea } from './ui'
import type { Thread } from '../lib/types'
import { t } from './ColorPalette.i18n'

export type ColorPaletteProps = {
  palette: Thread[]
  counts: number[]
  activeThread: number
  onSelect: (index: number) => void
  onRemove: (index: number) => void
  onReplace: (index: number) => void
  onSymbolChange: (index: number, symbol: string) => void
  onOpenCatalog: () => void
}

export function ColorPalette(props: ColorPaletteProps) {
  const { palette, counts, activeThread } = props
  const used = new Set(palette.map((thread) => thread.symbol))

  // Bring the active thread into view when it changes (click, pipette, keys).
  const listRef = useRef<HTMLUListElement>(null)
  useEffect(() => {
    listRef.current?.querySelector('[data-active]')?.scrollIntoView({ block: 'nearest' })
  }, [activeThread])

  return (
    <Panel
      title={t.title}
      storageKey="palette"
      icon={<Palette size={14} />}
      actions={
        <Button size="sm" variant="primary" onClick={props.onOpenCatalog}>
          <Plus size={13} /> DMC
        </Button>
      }
    >
      {palette.length === 0 ? (
        <p className="rounded-md border border-dashed border-panel-line px-3 py-4 text-center text-xs text-slate-500">
          {t.empty}
        </p>
      ) : (
        <ScrollArea maxHeight="40vh">
        <ul ref={listRef} className="space-y-1">
          {palette.map((thread, index) => {
            const color = dmcByCode(thread.code)
            const isActive = index === activeThread
            return (
              <li key={`${thread.code}-${index}`} data-active={isActive || undefined}>
                <div
                  className={`flex items-center gap-2 rounded-md border px-1.5 py-1.5 transition ${
                    isActive
                      ? 'border-sky-500 bg-sky-500/10'
                      : 'border-transparent hover:border-panel-line hover:bg-panel-soft'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => props.onSelect(index)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    title={`${color.code} — ${color.name}`}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-black/30 text-xs font-bold"
                      style={{ background: color.hex, color: readableInk(color.hex) }}
                    >
                      {thread.symbol}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold text-slate-100">
                        DMC {color.code}
                      </span>
                      <span className="block truncate text-[11px] text-slate-400">{color.name}</span>
                    </span>
                    <span className="shrink-0 text-[11px] tabular-nums text-slate-500">
                      {counts[index] ?? 0}
                    </span>
                  </button>

                  <select
                    value={thread.symbol}
                    onChange={(event) => props.onSymbolChange(index, event.target.value)}
                    title={t.symbolTitle}
                    className="w-11 rounded border border-panel-line bg-panel-soft px-1 py-1 text-center text-xs text-slate-200 outline-none focus:border-sky-500"
                  >
                    {!SYMBOL_POOL.includes(thread.symbol) ? (
                      <option value={thread.symbol}>{thread.symbol}</option>
                    ) : null}
                    {SYMBOL_POOL.map((symbol) => (
                      <option
                        key={symbol}
                        value={symbol}
                        disabled={symbol !== thread.symbol && used.has(symbol)}
                      >
                        {symbol}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    title={t.replaceTitle}
                    onClick={() => props.onReplace(index)}
                    className="shrink-0 rounded p-1 text-slate-500 transition hover:bg-sky-500/15 hover:text-sky-300"
                  >
                    <Replace size={14} />
                  </button>

                  <button
                    type="button"
                    title={
                      counts[index]
                        ? t.removeWithStitches(counts[index])
                        : t.remove
                    }
                    onClick={() => props.onRemove(index)}
                    className="shrink-0 rounded p-1 text-slate-500 transition hover:bg-rose-500/15 hover:text-rose-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
        </ScrollArea>
      )}
    </Panel>
  )
}
