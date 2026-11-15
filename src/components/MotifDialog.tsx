import { useMemo, useState } from 'react'
import { folderKey, rememberMotifFolder } from '../lib/folders'
import { listMotifs } from '../lib/motifs'
import { Button, Field, Modal, TextInput } from './ui'
import { FolderPicker } from './FolderPicker'
import { t } from './MotifDialog.i18n'

/** Name + folder of a library motif (save a selection, move a project, rename). */
export function MotifDialog(props: {
  title: string
  confirmLabel: string
  initialName: string
  initialFolderId?: string
  /** The motif being renamed, so it does not warn about itself. */
  motifId?: string
  /** Short explanation above the fields. */
  note?: string
  onConfirm: (name: string, folderId: string | undefined) => void
  onFoldersChange?: () => void
  onClose: () => void
}) {
  const [name, setName] = useState(props.initialName)
  const [folderId, setFolderId] = useState(props.initialFolderId)
  const confirm = () => {
    rememberMotifFolder(folderId)
    props.onConfirm(name.trim() || t.untitled, folderId)
  }

  // Same name in the same folder: allowed, but worth a warning.
  const motifs = useMemo(() => listMotifs(), [])
  const duplicate = motifs.some(
    (m) => m.id !== props.motifId && (m.folderId ?? undefined) === folderId && folderKey(m.name) === folderKey(name),
  )

  return (
    <Modal
      title={props.title}
      onClose={props.onClose}
      footer={
        <>
          <Button onClick={props.onClose}>{t.cancel}</Button>
          <Button variant="primary" onClick={confirm}>
            {props.confirmLabel}
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          confirm()
        }}
      >
        {props.note ? <p className="text-xs text-slate-400">{props.note}</p> : null}
        <Field label={t.name}>
          <TextInput autoFocus value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        {duplicate ? (
          <p className="-mt-2 text-[11px] text-amber-300">{t.duplicate}</p>
        ) : null}
        <div>
          <span className="mb-1 block text-xs font-medium text-slate-400">{t.folder}</span>
          <FolderPicker value={folderId} onChange={setFolderId} onFoldersChange={props.onFoldersChange} />
        </div>
        {/* Enter in a field submits. */}
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}
