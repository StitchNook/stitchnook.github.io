import type { ProjectKind } from '../lib/types'
import { FolderPicker } from './FolderPicker'
import { SegmentedControl } from './ui'
import { t } from './KindFields.i18n'

/**
 * « Projet » or « Motif de bibliothèque », and for a motif its folder. Shared
 * by every way of creating something (blank, from an image, from a PDF chart).
 */
export function KindFields(props: {
  kind: ProjectKind
  onKindChange: (kind: ProjectKind) => void
  folderId: string | undefined
  onFolderChange: (folderId: string | undefined) => void
  onFoldersChange?: () => void
  /** No explanation line (the « Créer » header, where height is precious). */
  compact?: boolean
}) {
  const motif = props.kind === 'motif'
  return (
    <div className="space-y-2">
      <div>
      <span className="mb-1 block text-xs font-medium text-slate-400">{t.type}</span>
      <SegmentedControl<ProjectKind>
        value={props.kind}
        onChange={props.onKindChange}
        options={[
          { value: 'project', label: t.project, title: t.projectTitle },
          {
            value: 'motif',
            label: t.motif,
            title: t.motifTitle,
          },
        ]}
      />
      </div>
      <p className={`text-[11px] text-slate-500 ${props.compact ? 'hidden' : ''}`}>
        {motif
          ? t.motifHelp
          : t.projectHelp}
      </p>
      {motif ? (
        <div>
          <span className="mb-1 block text-xs font-medium text-slate-400">{t.folder}</span>
          <FolderPicker value={props.folderId} onChange={props.onFolderChange} onFoldersChange={props.onFoldersChange} />
        </div>
      ) : null}
    </div>
  )
}
