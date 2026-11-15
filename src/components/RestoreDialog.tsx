import { useState } from 'react'
import { ArchiveRestore, CheckCircle2 } from 'lucide-react'
import { restoreBackup, type Backup, type RestoreSummary } from '../lib/storage'
import { Button, Modal, ToggleRow } from './ui'
import { LOCALE } from '../i18n'
import { t } from './RestoreDialog.i18n'

/** Restore a full backup: adds what is missing, never overwrites silently. */
export function RestoreDialog(props: {
  backup: Backup
  fileName: string
  openIds: string[]
  onDone: () => void
  onClose: () => void
}) {
  const [replaceOlder, setReplaceOlder] = useState(false)
  const [summary, setSummary] = useState<RestoreSummary | null>(null)
  const motifs = props.backup.projects.filter((p) => (p as { kind?: string }).kind === 'motif').length
  const projects = props.backup.projects.length - motifs
  const folders = Array.isArray(props.backup.folders) ? props.backup.folders.length : 0
  const date = props.backup.createdAt
    ? new Date(props.backup.createdAt).toLocaleString(LOCALE, { dateStyle: 'long', timeStyle: 'short' })
    : t.unknownDate

  return (
    <Modal
      title={t.title}
      onClose={props.onClose}
      footer={
        summary ? (
          <Button variant="primary" onClick={props.onClose}>
            {t.close}
          </Button>
        ) : (
          <>
            <Button onClick={props.onClose}>{t.cancel}</Button>
            <Button
              variant="primary"
              onClick={() => {
                setSummary(restoreBackup(props.backup, { replaceOlder, openIds: props.openIds }))
                props.onDone()
              }}
            >
              <ArchiveRestore size={14} /> {t.restore}
            </Button>
          </>
        )
      }
    >
      {summary ? (
        <div className="space-y-2 text-sm">
          <p className="flex items-center gap-2 font-medium text-emerald-400">
            <CheckCircle2 size={16} /> {t.restored}
          </p>
          <ul className="list-disc space-y-0.5 pl-5 text-xs text-slate-300">
            <li>
              {t.added(summary.projects, summary.motifs, summary.folders)}
            </li>
            {summary.replaced > 0 ? <li>{t.replaced(summary.replaced)}</li> : null}
            {summary.skipped > 0 ? <li>{t.skipped(summary.skipped)}</li> : null}
            {summary.open > 0 ? <li>{t.open(summary.open)}</li> : null}
          </ul>
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          <p className="text-slate-300">
            <b className="text-slate-100">{props.fileName}</b>
            <br />
            <span className="text-xs text-slate-400">
              {t.contents(date, projects, motifs, folders)}
            </span>
          </p>
          <p className="text-xs text-slate-400">
            {t.explain}
          </p>
          <ToggleRow label={t.replaceOlder} checked={replaceOlder} onChange={setReplaceOlder} />
        </div>
      )}
    </Modal>
  )
}
