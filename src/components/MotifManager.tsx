import { useRef, useState, type DragEvent, type MouseEvent, type ReactNode } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Folder,
  FolderInput,
  FolderPlus,
  ImagePlus,
  LibraryBig,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import {
  ROOT_NAME,
  childFolders,
  createFolder,
  folderPath,
  listFolders,
  moveFolder,
  pathLabel,
  removeFolder,
  renameFolder,
  sameNameFolder,
  subtreeIds,
  type MotifFolder,
} from '../lib/folders'
import type { Project } from '../lib/types'
import { useStoredMotifs, type MotifItem } from '../hooks/useStoredMotifs'
import { FolderPicker } from './FolderPicker'
import { Menu } from './Menu'
import { Thumbnail } from './MotifThumbnail'
import { Button, Modal, TextInput } from './ui'
import { LOCALE } from '../i18n'
import { t } from './MotifManager.i18n'

type Drag = { type: 'motifs'; ids: string[] } | { type: 'folder'; id: string }

export type MotifManagerProps = {
  version: number
  current: Project
  initialFolder: string | null
  onEdit: (motif: Project) => void
  /** Same ways as for a project: blank, from an image, from a PDF chart. */
  onNewMotif: (folderId: string | undefined, source: 'blank' | 'image' | 'pdf') => void
  onImportFile: (file: File, folderId: string | undefined) => void
  onUpdate: (motif: Project, change: Partial<Project>) => void
  /** Deletes the motifs (no confirmation: asked here). */
  onDelete: (motifs: Project[]) => void
  onDuplicate: (motif: Project) => void
  onExport: (motif: Project) => void
  onToProject: (motif: Project) => void
  /** Folders changed: lists elsewhere refresh. */
  onChanged: () => void
  onClose: () => void
}

/** Inline name editor: Enter / blur saves, Escape cancels. */
function InlineName(props: { value: string; onDone: (name: string | null) => void }) {
  const [draft, setDraft] = useState(props.value)
  return (
    <input
      autoFocus
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onFocus={(event) => event.target.select()}
      onClick={(event) => event.stopPropagation()}
      onBlur={() => props.onDone(draft.trim() ? draft : null)}
      onKeyDown={(event) => {
        event.stopPropagation()
        if (event.key === 'Enter') props.onDone(draft.trim() ? draft : null)
        if (event.key === 'Escape') props.onDone(null)
      }}
      className="w-full min-w-0 rounded border border-sky-500 bg-panel-soft px-1 py-0.5 text-xs text-slate-100 outline-none"
    />
  )
}

/**
 * Library manager: folder tree on the left, the chosen folder's content on
 * the right. Folders and motifs are created, renamed, moved (menus or drag and
 * drop onto the tree) and deleted here; the « Motifs » tool only browses and inserts.
 */
