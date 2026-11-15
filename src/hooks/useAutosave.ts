import { useCallback, useEffect, useRef, useState } from 'react'
import { StorageFullError, saveProject, setLastOpenedId } from '../lib/storage'
import { subscribeDataErrors } from '../lib/db'
import type { Project } from '../lib/types'
import { t } from './useAutosave.i18n'

export type SaveState = { status: 'idle' | 'saving' | 'saved' | 'error'; message?: string }

/** At most one save per this delay while editing. */
export const AUTOSAVE_DELAY = 10_000

/**
 * Mirror the project into localStorage at most every 10 s while it changes:
 * the first unsaved edit schedules the save, later edits do not push it back
 * (so continuous work is still saved), and the latest version is written.
 * `flush` saves right away — before switching / replacing a project, when the
 * window goes to the background and when the page closes — so no edit is
 * ever lost to the delay.
 */
export function useAutosave(project: Project, delay = AUTOSAVE_DELAY): SaveState & { flush: () => void } {
  const [state, setState] = useState<SaveState>({ status: 'idle' })
  const first = useRef(true)
  // Latest project waiting to be saved, if any, and the scheduled save.
  const pending = useRef<Project | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const write = useCallback((target: Project) => {
    try {
      saveProject(target)
      setLastOpenedId(target.id)
      setState({ status: 'saved' })
    } catch (error) {
      setState({
        status: 'error',
        message:
          error instanceof StorageFullError
            ? t.storageFull
            : t.saveFailed,
      })
    }
  }, [])

  useEffect(() => {
    if (first.current) {
      first.current = false
      setLastOpenedId(project.id)
      return
    }
    pending.current = project
    setState((current) => (current.status === 'saving' ? current : { status: 'saving' }))
    // Not reset by later edits: the save happens `delay` after the first one.
    if (timer.current === null) {
      timer.current = setTimeout(() => {
        timer.current = null
        const target = pending.current
        pending.current = null
        if (target) write(target)
      }, delay)
    }
  }, [project, delay, write])

  const flush = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }
    const target = pending.current
    if (!target) return
    pending.current = null
    write(target)
  }, [write])

  // Background writes to IndexedDB that fail (disk full…) surface here.
  useEffect(
    () =>
      subscribeDataErrors(() => {
        setState({ status: 'error', message: t.storageFull })
      }),
    [],
  )

  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('beforeunload', flush)
    document.addEventListener('visibilitychange', onHidden)
    return () => {
      window.removeEventListener('beforeunload', flush)
      document.removeEventListener('visibilitychange', onHidden)
      // Unmounting (closing the app view) must not drop the last edits.
      flush()
    }
  }, [flush])

  return { ...state, flush }
}
