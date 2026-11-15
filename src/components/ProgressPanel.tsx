import { CheckCheck, RefreshCw } from 'lucide-react'
import { dmcByCode, readableInk } from '../lib/dmc'
import { Button, Disclosure, HintChip, Kbd, Panel, ScrollArea, ToggleRow } from './ui'
import type { Thread } from '../lib/types'
import { t } from './ProgressPanel.i18n'

export type ProgressPanelProps = {
  palette: Thread[]
  counts: number[]
  doneCounts: number[]
  showProgress: boolean
  onShowProgressChange: (value: boolean) => void
  onMarkThread: (index: number, done: boolean) => void
  onResetAll: () => void
}

function Bar({ value, total }: { value: number; total: number }) {
  const ratio = total > 0 ? value / total : 0
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-panel-line">
      <div
        className="h-full rounded-full bg-emerald-500 transition-[width]"
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  )
}

/** Tracks which stitches are already embroidered, globally and per thread. */
export function ProgressPanel(props: ProgressPanelProps) {
  const total = props.counts.reduce((sum, value) => sum + value, 0)
  const done = props.doneCounts.reduce((sum, value) => sum + value, 0)
  const percent = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <Panel
      title={t.title}
      storageKey="progress"
      icon={<CheckCheck size={14} />}
      actions={
        <Button size="sm" variant="ghost" title={t.resetAll} onClick={props.onResetAll}>
          <RefreshCw size={13} />
        </Button>
      }
    >
      <div className="space-y-3">
        <ToggleRow
          label={t.showStitched}
          checked={props.showProgress}
          onChange={props.onShowProgressChange}
        />

        <div>
          <div className="mb-1 flex items-baseline justify-between text-xs">
            <span className="font-medium text-slate-300">{t.overall}</span>
            <span className="tabular-nums text-slate-400">
              {done} / {total} ({percent} %)
            </span>
          </div>
          <Bar value={done} total={total} />
        </div>

        {props.palette.length === 0 ? (
          <p className="text-[11px] text-slate-500">{t.noThreads}</p>
        ) : (
          <Disclosure title={t.perColor(props.palette.length)} storageKey="progress-detail">
          <ScrollArea maxHeight="30vh">
          <ul className="space-y-1.5">
            {props.palette.map((thread, index) => {
              const color = dmcByCode(thread.code)
              const count = props.counts[index] ?? 0
              const doneCount = props.doneCounts[index] ?? 0
              const complete = count > 0 && doneCount === count
              return (
                <li key={`${thread.code}-${index}`} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-black/30 text-[10px] font-bold"
                      style={{ background: color.hex, color: readableInk(color.hex) }}
                    >
                      {thread.symbol}
                    </span>
                    <span className="flex-1 truncate text-[11px] text-slate-300">
                      DMC {color.code}
                    </span>
                    <span className="shrink-0 text-[11px] tabular-nums text-slate-500">
                      {doneCount}/{count}
                    </span>
                    <Button
                      size="sm"
                      variant={complete ? 'default' : 'primary'}
                      disabled={count === 0}
                      onClick={() => props.onMarkThread(index, !complete)}
                      title={complete ? t.unmarkColor : t.markColor}
                    >
                      {complete ? t.undo : t.all}
                    </Button>
                  </div>
                  <Bar value={doneCount} total={count} />
                </li>
              )
            })}
          </ul>
          </ScrollArea>
          </Disclosure>
        )}

        <div className="space-y-1">
          <p className="text-[10px] text-slate-500">
            {t.helpBefore}
            <Kbd k="P" />
            {t.helpAfter}
          </p>
          <HintChip keys={['alt']} label={t.altHint} />
        </div>
      </div>
    </Panel>
  )
}
