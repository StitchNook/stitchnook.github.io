import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { createCells, mergeThread, removeThread, resizeCells, resizeFlags } from '../lib/grid'
import { nextSymbol } from '../lib/symbols'
import { newProjectId } from '../lib/storage'
import type { Fabric, Project, Thread, Unit } from '../lib/types'
import { byLang } from '../i18n'

const HISTORY_LIMIT = 60

/** Display unit of a new project: inches for English speakers, cm otherwise. */
export const DEFAULT_DISPLAY_UNIT: Unit = byLang<Unit>({ fr: 'cm', en: 'in', es: 'cm', de: 'cm' })

/** The part of a project that undo restores; metadata is deliberately excluded. */
type Snapshot = {
  width: number
  height: number
  cells: Int16Array
  done: Uint8Array
  palette: Thread[]
}

/** A project with its undo / redo history, so a background tab keeps both. */
export type ProjectState = {
  project: Project
  past: Snapshot[]
  future: Snapshot[]
}
type State = ProjectState

type Action =
  | { type: 'apply'; mutate: (project: Project) => Project; history: boolean }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'load'; project: Project }
  | { type: 'restore'; state: State }

function snapshot(project: Project): Snapshot {
  return {
    width: project.width,
    height: project.height,
    cells: project.cells,
    done: project.done,
    palette: project.palette,
  }
}

function restore(project: Project, snap: Snapshot): Project {
  return { ...project, ...snap, updatedAt: Date.now() }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'apply': {
      const next = action.mutate(state.project)
      if (next === state.project) return state
      const project = { ...next, updatedAt: Date.now() }
      if (!action.history) return { ...state, project }
      const past = [...state.past, snapshot(state.project)]
      if (past.length > HISTORY_LIMIT) past.shift()
      return { project, past, future: [] }
    }
    case 'undo': {
      const previous = state.past.at(-1)
      if (!previous) return state
      return {
        project: restore(state.project, previous),
        past: state.past.slice(0, -1),
        future: [snapshot(state.project), ...state.future],
      }
    }
    case 'redo': {
      const [next, ...rest] = state.future
      if (!next) return state
      return {
        project: restore(state.project, next),
        past: [...state.past, snapshot(state.project)],
        future: rest,
      }
    }
    case 'load':
      return { project: action.project, past: [], future: [] }
    case 'restore':
      return action.state
  }
}

export function createProject(options: {
  name: string
  width: number
  height: number
  fabric: Fabric
}): Project {
  const now = Date.now()
  return {
    id: newProjectId(),
    name: options.name,
    createdAt: now,
    updatedAt: now,
    width: options.width,
    height: options.height,
    fabric: options.fabric,
    palette: [],
    cells: createCells(options.width, options.height),
    done: new Uint8Array(options.width * options.height),
  }
}

