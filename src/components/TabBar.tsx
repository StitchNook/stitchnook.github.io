import { FilePlus, FileText, FolderOpen, ImagePlus, LibraryBig, Plus, X } from 'lucide-react'
import type { Tab } from '../hooks/useTabs'
import { Menu } from './Menu'
import { t } from './TabBar.i18n'

export type TabBarProps = {
  tabs: Tab[]
  activeId: string
  /** The active project has edits waiting for the autosave. */
  saving: boolean
  onSelect: (id: string) => void
  onClose: (id: string) => void
  /** Opens the « Créer » window on this source. */
  onCreate: (source: 'blank' | 'image' | 'pdf') => void
  onOpen: () => void
}

/** Open projects, IDE style: click to switch, ✕ or middle-click to close. */
export function TabBar(props: TabBarProps) {
  const closable = props.tabs.length > 1
  return (
    <div className="no-print flex items-end gap-0.5 overflow-x-auto border-b border-panel-line bg-chrome px-2 pt-1.5">
      {props.tabs.map((tab) => {
        const active = tab.id === props.activeId
        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={active}
            title={tab.motif ? t.motifTab(tab.name) : tab.name}
            onClick={() => props.onSelect(tab.id)}
            onAuxClick={(event) => {
              if (event.button === 1 && closable) props.onClose(tab.id)
            }}
            className={`group flex max-w-52 min-w-24 cursor-pointer items-center gap-1.5 rounded-t-md border border-b-0 px-2.5 py-1.5 text-xs ${
              active
                ? 'border-panel-line bg-panel text-slate-100'
                : 'border-transparent text-slate-400 hover:bg-panel/50 hover:text-slate-200'
            }`}
          >
            {tab.motif ? <LibraryBig size={12} className="shrink-0 text-violet-400" aria-label={t.motif} /> : null}
            <span className="flex-1 truncate">{tab.name || t.untitled}</span>
            {tab.motif ? (
              <span className="shrink-0 rounded bg-violet-500/20 px-1 text-[9px] font-medium tracking-wide text-violet-300 uppercase">
                {t.motif}
              </span>
            ) : null}
            {active && props.saving ? (
              <span className="text-sky-400" title={t.saving}>
                •
              </span>
            ) : null}
            {closable ? (
              <button
                type="button"
                title={t.closeTab}
                onClick={(event) => {
                  event.stopPropagation()
                  props.onClose(tab.id)
                }}
                className={`rounded p-0.5 hover:bg-panel-line ${active ? '' : 'opacity-0 group-hover:opacity-100'}`}
              >
                <X size={12} />
              </button>
            ) : null}
          </div>
        )
      })}

      {/* Centred on the tabs' height, whatever the strip's top padding. */}
      <div className="ml-1 flex items-center self-stretch">
        <Menu
          items={[
            { label: t.newProject, icon: <FilePlus size={13} />, onSelect: () => props.onCreate('blank') },
            { label: t.fromImage, icon: <ImagePlus size={13} />, onSelect: () => props.onCreate('image') },
            { label: t.fromPdf, icon: <FileText size={13} />, onSelect: () => props.onCreate('pdf') },
            'separator',
            { label: t.openProject, icon: <FolderOpen size={13} />, onSelect: props.onOpen },
          ]}
          trigger={(toggle) => (
            <button
              type="button"
              title={t.newTab}
              onClick={toggle}
              className="rounded p-1 text-slate-400 hover:bg-panel hover:text-slate-100"
            >
              <Plus size={14} />
            </button>
          )}
        />
      </div>
    </div>
  )
}
