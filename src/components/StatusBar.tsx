import { formatLength, stitchesToPhysical } from '../lib/units'
import type { SaveState } from '../hooks/useAutosave'
import type { Point, Project } from '../lib/types'
import type { Modifiers } from '../hooks/useModifiers'
import { VIEW_HINTS } from '../lib/help'
import { IS_MAC } from '../lib/platform'
import { HintList } from './HintList'
import { formatNumber } from '../i18n'
import { BACKUP_REMINDER_DAYS } from '../lib/storage'
import { t } from './StatusBar.i18n'

export type StatusBarProps = {
  project: Project
  hover: Point | null
  totalStitches: number
  doneStitches: number
  save: SaveState
  mods: Modifiers
  /** Show the "no recent backup" reminder. */
  backupDue: boolean
  onBackup: () => void
  onSnoozeBackup: () => void
}

export function StatusBar(props: StatusBarProps) {
  const { project, hover } = props
  const unit = project.fabric.displayUnit
  const width = stitchesToPhysical(project.width, project.fabric)
  const height = stitchesToPhysical(project.height, project.fabric)
  const inside =
    hover && hover.x >= 0 && hover.y >= 0 && hover.x < project.width && hover.y < project.height

  return (
    // One line: the least useful facts hide first on narrow windows; the
    // navigation hints and the save state always stay.
    <footer className="no-print @container shrink-0 border-t border-panel-line bg-panel text-[11px] text-slate-400">
      <div className="flex items-center gap-x-4 overflow-hidden px-3 py-1 whitespace-nowrap">
      <span className="w-24 shrink-0 tabular-nums" title={t.cursorTitle}>
        {t.cursor}{' '}
        {inside ? (
          <strong className="text-slate-200">
            {hover.x + 1}, {hover.y + 1}
          </strong>
        ) : (
          '—'
        )}
      </span>
      <span className="shrink-0 tabular-nums" title={t.gridTitle}>
        <strong className="text-slate-200">
          {project.width} × {project.height}
        </strong>{' '}
        {t.stitchUnit}
      </span>
      <span className="shrink-0 tabular-nums @max-[56rem]:hidden" title={t.finishedTitle}>
        <strong className="text-slate-200">
          {formatLength(width, unit)} × {formatLength(height, unit)}
        </strong>
      </span>
      <span className="shrink-0 tabular-nums @max-[72rem]:hidden" title={t.fabricTitle}>
        {project.fabric.count} {t.stitchUnit} / {project.fabric.countUnit === 'cm' ? 'cm' : t.perInch}
      </span>
      <span className="shrink-0 tabular-nums @max-[48rem]:hidden" title={t.stitchesTitle}>
        <strong className="text-slate-200">{formatNumber(props.totalStitches)}</strong> {t.stitches}
        {props.totalStitches > 0 ? ` · ${formatNumber(props.doneStitches)} ${t.stitched}` : ''}
      </span>
      <span className="shrink-0 tabular-nums @max-[64rem]:hidden" title={t.threadsTitle}>
        <strong className="text-slate-200">{project.palette.length}</strong> {t.threads(project.palette.length)}
      </span>
      <span
        className="ml-auto flex shrink-0 items-center gap-1"
        title={IS_MAC ? t.pinch : undefined}
      >
        <HintList hints={VIEW_HINTS} mods={props.mods} />
      </span>
      {props.backupDue ? (
        <span className="flex shrink-0 items-center gap-1.5 text-amber-400" title={t.backupDueTitle}>
          {t.backupDue(BACKUP_REMINDER_DAYS)}
          <button type="button" className="rounded px-1.5 font-semibold underline hover:text-amber-300" onClick={props.onBackup}>
            {t.backupNow}
          </button>
          <button type="button" className="rounded px-1 text-slate-500 hover:text-slate-300" onClick={props.onSnoozeBackup}>
            {t.later}
          </button>
        </span>
      ) : null}
      <span
        className={`shrink-0 ${
          props.save.status === 'error'
            ? 'text-rose-400'
            : props.save.status === 'saved'
              ? 'text-emerald-400'
              : 'text-slate-500'
        }`}
        title={props.save.message}
      >
        {props.save.message ?? t.save[props.save.status]}
      </span>
      </div>
    </footer>
  )
}