export function MotifManager(props: MotifManagerProps) {
  const { items, folders } = useStoredMotifs(props.version, props.current)
  const [openId, setOpenId] = useState<string | null>(props.initialFolder)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [renaming, setRenaming] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [moving, setMoving] = useState<{ ids: string[]; folderId: string | undefined } | null>(null)
  const [deletingFolder, setDeletingFolder] = useState<MotifFolder | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null | undefined>(undefined)
  const drag = useRef<Drag | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  const open = openId && folders.some((f) => f.id === openId) ? openId : null
  const openName = open ? (folders.find((f) => f.id === open)?.name ?? ROOT_NAME) : ROOT_NAME
  const byId = new Map(items.map((item) => [item.entry.id, item]))
  const changed = () => {
    setError(null)
    props.onChanged()
  }

  const countIn = (folderId: string | null) => {
    if (folderId === null) return items.length
    const ids = subtreeIds(folders, folderId)
    return items.filter((item) => item.entry.folderId && ids.has(item.entry.folderId)).length
  }

  /* --------------------------------------------------------------- actions */

  const newFolder = (parentId: string | null) => {
    // Unique default name, then straight into renaming.
    let name = t.newFolder
    for (let n = 2; sameNameFolder(folders, parentId, name); n++) name = t.newFolderN(n)
    const { folder } = createFolder(name, parentId)
    if (parentId) setCollapsed((current) => new Set([...current].filter((id) => id !== parentId)))
    setRenaming(`folder:${folder.id}`)
    changed()
  }

  const finishFolderRename = (folder: MotifFolder, name: string | null) => {
    setRenaming(null)
    if (name === null || name.trim() === folder.name) return
    const problem = renameFolder(folder.id, name)
    if (problem) setError(problem)
    else changed()
  }

  const finishMotifRename = (item: MotifItem, name: string | null) => {
    setRenaming(null)
    if (name === null || name.trim() === item.entry.name) return
    props.onUpdate(item.project, { name: name.trim() })
  }

  const moveMotifs = (ids: string[], folderId: string | undefined) => {
    for (const id of ids) {
      const item = byId.get(id)
      if (item && (item.entry.folderId ?? undefined) !== folderId) props.onUpdate(item.project, { folderId })
    }
    setSelected(new Set())
  }

  const deleteMotifs = (ids: string[]) => {
    const motifs = ids.flatMap((id) => (byId.get(id) ? [byId.get(id)!.project] : []))
    if (motifs.length === 0) return
    if (!window.confirm(t.confirmDelete(motifs.length, motifs[0].name))) return
    props.onDelete(motifs)
    setSelected(new Set())
  }

  const deleteFolder = (folder: MotifFolder, mode: 'up' | 'all') => {
    const ids = subtreeIds(folders, folder.id)
    if (mode === 'up') {
      // Its motifs and sub-folders go up one level.
      for (const item of items) {
        if (item.entry.folderId === folder.id) props.onUpdate(item.project, { folderId: folder.parentId ?? undefined })
      }
      removeFolder(folder.id, false)
    } else {
      const inside = items.filter((item) => item.entry.folderId && ids.has(item.entry.folderId)).map((item) => item.project)
      if (inside.length > 0) props.onDelete(inside)
      removeFolder(folder.id, true)
    }
    if (open && ids.has(open)) setOpenId(folder.parentId)
    setDeletingFolder(null)
    changed()
  }

  const askDeleteFolder = (folder: MotifFolder) => {
    const empty = countIn(folder.id) === 0 && childFolders(folders, folder.id).length === 0
    if (empty) deleteFolder(folder, 'up')
    else setDeletingFolder(folder)
  }

  /* ---------------------------------------------------------- drag & drop */

  const canDrop = (target: string | null) => {
    const d = drag.current
    if (!d) return false
    if (d.type === 'folder') return target === null || !subtreeIds(folders, d.id).has(target)
    return true
  }

  const dropProps = (target: string | null) => ({
    onDragOver: (event: DragEvent) => {
      if (!canDrop(target)) return
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      setDropTarget(target)
    },
    onDragLeave: () => setDropTarget((current) => (current === target ? undefined : current)),
    onDrop: (event: DragEvent) => {
      event.preventDefault()
      setDropTarget(undefined)
      const d = drag.current
      const ok = canDrop(target) // before the drag is cleared: it reads it
      drag.current = null
      if (!d || !ok) return
      if (d.type === 'motifs') moveMotifs(d.ids, target ?? undefined)
      else {
        const problem = moveFolder(d.id, target)
        if (problem) setError(problem)
        else changed()
      }
    },
  })

  const startDrag = (value: Drag) => (event: DragEvent) => {
    drag.current = value
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', value.type)
  }

  /* ------------------------------------------------------------------ tree */

  const treeRow = (folder: MotifFolder | null, depth: number): ReactNode => {
    const id = folder?.id ?? null
    const children = childFolders(folders, id)
    const isCollapsed = id !== null && collapsed.has(id)
    const active = open === id
    const isDrop = dropTarget === id
    return (
      <li key={id ?? 'root'}>
        <div
          {...dropProps(id)}
          draggable={folder !== null && renaming !== `folder:${id}`}
          onDragStart={folder ? startDrag({ type: 'folder', id: folder.id }) : undefined}
          onClick={() => {
            setOpenId(id)
            setSelected(new Set())
          }}
          onDoubleClick={() => folder && setRenaming(`folder:${folder.id}`)}
          className={`group flex cursor-pointer items-center gap-1 rounded px-1.5 py-1 text-xs ${
            isDrop
              ? 'bg-sky-500/25 ring-1 ring-sky-500'
              : active
                ? 'bg-sky-600 text-white'
                : 'text-slate-200 hover:bg-panel-soft'
          }`}
          style={{ paddingLeft: 6 + depth * 14 }}
        >
          {children.length > 0 && id !== null ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setCollapsed((current) => {
                  const next = new Set(current)
                  if (next.has(id)) next.delete(id)
                  else next.add(id)
                  return next
                })
              }}
              aria-label={isCollapsed ? t.expand : t.collapse}
              className="grid h-4 w-4 shrink-0 place-items-center"
            >
              <ChevronRight size={12} className={`transition ${isCollapsed ? '' : 'rotate-90'}`} />
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}
          {folder ? (
            <Folder size={13} className={`shrink-0 ${active ? '' : 'text-amber-300/80'}`} />
          ) : (
            <LibraryBig size={13} className="shrink-0" />
          )}
          {folder && renaming === `folder:${folder.id}` ? (
            <InlineName value={folder.name} onDone={(name) => finishFolderRename(folder, name)} />
          ) : (
            <span className="flex-1 truncate">{folder?.name ?? ROOT_NAME}</span>
          )}
          <span className={`text-[10px] tabular-nums ${active ? 'text-sky-100' : 'text-slate-500'}`}>{countIn(id)}</span>
          {folder ? (
            <span className="opacity-0 group-hover:opacity-100" onClick={(event) => event.stopPropagation()}>
              <Menu
                alignRight
                width={210}
                items={[
                  { label: t.newSubfolder, icon: <FolderPlus size={13} />, onSelect: () => newFolder(folder.id) },
                  { label: t.rename, icon: <Tag size={13} />, onSelect: () => setRenaming(`folder:${folder.id}`) },
                  'separator',
                  { label: t.deleteEllipsis, icon: <Trash2 size={13} />, danger: true, onSelect: () => askDeleteFolder(folder) },
                ]}
                trigger={(toggle) => (
                  <button
                    type="button"
                    onClick={toggle}
                    aria-label={t.folderActions(folder.name)}
                    className="grid h-4 w-4 place-items-center rounded hover:bg-black/20"
                  >
                    <MoreHorizontal size={12} />
                  </button>
                )}
              />
            </span>
          ) : null}
        </div>
        {children.length > 0 && !isCollapsed ? (
          <ul>{children.map((child) => treeRow(child, depth + 1))}</ul>
        ) : null}
      </li>
    )
  }

  /* --------------------------------------------------------------- content */

  const byName = (a: MotifItem, b: MotifItem) => a.entry.name.localeCompare(b.entry.name, LOCALE, { numeric: true })
  const needle = query.trim().toLocaleLowerCase(LOCALE)
  const shown = needle
    ? items
        .filter((item) => `${item.entry.name} ${folderPath(folders, item.entry.folderId).join(' ')}`.toLocaleLowerCase(LOCALE).includes(needle))
        .sort(byName)
    : items.filter((item) => (item.entry.folderId ?? null) === open).sort(byName)
  const subfolders = needle ? [] : childFolders(folders, open)

  const clickMotif = (item: MotifItem) => (event: MouseEvent) => {
    const id = item.entry.id
    setSelected((current) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey) {
        const next = new Set(current)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      }
      return current.size === 1 && current.has(id) ? new Set() : new Set([id])
    })
  }

  const motifTile = (item: MotifItem) => {
    const id = item.entry.id
    const isSelected = selected.has(id)
    const dragIds = isSelected ? [...selected] : [id]
    return (
      <li
        key={id}
        draggable={renaming !== `motif:${id}`}
        onDragStart={startDrag({ type: 'motifs', ids: dragIds })}
        className="group relative"
      >
        <div
          role="button"
          tabIndex={0}
          aria-pressed={isSelected}
          onClick={clickMotif(item)}
          onDoubleClick={() => props.onEdit(item.project)}
          title={t.tileTitle(item.entry.name, item.entry.width, item.entry.height, pathLabel(folderPath(folders, item.entry.folderId)))}
          className={`flex cursor-pointer flex-col items-center gap-1 rounded-md border p-1.5 ${
            isSelected ? 'border-sky-500 bg-sky-500/15' : 'border-panel-line bg-panel-soft/40 hover:border-slate-500'
          }`}
        >
          <span className="grid h-16 w-full place-items-center overflow-hidden rounded-sm bg-[#f7f4ee]">
            <Thumbnail project={item.project} />
          </span>
          {renaming === `motif:${id}` ? (
            <InlineName value={item.entry.name} onDone={(name) => finishMotifRename(item, name)} />
          ) : (
            <span
              className="w-full truncate text-center text-[11px] text-slate-200"
              onDoubleClick={(event) => {
                event.stopPropagation()
                setRenaming(`motif:${id}`)
              }}
            >
              {item.entry.name}
            </span>
          )}
          {needle ? (
            <span className="w-full truncate text-center text-[10px] text-slate-500">
              {pathLabel(folderPath(folders, item.entry.folderId))}
            </span>
          ) : null}
        </div>
        {/* The checkbox adds to / removes from the selection, like ⌘ + clic. */}
        <button
          type="button"
          role="checkbox"
          aria-checked={isSelected}
          aria-label={t.select(item.entry.name)}
          onClick={(event) => {
            event.stopPropagation()
            setSelected((current) => {
              const next = new Set(current)
              if (next.has(id)) next.delete(id)
              else next.add(id)
              return next
            })
          }}
          className={`absolute top-1 left-1 grid h-5 w-5 place-items-center rounded border text-[11px] ${
            isSelected
              ? 'border-sky-400 bg-sky-500 text-white'
              : 'border-slate-400 bg-panel/80 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 hover:border-sky-400'
          }`}
        >
          {isSelected ? '✓' : ''}
        </button>
        <div className="absolute top-1 right-1 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
          <Menu
            alignRight
            width={230}
            items={[
              { label: t.edit, icon: <Pencil size={13} />, onSelect: () => props.onEdit(item.project) },
              { label: t.rename, icon: <Tag size={13} />, onSelect: () => setRenaming(`motif:${id}`) },
              {
                label: t.moveTo,
                icon: <FolderInput size={13} />,
                onSelect: () => setMoving({ ids: [id], folderId: item.entry.folderId }),
              },
              { label: t.duplicate, icon: <Copy size={13} />, onSelect: () => props.onDuplicate(item.project) },
              { label: t.exportJson, icon: <Download size={13} />, onSelect: () => props.onExport(item.project) },
              { label: t.toProject, icon: <FolderInput size={13} />, onSelect: () => props.onToProject(item.project) },
              'separator',
              { label: t.deleteEllipsis, icon: <Trash2 size={13} />, danger: true, onSelect: () => deleteMotifs([id]) },
            ]}
            trigger={(toggle) => (
              <button
                type="button"
                onClick={toggle}
                aria-label={t.motifActions(item.entry.name)}
                className="grid h-5 w-5 place-items-center rounded bg-panel/90 text-slate-300 shadow hover:text-white"
              >
                <MoreHorizontal size={13} />
              </button>
            )}
          />
        </div>
      </li>
    )
  }

  return (
    <Modal xl fill title={t.title} onClose={props.onClose}>
      <div className="flex h-full min-h-0 flex-col gap-3">
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) props.onImportFile(file, open ?? undefined)
          }}
        />
        <div className="flex flex-wrap items-center gap-1.5">
          <Button size="sm" onClick={() => newFolder(open)} title={t.newFolderIn(openName)}>
            <FolderPlus size={13} /> {t.folder}
          </Button>
          <Menu
            width={250}
            items={[
              { heading: t.inFolder(openName) },
              { label: t.blank, icon: <Plus size={13} />, onSelect: () => props.onNewMotif(open ?? undefined, 'blank') },
              {
                label: t.fromImage,
                icon: <ImagePlus size={13} />,
                onSelect: () => props.onNewMotif(open ?? undefined, 'image'),
              },
              {
                label: t.fromPdf,
                icon: <FileText size={13} />,
                title: t.fromPdfTitle,
                onSelect: () => props.onNewMotif(open ?? undefined, 'pdf'),
              },
              {
                label: t.fromJson,
                icon: <Upload size={13} />,
                title: t.fromJsonTitle,
                onSelect: () => importRef.current?.click(),
              },
            ]}
            trigger={(toggle, isOpen) => (
              <Button size="sm" variant={isOpen ? 'primary' : 'default'} onClick={toggle}>
                <Plus size={13} /> {t.motif} <ChevronDown size={12} />
              </Button>
            )}
          />
          <div className="relative ml-auto w-64">
            <Search size={13} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-slate-500" />
            <TextInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.search}
              className="pl-8"
            />
          </div>
        </div>

        {error ? (
          <p className="flex items-center gap-2 rounded-md border border-amber-600/50 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200">
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError(null)} aria-label={t.closeMessage}>
              <X size={13} />
            </button>
          </p>
        ) : null}

        <div className="flex min-h-0 flex-1 gap-3">
          {/* Tree: also a drop target for motifs and folders. */}
          <nav aria-label={t.folders} className="w-60 shrink-0 overflow-y-auto rounded-md border border-panel-line p-1.5">
            <ul>{treeRow(null, 0)}</ul>
            <p className="mt-3 px-1.5 text-[10px] text-slate-500">
              {t.treeHelp}
            </p>
          </nav>

          <section className="flex min-w-0 flex-1 flex-col rounded-md border border-panel-line" {...(needle ? {} : dropProps(open))}>
            <header className="flex flex-wrap items-center gap-2 border-b border-panel-line px-3 py-2 text-xs">
              <span className="font-medium text-slate-200">
                {needle ? t.results(query.trim()) : pathLabel(folderPath(folders, open))}
              </span>
              <span className="text-slate-500">
                {t.motifCount(shown.length)}
              </span>
              {selected.size > 0 ? (
                <span className="ml-auto flex items-center gap-1.5">
                  <span className="text-slate-300">
                    {t.selectedCount(selected.size)}
                  </span>
                  <Button size="sm" onClick={() => setMoving({ ids: [...selected], folderId: open ?? undefined })}>
                    <FolderInput size={13} /> {t.moveTo}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => deleteMotifs([...selected])}>
                    <Trash2 size={13} /> {t.delete}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} title={t.deselectAll}>
                    <X size={13} />
                  </Button>
                </span>
              ) : null}
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-3" onClick={(event) => event.target === event.currentTarget && setSelected(new Set())}>
              {subfolders.length > 0 ? (
                <ul className="mb-3 grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2">
                  {subfolders.map((folder) => (
                    <li
                      key={folder.id}
                      {...dropProps(folder.id)}
                      draggable
                      onDragStart={startDrag({ type: 'folder', id: folder.id })}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setOpenId(folder.id)
                          setSelected(new Set())
                        }}
                        className={`flex w-full items-center gap-2 rounded-md border px-2.5 py-2 text-left text-xs ${
                          dropTarget === folder.id
                            ? 'border-sky-500 bg-sky-500/20'
                            : 'border-panel-line bg-panel-soft/40 text-slate-200 hover:border-slate-500'
                        }`}
                      >
                        <Folder size={15} className="shrink-0 text-amber-300/80" />
                        <span className="flex-1 truncate">{folder.name}</span>
                        <span className="text-[10px] text-slate-500 tabular-nums">{countIn(folder.id)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {shown.length > 0 ? (
                <ul className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-2">{shown.map(motifTile)}</ul>
              ) : subfolders.length === 0 ? (
                <p className="py-10 text-center text-xs text-slate-500">
                  {needle ? t.noMatch : t.emptyFolder}
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </div>

      {moving ? (
        <Modal
          title={moving.ids.length > 1 ? t.moveMany(moving.ids.length) : t.moveOne}
          onClose={() => setMoving(null)}
          footer={
            <>
              <Button onClick={() => setMoving(null)}>{t.cancel}</Button>
              <Button
                variant="primary"
                onClick={() => {
                  moveMotifs(moving.ids, moving.folderId)
                  setMoving(null)
                }}
              >
                {t.move}
              </Button>
            </>
          }
        >
          <span className="mb-1 block text-xs font-medium text-slate-400">{t.toFolder}</span>
          <FolderPicker
            value={moving.folderId}
            onChange={(folderId) => setMoving({ ...moving, folderId })}
            onFoldersChange={changed}
          />
        </Modal>
      ) : null}

      {deletingFolder ? (
        <Modal
          title={t.deleteFolderTitle(deletingFolder.name)}
          onClose={() => setDeletingFolder(null)}
          footer={
            <>
              <Button onClick={() => setDeletingFolder(null)}>{t.cancel}</Button>
              <Button variant="danger" onClick={() => deleteFolder(deletingFolder, 'all')}>
                {t.deleteAll}
              </Button>
              <Button variant="primary" onClick={() => deleteFolder(deletingFolder, 'up')}>
                {t.keepContent}
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate-300">
            {t.folderContains(countIn(deletingFolder.id), childFolders(listFolders(), deletingFolder.id).length)}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            {t.deleteFolderHelp(pathLabel(folderPath(folders, deletingFolder.parentId)))}
          </p>
        </Modal>
      ) : null}
    </Modal>
  )
}
