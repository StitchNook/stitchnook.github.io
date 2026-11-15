import { useState } from 'react'
import { ChevronRight, Folder, FolderCog, LibraryBig, MoreHorizontal, Pencil, Search, SquareDashed } from 'lucide-react'
import { ROOT_NAME, childFolders, folderPath, pathLabel, subtreeIds, type MotifFolder } from '../lib/folders'
import type { Project } from '../lib/types'
import { useStoredMotifs, type MotifItem } from '../hooks/useStoredMotifs'
import { Thumbnail } from './MotifThumbnail'
import { Menu } from './Menu'
import { Button, Panel, SegmentedControl, TextInput } from './ui'
import { LOCALE } from '../i18n'
import { t } from './MotifLibrary.i18n'

export type MotifColorMode = 'original' | 'active'

const OPEN_FOLDER_KEY = 'stitchly.motifTool.folder'

function readOpenFolder(): string | null {
  try {
    return localStorage.getItem(OPEN_FOLDER_KEY) || null
  } catch {
    return null
  }
}

export type MotifLibraryProps = {
  /** Bumped by the app whenever motifs or folders change. */
  version: number
  current: Project
  colorMode: MotifColorMode
  onColorModeChange: (mode: MotifColorMode) => void
  hasActiveThread: boolean
  canSaveSelection: boolean
  onInsert: (motif: Project) => void
  onEdit: (motif: Project) => void
  onSaveSelection: () => void
  /** Open the library manager, on this folder. */
  onManage: (folderId: string | null) => void
}

/**
 * The « Motifs » tool: browse the folders like a file explorer, or search the
 * whole library, and click a motif to insert it. Managing (folders, moves,
 * deletion) happens in the library manager.
 */
