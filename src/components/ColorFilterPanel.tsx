import { Filter } from 'lucide-react'
import { dmcByCode, readableInk } from '../lib/dmc'
import { Button, Panel, SegmentedControl, ScrollArea } from './ui'
import type { FilterMode, Thread } from '../lib/types'
import { t } from './ColorFilterPanel.i18n'

export type ColorFilterPanelProps = {
  palette: Thread[]
  counts: number[]
  mode: FilterMode
  onModeChange: (mode: FilterMode) => void
  active: Set<number>
  onActiveChange: (active: Set<number>) => void
}

/** Isolates one or more threads on the grid, to stitch one colour at a time. */
export function ColorFilterPanel(props: ColorFilterPanelProps) {
  const toggle = (index: number) => {
    const next = new Set(props.active)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    props.onActiveChange(next)
  }

  const only = (index: number) => props.onActiveChange(new Set([index]))

  return (
    <Panel title={t.title} storageKey="filter" icon={<Filter size={14} />}>
      <div className="space-y-2.5">
        <SegmentedControl<FilterMode>
          value={props.mode}
          onChange={props.onModeChange}
          options={[
            { value: 'off', label: t.off },
            { value: 'isolate', label: t.isolate },
            { value: 'dim', label: t.dim },
          ]}
        />

        {props.mode !== 'off' ? (
          <>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => props.onActiveChange(new Set(props.palette.map((_, i) => i)))}
              >
                {t.checkAll}
              </Button>
              <Button size="sm" className="flex-1" onClick={() => props.onActiveChange(new Set())}>
                {t.uncheckAll}
              </Button>
            </div>

            {props.palette.length === 0 ? (
              <p className="text-[11px] text-slate-500">{t.noThreads}</p>
            ) : (
              <ScrollArea maxHeight="30vh">
              <ul className="space-y-0.5">
                {props.palette.map((thread, index) => {
                  const color = dmcByCode(thread.code)
                  return (
                    <li key={`${thread.code}-${index}`} className="flex items-center gap-2">
                      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-panel-soft">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5"
                          checked={props.active.has(index)}
                          onChange={() => toggle(index)}
                        />
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-black/30 text-[10px] font-bold"
                          style={{ background: color.hex, color: readableInk(color.hex) }}
                        >
                          {thread.symbol}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[11px] text-slate-300">
                          DMC {color.code}
                        </span>
                        <span className="shrink-0 text-[11px] tabular-nums text-slate-500">
                          {props.counts[index] ?? 0}
                        </span>
                      </label>
                      <Button size="sm" variant="ghost" onClick={() => only(index)} title={t.onlyTitle}>
                        {t.only}
                      </Button>
                    </li>
                  )
                })}
              </ul>
              </ScrollArea>
            )}
          </>
        ) : (
          <p className="text-[11px] text-slate-500">
            {t.help}
          </p>
        )}
      </div>
    </Panel>
  )
}
