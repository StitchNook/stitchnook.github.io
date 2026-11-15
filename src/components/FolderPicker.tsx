import { useState } from 'react'
import { ChevronDown, Folder, FolderPlus, LibraryBig } from 'lucide-react'
import {
  ROOT_NAME,
  childFolders,
  createFolder,
  folderPath,
  listFolders,
  pathLabel,
  type MotifFolder,
} from '../lib/folders'
import { Popover } from './Menu'
import { Button, TextInput } from './ui'
import { t } from './FolderPicker.i18n'

/** The folders, flattened in tree order with their depth. */
function flatten(folders: MotifFolder[], parentId: string | null = null, depth = 0): { folder: MotifFolder; depth: number }[] {
  return childFolders(folders, parentId).flatMap((folder) => [
    { folder, depth },
    ...flatten(folders, folder.id, depth + 1),
  ])
}

/**
 * Choose a library folder from the tree (no free text, so no typo can create
 * a second « Fleurs »). A new folder can be made in place, inside the chosen one.
 */
export function FolderPicker(props: {
  value: string | undefined
  onChange: (folderId: string | undefined) => void
  /** Told when a folder was created, so the lists elsewhere refresh. */
  onFoldersChange?: () => void
  /** Folders that cannot be chosen (a folder and its sub-folders, when moving it). */
  disabled?: Set<string>
}) {
  const [folders, setFolders] = useState(listFolders)
  const [naming, setNaming] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const label = pathLabel(folderPath(folders, props.value))
  const target = props.value ?? null
  const targetName = target ? (folders.find((f) => f.id === target)?.name ?? ROOT_NAME) : ROOT_NAME

  const create = () => {
    if (naming === null || !naming.trim()) return
    const { folder, existed } = createFolder(naming, target)
    setFolders(listFolders())
    setNaming(null)
    setNotice(existed ? t.existed(folder.name) : null)
    props.onChange(folder.id)
    if (!existed) props.onFoldersChange?.()
  }

  const row = (id: string | undefined, name: string, depth: number, close: () => void, root = false) => {
    const chosen = id === props.value
    const blocked = id !== undefined && props.disabled?.has(id)
    return (
      <button
        key={id ?? 'root'}
        type="button"
        disabled={blocked}
        onClick={() => {
          props.onChange(id)
          setNotice(null)
          close()
        }}
        className={`flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-xs disabled:opacity-40 ${
          chosen ? 'bg-sky-600 text-white' : 'text-slate-200 hover:bg-panel-soft'
        }`}
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        {root ? <LibraryBig size={13} className="shrink-0" /> : <Folder size={13} className="shrink-0" />}
        <span className="truncate">{name}</span>
      </button>
    )
  }

  return (
    <div className="space-y-1">
      <Popover
        width={300}
        trigger={(toggle, open) => (
          <button
            type="button"
            onClick={(event) => {
              if (!open) setFolders(listFolders())
              toggle(event)
            }}
            className="flex w-full items-center gap-2 rounded-md border border-panel-line bg-panel-soft px-2.5 py-1.5 text-left text-sm text-slate-100 hover:border-slate-500"
          >
            <Folder size={14} className="shrink-0 text-slate-400" />
            <span className="flex-1 truncate">{label}</span>
            <ChevronDown size={14} className="shrink-0 text-slate-400" />
          </button>
        )}
        content={(close) => (
          <div className="p-1.5">
            {row(undefined, ROOT_NAME, 0, close, true)}
            {flatten(folders).map(({ folder, depth }) => row(folder.id, folder.name, depth + 1, close))}
          </div>
        )}
      />
      {naming === null ? (
        <Button size="sm" variant="ghost" onClick={() => setNaming('')} title={t.createIn(targetName)}>
          <FolderPlus size={13} /> {t.newIn(targetName)}
        </Button>
      ) : (
        <div className="flex gap-1.5">
          <TextInput
            autoFocus
            value={naming}
            placeholder={t.namePlaceholder(targetName)}
            onChange={(event) => setNaming(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                event.stopPropagation()
                create()
              }
              if (event.key === 'Escape') {
                event.stopPropagation()
                setNaming(null)
              }
            }}
          />
          <Button size="sm" variant="primary" onClick={create} disabled={!naming.trim()}>
            {t.create}
          </Button>
        </div>
      )}
      {notice ? <p className="text-[11px] text-amber-300">{notice}</p> : null}
    </div>
  )
}
