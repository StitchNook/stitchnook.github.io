import { AlertTriangle, Minus, Plus } from 'lucide-react'
import {
  MAX_SHEETS,
  MIN_READABLE_CELL_MM,
  layoutSummary,
  type PrintLayout,
  type SheetsChoice,
} from '../lib/printLayout'
import { Button } from './ui'
import { t } from './SheetsControl.i18n'

/**
 * How many A4 sheets the chart is printed on. Shared by the editor toolbar
 * and the print view, which both drive the same setting.
 */
export function SheetsControl(props: {
  choice: SheetsChoice
  onChange: (choice: SheetsChoice) => void
  layout: PrintLayout
  /** One line, for the editor toolbar. */
  compact?: boolean
}) {
  const { choice, onChange, layout, compact } = props
  // A manual choice can exceed the pages actually used (5 sheets → 2×2),
  // so −/+ step from the choice itself, never from the resulting layout.
  const sheets = choice === 'auto' ? layout.pagesX * layout.pagesY : choice
  const set = (value: number) => onChange(Math.min(MAX_SHEETS, Math.max(1, value)))
  const tooSmall = layout.cell < MIN_READABLE_CELL_MM

  const summary = layoutSummary(layout)
  const warning = t.tooSmall

  if (compact) {
    // Toolbar: one line; the summary gives way to a tooltip when space runs out.
    return (
      // Siblings in the toolbar's row, so only the summary gives way.
      <>
        <div className="flex shrink-0 items-center gap-1" title={tooSmall ? `${summary} — ${warning}` : summary}>
          <Button size="sm" onClick={() => set(sheets - 1)} disabled={sheets <= 1} title={t.fewer}>
            <Minus size={14} />
          </Button>
          <span className="w-6 text-center text-sm font-semibold text-slate-100 tabular-nums">{sheets}</span>
          <Button size="sm" onClick={() => set(sheets + 1)} disabled={sheets >= MAX_SHEETS} title={t.more}>
            <Plus size={14} />
          </Button>
          <Button
            size="sm"
            variant={choice === 'auto' ? 'primary' : 'default'}
            onClick={() => onChange('auto')}
            title={t.autoTitle}
          >
            {t.auto}
          </Button>
        </div>
        {tooSmall ? (
          <span title={warning} className="shrink-0">
            <AlertTriangle size={14} className="text-amber-400" aria-label={warning} />
          </span>
        ) : null}
        <span className="min-w-0 truncate text-[11px] text-slate-400 @max-[60rem]:hidden" title={summary}>
          {summary}
        </span>
      </>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        <Button size="sm" onClick={() => set(sheets - 1)} disabled={sheets <= 1} title={t.fewer}>
          <Minus size={14} />
        </Button>
        <span className="w-7 text-center text-sm font-semibold text-slate-100 tabular-nums">{sheets}</span>
        <Button size="sm" onClick={() => set(sheets + 1)} disabled={sheets >= MAX_SHEETS} title={t.more}>
          <Plus size={14} />
        </Button>
        <Button
          size="sm"
          variant={choice === 'auto' ? 'primary' : 'default'}
          onClick={() => onChange('auto')}
          title={t.autoTitle}
        >
          {t.auto}
        </Button>
      </div>
      <span className="block text-[11px] text-slate-300">{summary}</span>
      {tooSmall ? <span className="block text-[11px] font-medium text-amber-400">{warning}</span> : null}
    </div>
  )
}