export function MotifLibrary(props: MotifLibraryProps) {
  const [query, setQuery] = useState('')
  const [openId, setOpenIdState] = useState<string | null>(readOpenFolder)
  const { items, folders } = useStoredMotifs(props.version, props.current)

  // A folder deleted meanwhile falls back to the root.
  const open = openId && folders.some((f) => f.id === openId) ? openId : null
  const setOpen = (id: string | null) => {
    setOpenIdState(id)
    try {
      if (id) localStorage.setItem(OPEN_FOLDER_KEY, id)
      else localStorage.removeItem(OPEN_FOLDER_KEY)
    } catch {
      /* Not remembered: harmless. */
    }
  }

  const byName = (a: MotifItem, b: MotifItem) => a.entry.name.localeCompare(b.entry.name, LOCALE, { numeric: true })
  const needle = query.trim().toLocaleLowerCase(LOCALE)
  const found = needle
    ? items
        .filter((item) => `${item.entry.name} ${folderPath(folders, item.entry.folderId).join(' ')}`.toLocaleLowerCase(LOCALE).includes(needle))
        .sort(byName)
    : null
  const here = items.filter((item) => (item.entry.folderId ?? null) === open).sort(byName)
  const subfolders = childFolders(folders, open)
  const countIn = (folder: MotifFolder) => {
    const ids = subtreeIds(folders, folder.id)
    return items.filter((item) => item.entry.folderId && ids.has(item.entry.folderId)).length
  }

  // Breadcrumb: root, then each folder down to the open one.
  const crumbs: { id: string | null; name: string }[] = [{ id: null, name: ROOT_NAME }]
  {
    const chain: MotifFolder[] = []
    let cursor = open ? folders.find((f) => f.id === open) : undefined
    for (let guard = 0; cursor && guard < 64; guard++) {
      chain.unshift(cursor)
      cursor = cursor.parentId ? folders.find((f) => f.id === cursor?.parentId) : undefined
    }
    crumbs.push(...chain.map((f) => ({ id: f.id, name: f.name })))
  }

  const tile = (item: MotifItem) => (
    <li key={item.entry.id} className="group relative">
      <button
        type="button"
        onClick={() => props.onInsert(item.project)}
        title={t.tileTitle(item.entry.name, item.entry.width, item.entry.height, pathLabel(folderPath(folders, item.entry.folderId)))}
        className="flex w-full flex-col items-center gap-1 rounded-md border border-panel-line bg-panel-soft/40 p-1.5 hover:border-sky-500"
      >
        <span className="grid h-14 w-full place-items-center overflow-hidden rounded-sm bg-[#f7f4ee]">
          <Thumbnail project={item.project} />
        </span>
        <span className="w-full truncate text-center text-[10px] text-slate-300">{item.entry.name}</span>
      </button>
      <div className="absolute top-0.5 right-0.5 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
        <Menu
          alignRight
          width={230}
          items={[
            { label: t.edit, icon: <Pencil size={13} />, onSelect: () => props.onEdit(item.project) },
            {
              label: t.showInManager,
              icon: <FolderCog size={13} />,
              onSelect: () => props.onManage(item.entry.folderId ?? null),
            },
          ]}
          trigger={(toggle) => (
            <button
              type="button"
              onClick={toggle}
              title={t.moreActions}
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

  return (
    <Panel title={t.title}>
      <div className="space-y-3">
        <div className="relative">
          <Search size={13} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-slate-500" />
          <TextInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.search}
            className="pl-8"
          />
        </div>

        <div className="space-y-1">
          <SegmentedControl<MotifColorMode>
            value={props.colorMode}
            onChange={(mode) => (mode === 'active' && !props.hasActiveThread ? undefined : props.onColorModeChange(mode))}
            options={[
              { value: 'original', label: t.original, title: t.originalTitle },
              {
                value: 'active',
                label: t.active,
                title: props.hasActiveThread ? t.activeTitle : t.pickThreadFirst,
              },
            ]}
          />
        </div>

        {items.length === 0 && folders.length === 0 ? (
          <p className="rounded-md border border-dashed border-panel-line px-3 py-4 text-center text-[11px] text-slate-400">
            {t.empty}
          </p>
        ) : found ? (
          found.length === 0 ? (
            <p className="py-3 text-center text-[11px] text-slate-500">{t.noMatch}</p>
          ) : (
            <>
              <p className="text-[11px] text-slate-500">
                {t.foundCount(found.length)}
              </p>
              <ul className="grid grid-cols-3 gap-1.5">{found.map(tile)}</ul>
            </>
          )
        ) : (
          <>
            <nav aria-label={t.openFolderNav} className="flex flex-wrap items-center gap-0.5 text-[11px]">
              {crumbs.map((crumb, i) => (
                <span key={crumb.id ?? 'root'} className="flex items-center gap-0.5">
                  {i > 0 ? <ChevronRight size={11} className="text-slate-600" /> : null}
                  <button
                    type="button"
                    onClick={() => setOpen(crumb.id)}
                    disabled={i === crumbs.length - 1}
                    className="flex items-center gap-1 rounded px-1 py-0.5 text-slate-400 hover:bg-panel-soft hover:text-slate-200 disabled:font-semibold disabled:text-slate-200 disabled:hover:bg-transparent"
                  >
                    {i === 0 ? <LibraryBig size={11} /> : null}
                    {crumb.name}
                  </button>
                </span>
              ))}
            </nav>
            {subfolders.length > 0 ? (
              <ul className="grid grid-cols-2 gap-1.5">
                {subfolders.map((folder) => (
                  <li key={folder.id}>
                    <button
                      type="button"
                      onClick={() => setOpen(folder.id)}
                      title={t.openFolder(folder.name)}
                      className="flex w-full items-center gap-1.5 rounded-md border border-panel-line bg-panel-soft/40 px-2 py-1.5 text-left text-xs text-slate-200 hover:border-sky-500"
                    >
                      <Folder size={14} className="shrink-0 text-amber-300/80" />
                      <span className="flex-1 truncate">{folder.name}</span>
                      <span className="text-[10px] text-slate-500 tabular-nums">{countIn(folder)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {here.length > 0 ? (
              <ul className="grid grid-cols-3 gap-1.5">{here.map(tile)}</ul>
            ) : subfolders.length === 0 ? (
              <p className="py-2 text-center text-[11px] text-slate-500">{t.emptyFolder}</p>
            ) : null}
          </>
        )}

        <div className="space-y-1.5 border-t border-panel-line pt-3">
          <Button
            size="sm"
            className="w-full"
            onClick={props.onSaveSelection}
            disabled={!props.canSaveSelection}
            title={props.canSaveSelection ? undefined : t.selectFirst}
          >
            <SquareDashed size={13} /> {t.saveSelection}
          </Button>
          <Button size="sm" className="w-full" onClick={() => props.onManage(open)}>
            <FolderCog size={13} /> {t.manage}
          </Button>
        </div>
      </div>
    </Panel>
  )
}
