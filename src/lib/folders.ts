/**
 * Folders of the motif library: a tree stored apart from the motifs, which
 * point at their folder by id (root when absent). Names are unique within a
 * folder, compared without case or accents, so « Fleurs » and « fleurs » can
 * never become two folders by mistake.
 */

import { LOCALE } from '../i18n'
import { notifyStoreChange } from './storeEvents'
import { t } from './folders.i18n'

export type MotifFolder = { id: string; name: string; parentId: string | null }

const FOLDERS_KEY = 'stitchly.motifFolders.v1'

export const ROOT_NAME = t.root

export function listFolders(): MotifFolder[] {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isFolder) : []
  } catch {
    return []
  }
}

export function saveFolders(folders: MotifFolder[]): void {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders))
  notifyStoreChange()
}

export function isFolder(value: unknown): value is MotifFolder {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return typeof v.id === 'string' && typeof v.name === 'string' && (v.parentId === null || typeof v.parentId === 'string')
}

export const newFolderId = () => `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

/** Comparison key: no case, no accents, single spaces. */
export function folderKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase(LOCALE)
}

export function childFolders(folders: MotifFolder[], parentId: string | null): MotifFolder[] {
  return folders
    .filter((folder) => folder.parentId === parentId)
    .sort((a, b) => a.name.localeCompare(b.name, LOCALE, { numeric: true }))
}

/** A folder with that name already in `parentId` (other than `exceptId`). */
export function sameNameFolder(
  folders: MotifFolder[],
  parentId: string | null,
  name: string,
  exceptId?: string,
): MotifFolder | undefined {
  const key = folderKey(name)
  return folders.find((f) => f.parentId === parentId && f.id !== exceptId && folderKey(f.name) === key)
}

/** Names from the root down to the folder (empty for the root). */
export function folderPath(folders: MotifFolder[], id: string | null | undefined): string[] {
  const byId = new Map(folders.map((folder) => [folder.id, folder]))
  const names: string[] = []
  let current = id ? byId.get(id) : undefined
  // The guard stops on a corrupted cycle.
  for (let guard = 0; current && guard < 64; guard++) {
    names.unshift(current.name)
    current = current.parentId ? byId.get(current.parentId) : undefined
  }
  return names
}

export const pathLabel = (names: string[]) => [ROOT_NAME, ...names].join(' › ')

/** `id` itself or one of its descendants. */
export function isInside(folders: MotifFolder[], id: string | null, ancestorId: string): boolean {
  const byId = new Map(folders.map((folder) => [folder.id, folder]))
  let current = id
  for (let guard = 0; current && guard < 64; guard++) {
    if (current === ancestorId) return true
    current = byId.get(current)?.parentId ?? null
  }
  return false
}

/** `id` and all the folders below it. */
export function subtreeIds(folders: MotifFolder[], id: string): Set<string> {
  return new Set(folders.filter((folder) => isInside(folders, folder.id, id)).map((folder) => folder.id))
}

/** Creates the folder, or returns the one that already has this name there. */
export function createFolder(name: string, parentId: string | null): { folder: MotifFolder; existed: boolean } {
  const folders = listFolders()
  const clean = name.replace(/\s+/g, ' ').trim() || t.newFolder
  const existing = sameNameFolder(folders, parentId, clean)
  if (existing) return { folder: existing, existed: true }
  const folder = { id: newFolderId(), name: clean, parentId }
  saveFolders([...folders, folder])
  return { folder, existed: false }
}

/** Error message, or null when renamed. */
export function renameFolder(id: string, name: string): string | null {
  const folders = listFolders()
  const folder = folders.find((f) => f.id === id)
  const clean = name.replace(/\s+/g, ' ').trim()
  if (!folder || !clean) return t.emptyName
  if (sameNameFolder(folders, folder.parentId, clean, id)) return t.exists(clean)
  saveFolders(folders.map((f) => (f.id === id ? { ...f, name: clean } : f)))
  return null
}

/** Error message, or null when moved. */
export function moveFolder(id: string, parentId: string | null): string | null {
  const folders = listFolders()
  const folder = folders.find((f) => f.id === id)
  if (!folder) return t.notFound
  if (parentId && isInside(folders, parentId, id)) return t.intoOwnChild
  if (sameNameFolder(folders, parentId, folder.name, id)) return t.exists(folder.name)
  saveFolders(folders.map((f) => (f.id === id ? { ...f, parentId } : f)))
  return null
}

/** Removes the folder; sub-folders go up to its parent, or go too with `withSubfolders`. */
export function removeFolder(id: string, withSubfolders: boolean): void {
  const folders = listFolders()
  const folder = folders.find((f) => f.id === id)
  if (!folder) return
  const gone = withSubfolders ? subtreeIds(folders, id) : new Set([id])
  saveFolders(
    folders
      .filter((f) => !gone.has(f.id))
      .map((f) => (f.parentId === id ? { ...f, parentId: folder.parentId } : f)),
  )
}

/** The folder at this path, creating the missing ones (for imports). */
export function ensurePath(names: string[]): string | undefined {
  let parentId: string | null = null
  for (const name of names) {
    if (!name.trim()) continue
    parentId = createFolder(name, parentId).folder.id
  }
  return parentId ?? undefined
}

const LAST_FOLDER_KEY = 'stitchly.lastMotifFolder.v1'

/** Folder used last time a motif was filed, offered first next time. */
export function lastMotifFolder(): string | undefined {
  try {
    return localStorage.getItem(LAST_FOLDER_KEY) || undefined
  } catch {
    return undefined
  }
}

export function rememberMotifFolder(folderId: string | undefined) {
  try {
    if (folderId) localStorage.setItem(LAST_FOLDER_KEY, folderId)
    else localStorage.removeItem(LAST_FOLDER_KEY)
  } catch {
    /* Not remembered: harmless. */
  }
}
