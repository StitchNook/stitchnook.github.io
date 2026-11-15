import { useRef, useState } from 'react'
import {
  ChevronDown,
  Copy,
  Download,
  FileText,
  FolderOpen,
  LibraryBig,
  MoreHorizontal,
  PanelTop,
  Replace,
  SquarePlus,
  Trash2,
} from 'lucide-react'
import {
  deleteProject,
  exportProjectFile,
  importProjectFile,
  isMotif,
  listProjects,
  loadProject,
  newProjectId,
} from '../lib/storage'
import type { ProjectMeta } from '../lib/storage'
import { Menu } from './Menu'
import { Button, Modal } from './ui'
import type { Project } from '../lib/types'
import { LOCALE } from '../i18n'
import { t } from './ProjectManager.i18n'

/** "11/11/2026 17:15", without seconds. */
function formatDate(time: number): string {
  return new Date(time).toLocaleString(LOCALE, { dateStyle: 'short', timeStyle: 'short' })
}

/** A fresh copy of a project, under a new id. */
function asCopy(project: Project): Project {
  const now = Date.now()
  return { ...project, id: newProjectId(), name: t.copyName(project.name), createdAt: now, updatedAt: now }
}

export type ProjectManagerProps = {
  current: Project
  /** Projects currently open in a tab. */
  openIds: string[]
  /** Open in place of the current tab (which is saved first). */
  onOpen: (project: Project) => void
  onOpenTab: (project: Project) => void
  /** Jump to the tab that already shows this project. */
  onSwitch: (id: string) => void
  /** Drop the model into the current project as a preview. */
  onInsert: (project: Project) => void
  /** Turn the project into a motif of the library (asks for a name and category). */
  onToLibrary: (project: Project) => void
  onCloseTab: (id: string) => void
  /** A chart PDF from another app: read and reviewed before opening. */
  /** Open the « Créer » window on a source (exported .json, PDF chart). */
  onCreateFrom: (source: 'json' | 'pdf') => void
  onClose: () => void
}

/**
 * Local project library. Two verbs only: « Ouvrir » shows a project in a tab,
 * « Intégrer » copies its motif into the displayed model. Rarer actions
 * (duplicate, export, delete) live in each row's ⋯ menu.
 */
