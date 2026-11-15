import { useCallback, useEffect, useRef, useState } from 'react'
import { listProjects, loadProject } from '../lib/storage'
import type { Project } from '../lib/types'
import type { ProjectApi, ProjectState } from './useProject'
import type { Viewport } from './useViewport'

/** `motif`: a library element is being edited, not a full project. */
export type Tab = { id: string; name: string; motif?: boolean }

const TABS_KEY = 'stitchly.tabs.v1'

/** Tabs from the last session that still exist in storage, current one included. */
function initialTabs(current: Project): Tab[] {
  const metas = listProjects()
  const names = new Map(metas.map((meta) => [meta.id, meta.name]))
  const motifs = new Set(metas.filter((meta) => meta.kind === 'motif').map((meta) => meta.id))
  let ids: string[] = []
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(TABS_KEY) ?? '[]')
    if (Array.isArray(parsed)) ids = parsed.filter((id): id is string => typeof id === 'string')
  } catch {
    /* Unreadable: start with the current project only. */
  }
  const tabs = ids.filter((id) => names.has(id)).map((id) => ({ id, name: names.get(id) ?? '', motif: motifs.has(id) }))
  if (!tabs.some((tab) => tab.id === current.id)) tabs.push({ id: current.id, name: current.name, motif: current.kind === 'motif' })
  return tabs
}

type Options = {
  api: ProjectApi
  viewport: Viewport
  setViewport: (viewport: Viewport) => void
  /** Save the active project right now (skips the autosave delay). */
  flush: () => void
  /** Drop selection / pending preview before the grid changes under them. */
  beforeSwitch: () => void
}

/**
 * Several projects open side by side. Only the active one lives in the
 * project reducer; background tabs are parked in memory with their undo
 * history and framing, and reloaded from storage after a page refresh.
 */
export function useTabs({ api, viewport, setViewport, flush, beforeSwitch }: Options) {
  const [tabs, setTabs] = useState<Tab[]>(() => initialTabs(api.project))
  const parked = useRef(new Map<string, { state: ProjectState; viewport: Viewport }>())
  const activeId = api.project.id

  // The open tabs survive a reload.
  useEffect(() => {
    try {
      localStorage.setItem(TABS_KEY, JSON.stringify(tabs.map((tab) => tab.id)))
    } catch {
      /* Storage unavailable: tabs just won't be restored. */
    }
  }, [tabs])

  /** Leave the active project: save it, and optionally park it in memory. */
  const leave = useCallback(
    (park: boolean) => {
      flush()
      beforeSwitch()
      if (park) parked.current.set(activeId, { state: api.exportState(), viewport })
      else parked.current.delete(activeId)
    },
    [activeId, api, beforeSwitch, flush, viewport],
  )

  /** Bring a project into the reducer: from memory if parked, else from storage. */
  const enter = useCallback(
    (id: string, fresh?: Project): boolean => {
      const memory = parked.current.get(id)
      if (memory && !fresh) {
        parked.current.delete(id)
        api.restoreState(memory.state)
        setViewport(memory.viewport)
        return true
      }
      const project = fresh ?? loadProject(id)
      if (!project) return false
      api.load(project)
      return true
    },
    [api, setViewport],
  )

  const switchTo = useCallback(
    (id: string) => {
      if (id === activeId) return
      leave(true)
      if (!enter(id)) setTabs((current) => current.filter((tab) => tab.id !== id))
    },
    [activeId, enter, leave],
  )

  /** Open in a new tab, or jump to the tab that already shows this project. */
  const openInNewTab = useCallback(
    (project: Project) => {
      if (tabs.some((tab) => tab.id === project.id)) {
        switchTo(project.id)
        return
      }
      leave(true)
      setTabs((current) => {
        const at = current.findIndex((tab) => tab.id === activeId)
        const next = [...current]
        next.splice(at + 1, 0, { id: project.id, name: project.name, motif: project.kind === 'motif' })
        return next
      })
      enter(project.id, project)
    },
    [activeId, enter, leave, switchTo, tabs],
  )

  /** Open in place of the active tab, which is saved first. */
  const replaceCurrent = useCallback(
    (project: Project) => {
      if (project.id === activeId) return
      if (tabs.some((tab) => tab.id === project.id)) {
        switchTo(project.id)
        return
      }
      leave(false)
      setTabs((current) =>
        current.map((tab) => (tab.id === activeId ? { id: project.id, name: project.name, motif: project.kind === 'motif' } : tab)),
      )
      enter(project.id, project)
    },
    [activeId, enter, leave, switchTo, tabs],
  )

  const close = useCallback(
    (id: string) => {
      if (tabs.length <= 1) return
      if (id !== activeId) {
        parked.current.delete(id)
        setTabs((current) => current.filter((tab) => tab.id !== id))
        return
      }
      const index = tabs.findIndex((tab) => tab.id === id)
      const neighbour = tabs[index + 1] ?? tabs[index - 1]
      leave(false)
      setTabs((current) => current.filter((tab) => tab.id !== id))
      enter(neighbour.id)
    },
    [activeId, enter, leave, tabs],
  )

  // The active tab shows the live name, even before it is saved.
  const shown = tabs.map((tab) => (tab.id === activeId ? { ...tab, name: api.project.name, motif: api.project.kind === 'motif' } : tab))

  return { tabs: shown, activeId, switchTo, openInNewTab, replaceCurrent, close }
}