export function useProject(initial: Project) {
  const [state, dispatch] = useReducer(reducer, {
    project: initial,
    past: [],
    future: [],
  })

  // Latest state, for callers that must read it synchronously (tabs, merges).
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  })

  /** False until the current stroke has recorded its single history entry. */
  const strokeStarted = useRef(false)

  const apply = useCallback((mutate: (project: Project) => Project) => {
    dispatch({ type: 'apply', mutate, history: true })
  }, [])

  /** Metadata edits (name, fabric) are not worth an undo step. */
  const applyQuiet = useCallback((mutate: (project: Project) => Project) => {
    dispatch({ type: 'apply', mutate, history: false })
  }, [])

  const beginStroke = useCallback(() => {
    strokeStarted.current = false
  }, [])

  /**
   * Every call during a drag mutates the grid, but only the first one records
   * history — so a 300-cell pencil stroke costs exactly one undo.
   */
  const applyStroke = useCallback((mutate: (project: Project) => Project) => {
    dispatch({ type: 'apply', mutate, history: !strokeStarted.current })
    strokeStarted.current = true
  }, [])

  const endStroke = useCallback(() => {
    strokeStarted.current = false
  }, [])

  const undo = useCallback(() => dispatch({ type: 'undo' }), [])
  const redo = useCallback(() => dispatch({ type: 'redo' }), [])
  const load = useCallback((project: Project) => dispatch({ type: 'load', project }), [])

  /** Snapshot of the project and its history, to park a tab in the background. */
  const exportState = useCallback((): ProjectState => stateRef.current, [])
  const restoreState = useCallback((next: ProjectState) => {
    stateRef.current = next
    dispatch({ type: 'restore', state: next })
  }, [])

  /**
   * Map threads from another project (by DMC code) onto this palette, adding
   * the missing references with a free symbol in one go. `indexMap[i]` is the
   * local index of the source's thread i; `added` lists the new codes.
   */
  const mergeThreads = useCallback(
    (codes: string[]): { indexMap: number[]; added: string[] } => {
      const palette = [...stateRef.current.project.palette]
      const added: string[] = []
      const indexMap = codes.map((code) => {
        const existing = palette.findIndex((thread) => thread.code === code)
        if (existing !== -1) return existing
        palette.push({ code, symbol: nextSymbol(palette.map((thread) => thread.symbol)) })
        added.push(code)
        return palette.length - 1
      })
      if (added.length > 0) {
        stateRef.current = {
          ...stateRef.current,
          project: { ...stateRef.current.project, palette },
        }
        applyQuiet((project) => ({ ...project, palette }))
      }
      return { indexMap, added }
    },
    [applyQuiet],
  )

  /** Drop the given references again, but only those no stitch uses. */
  const pruneThreads = useCallback(
    (codes: string[]) => {
      if (codes.length === 0) return
      const mutate = (project: Project): Project => {
        const used = new Set<number>()
        for (const value of project.cells) if (value >= 0) used.add(value)
        let { palette, cells } = project
        for (let index = palette.length - 1; index >= 0; index--) {
          if (!codes.includes(palette[index].code) || used.has(index)) continue
          palette = palette.filter((_, i) => i !== index)
          cells = removeThread(cells, index)
        }
        return palette === project.palette ? project : { ...project, palette, cells }
      }
      // Kept in sync right away: a tab switch may read the state before render.
      stateRef.current = { ...stateRef.current, project: mutate(stateRef.current.project) }
      applyQuiet(mutate)
    },
    [applyQuiet],
  )

  /** Index of `code` in the palette, appending it (with a free symbol) if new. */
  const addThread = useCallback(
    (code: string): number => {
      const existing = state.project.palette.findIndex((thread) => thread.code === code)
      if (existing !== -1) return existing
      const symbol = nextSymbol(state.project.palette.map((thread) => thread.symbol))
      applyQuiet((project) => ({ ...project, palette: [...project.palette, { code, symbol }] }))
      return state.project.palette.length
    },
    [applyQuiet, state.project.palette],
  )

  const removeThreadAt = useCallback(
    (index: number) => {
      apply((project) => ({
        ...project,
        palette: project.palette.filter((_, i) => i !== index),
        cells: removeThread(project.cells, index),
      }))
    },
    [apply],
  )

  /**
   * Swap the DMC reference of a thread. When the new reference is already in
   * the palette the two threads merge, so no duplicate entry is ever created.
   */
  const replaceThread = useCallback(
    (index: number, code: string) => {
      apply((project) => {
        const current = project.palette[index]
        if (!current || current.code === code) return project
        const target = project.palette.findIndex((thread) => thread.code === code)
        if (target === -1) {
          return {
            ...project,
            palette: project.palette.map((thread, i) => (i === index ? { ...thread, code } : thread)),
          }
        }
        return {
          ...project,
          palette: project.palette.filter((_, i) => i !== index),
          cells: removeThread(mergeThread(project.cells, index, target), index),
        }
      })
    },
    [apply],
  )

  const setThreadSymbol = useCallback(
    (index: number, symbol: string) => {
      applyQuiet((project) => ({
        ...project,
        palette: project.palette.map((thread, i) => (i === index ? { ...thread, symbol } : thread)),
      }))
    },
    [applyQuiet],
  )

  const resize = useCallback(
    (width: number, height: number) => {
      apply((project) => {
        if (project.width === width && project.height === height) return project
        return {
          ...project,
          width,
          height,
          cells: resizeCells(project.cells, project.width, project.height, width, height),
          done: resizeFlags(project.done, project.width, project.height, width, height),
        }
      })
    },
    [apply],
  )

  const setFabric = useCallback(
    (fabric: Fabric) => applyQuiet((project) => ({ ...project, fabric })),
    [applyQuiet],
  )

  const rename = useCallback(
    (name: string) => applyQuiet((project) => ({ ...project, name })),
    [applyQuiet],
  )

  return useMemo(
    () => ({
      project: state.project,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      apply,
      applyQuiet,
      applyStroke,
      beginStroke,
      endStroke,
      undo,
      redo,
      load,
      exportState,
      restoreState,
      mergeThreads,
      pruneThreads,
      addThread,
      removeThreadAt,
      replaceThread,
      setThreadSymbol,
      resize,
      setFabric,
      rename,
    }),
    [
      state.project,
      state.past.length,
      state.future.length,
      apply,
      applyQuiet,
      applyStroke,
      beginStroke,
      endStroke,
      undo,
      redo,
      load,
      exportState,
      restoreState,
      mergeThreads,
      pruneThreads,
      addThread,
      removeThreadAt,
      replaceThread,
      setThreadSymbol,
      resize,
      setFabric,
      rename,
    ],
  )
}

export type ProjectApi = ReturnType<typeof useProject>