export function ProjectManager(props: ProjectManagerProps) {
  // Library motifs live in the « Motifs » tool, not here.
  const projectsOnly = () => listProjects().filter((entry) => !isMotif(entry))
  const [entries, setEntries] = useState<ProjectMeta[]>(projectsOnly)
  const [error, setError] = useState<string | null>(null)
  const insertFileRef = useRef<HTMLInputElement>(null)

  const refresh = () => setEntries(projectsOnly())

  const read = (id: string): Project | null => {
    // The current project is newer in memory than in storage.
    if (id === props.current.id) return props.current
    const project = loadProject(id)
    if (!project) {
      setError(t.notFound)
      refresh()
    }
    return project
  }

  const withProject = (id: string, action: (project: Project) => void) => () => {
    const project = read(id)
    if (project) action(project)
  }

  const duplicate = (project: Project) => props.onOpenTab(asCopy(project))

  const lastTab = props.openIds.length <= 1
  const remove = (entry: ProjectMeta) => {
    if (!window.confirm(t.confirmDelete(entry.name))) return
    // An open project leaves its tab first, so it is not saved straight back.
    if (props.openIds.includes(entry.id)) props.onCloseTab(entry.id)
    deleteProject(entry.id)
    refresh()
  }

  const insertFile = async (file: File) => {
    setError(null)
    try {
      props.onInsert(await importProjectFile(file))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.importFailed)
    }
  }

  const intoCurrent = t.intoCurrent(props.current.name)

  return (
    <Modal
      wide
      title={t.title}
      onClose={props.onClose}
      footer={
        <>
          <input
            ref={insertFileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (file) void insertFile(file)
            }}
          />
          <div className="mr-auto flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-500">{t.fromFile}</span>
            <Button
              size="sm"
              onClick={() => props.onCreateFrom('json')}
              title={t.openJsonTitle}
            >
              <FolderOpen size={13} /> {t.openJson}
            </Button>
            <Button
              size="sm"
              onClick={() => props.onCreateFrom('pdf')}
              title={t.pdfTitle}
            >
              <FileText size={13} /> {t.pdf}
            </Button>
            <Button size="sm" onClick={() => insertFileRef.current?.click()} title={intoCurrent}>
              <SquarePlus size={13} /> {t.insert}
            </Button>
          </div>
          <Button size="sm" onClick={props.onClose}>
            {t.close}
          </Button>
        </>
      }
    >
      <p className="mb-3 text-[11px] text-slate-400">
        {t.help(props.current.name)}
      </p>

      {error ? (
        <p className="mb-3 rounded-md border border-rose-700/60 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {error}
        </p>
      ) : null}

      {entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          {t.empty}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {entries.map((entry) => {
            const isCurrent = entry.id === props.current.id
            const isOpen = props.openIds.includes(entry.id)
            return (
              <li
                key={entry.id}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                  isCurrent ? 'border-sky-600 bg-sky-500/10' : 'border-panel-line bg-panel-soft/40'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium text-slate-100">
                    <span className="truncate">{entry.name}</span>
                    {isCurrent ? (
                      <span className="shrink-0 rounded bg-sky-600/30 px-1.5 py-0.5 text-[10px] font-normal text-sky-200">
                        {t.shown}
                      </span>
                    ) : isOpen ? (
                      <span className="shrink-0 rounded bg-slate-600/40 px-1.5 py-0.5 text-[10px] font-normal text-slate-300">
                        {t.openTab}
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {t.details(entry.width, entry.height, formatDate(entry.updatedAt))}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {isCurrent ? null : isOpen ? (
                    <Button size="sm" onClick={() => props.onSwitch(entry.id)} title={t.goToTab}>
                      <PanelTop size={13} /> {t.show}
                    </Button>
                  ) : (
                    // Split button: new tab by default, ▾ to replace the current tab.
                    <div className="inline-flex">
                      <Button
                        size="sm"
                        variant="primary"
                        className="rounded-r-none"
                        onClick={withProject(entry.id, props.onOpenTab)}
                        title={t.openNewTab}
                      >
                        <FolderOpen size={13} /> {t.open}
                      </Button>
                      <Menu
                        alignRight
                        width={260}
                        items={[
                          {
                            label: t.openNewTab,
                            icon: <PanelTop size={13} />,
                            onSelect: withProject(entry.id, props.onOpenTab),
                          },
                          {
                            label: t.replaceTab,
                            icon: <Replace size={13} />,
                            title: t.replaceTabTitle(props.current.name),
                            onSelect: withProject(entry.id, props.onOpen),
                          },
                        ]}
                        trigger={(toggle) => (
                          <Button
                            size="sm"
                            variant="primary"
                            className="rounded-l-none border-l-sky-800 px-1"
                            onClick={toggle}
                            title={t.otherWays}
                            aria-label={t.otherWays}
                          >
                            <ChevronDown size={13} />
                          </Button>
                        )}
                      />
                    </div>
                  )}
                  <Button size="sm" onClick={withProject(entry.id, props.onInsert)} title={intoCurrent}>
                    <SquarePlus size={13} /> {t.insert}
                  </Button>
                  <Menu
                    alignRight
                    width={220}
                    items={[
                      {
                        label: t.duplicate,
                        icon: <Copy size={13} />,
                        onSelect: withProject(entry.id, duplicate),
                      },
                      {
                        label: t.exportJson,
                        icon: <Download size={13} />,
                        onSelect: withProject(entry.id, exportProjectFile),
                      },
                      {
                        label: t.toLibrary,
                        icon: <LibraryBig size={13} />,
                        title: t.toLibraryTitle,
                        onSelect: withProject(entry.id, props.onToLibrary),
                      },
                      'separator',
                      {
                        label: t.delete,
                        icon: <Trash2 size={13} />,
                        danger: true,
                        disabled: lastTab && isOpen,
                        title: lastTab && isOpen ? t.onlyTab : undefined,
                        onSelect: () => remove(entry),
                      },
                    ]}
                    trigger={(toggle) => (
                      <Button size="sm" variant="ghost" onClick={toggle} title={t.more} aria-label={t.more}>
                        <MoreHorizontal size={15} />
                      </Button>
                    )}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}
