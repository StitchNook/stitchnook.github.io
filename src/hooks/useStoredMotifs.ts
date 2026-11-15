import { useMemo, useSyncExternalStore } from 'react'
import { listFolders, type MotifFolder } from '../lib/folders'
import { listMotifs } from '../lib/motifs'
import { loadProject, type ProjectMeta } from '../lib/storage'
import { storeVersion, subscribeStore } from '../lib/storeEvents'
import type { Project } from '../lib/types'
import { dataGet } from '../lib/db'

export type MotifItem = { entry: ProjectMeta; project: Project }

/*
 * Shared by the « Motifs » panel and the library manager. A re-read only
 * parses the (small) index; a motif is decoded again only when its date
 * changed. Unchanged motifs keep the same object, and an unchanged library
 * the same array, so React redraws no thumbnail for nothing.
 */
const decoded = new Map<string, { updatedAt: number; project: Project | null }>()
let lastStored: { entry: ProjectMeta; project: Project | null }[] = []
let lastSignature = ''
let lastFoldersRaw: string | null = null
let lastFolders: MotifFolder[] = []

function readStored() {
  const entries = listMotifs()
  const signature = entries.map((e) => `${e.id}:${e.updatedAt}:${e.name}:${e.folderId ?? ''}`).join('|')
  if (signature === lastSignature) return lastStored
  const present = new Set(entries.map((entry) => entry.id))
  for (const id of decoded.keys()) if (!present.has(id)) decoded.delete(id)
  lastStored = entries.map((entry) => {
    let hit = decoded.get(entry.id)
    if (!hit || hit.updatedAt !== entry.updatedAt) {
      hit = { updatedAt: entry.updatedAt, project: loadProject(entry.id) }
      decoded.set(entry.id, hit)
    }
    return { entry, project: hit.project }
  })
  lastSignature = signature
  return lastStored
}

function readFolders() {
  let raw: string | null = null
  try {
    raw = dataGet('stitchly.motifFolders.v1')
  } catch {
    /* Unavailable storage: no folders. */
  }
  if (raw !== lastFoldersRaw) {
    lastFoldersRaw = raw
    lastFolders = listFolders()
  }
  return lastFolders
}

/** Motifs and folders from storage (re-read when it changes), plus the current tab's live copy. */
export function useStoredMotifs(version: number, current: Project) {
  const tick = useSyncExternalStore(subscribeStore, storeVersion)
  const stored = useMemo(() => {
    void version // explicit refresh from the app
    void tick // storage changed
    return readStored()
  }, [version, tick])
  const folders = useMemo(() => {
    void version
    void tick
    return readFolders()
  }, [version, tick])

  // The motif open in the current tab is newer in memory than in storage.
  // An ordinary project in the tab is irrelevant: editing it recomputes nothing.
  const relevant = current.kind === 'motif' || stored.some(({ entry }) => entry.id === current.id)
  const live = relevant ? current : null
  const items = useMemo(() => {
    if (!live) return stored.flatMap(({ entry, project }) => (project ? [{ entry, project }] : []))
    const list: MotifItem[] = stored.flatMap(({ entry, project }) => {
      const shown = entry.id === live.id ? live : project
      // Also drops a motif just turned into a project in the current tab.
      if (!shown || shown.kind !== 'motif') return []
      return [{ entry: shown === project ? entry : { ...entry, name: shown.name, folderId: shown.folderId }, project: shown }]
    })
    // A motif just created in the current tab, before its first autosave.
    if (live.kind === 'motif' && !stored.some(({ entry }) => entry.id === live.id)) {
      list.push({
        entry: {
          id: live.id,
          name: live.name,
          width: live.width,
          height: live.height,
          updatedAt: live.updatedAt,
          kind: 'motif',
          folderId: live.folderId,
        },
        project: live,
      })
    }
    return list
  }, [live, stored])

  return { items, folders }
}
