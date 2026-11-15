import { MAX_SIZE, MIN_SIZE, decodeCells, decodeFlags, encodeRLE } from './grid'
import type { Project, ProjectKind, SerialisedProject } from './types'
import { notifyStoreChange } from './storeEvents'
import { t } from './storage.i18n'
import { ensurePath, folderPath, isFolder, listFolders, saveFolders, type MotifFolder } from './folders'

const INDEX_KEY = 'stitchly.index.v1'
const PROJECT_KEY = (id: string) => `stitchly.project.${id}`
const LAST_OPENED_KEY = 'stitchly.lastOpened.v1'

export type ProjectMeta = {
  id: string
  name: string
  width: number
  height: number
  updatedAt: number
  kind?: ProjectKind
  folderId?: string
  /** Old free-text category (migrated into folders at start-up). */
  category?: string
}

export const isMotif = (entry: { kind?: ProjectKind }) => entry.kind === 'motif'

export class StorageFullError extends Error {
  constructor() {
    super(t.storageFull)
    this.name = 'StorageFullError'
  }
}

export function newProjectId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/* --------------------------------------------------------------- conversion */

export function serialise(project: Project): SerialisedProject {
  const { cells, done, ...rest } = project
  return { ...rest, version: 1, cells: encodeRLE(cells), done: encodeRLE(done) }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Rebuild a project from untrusted JSON. Throws a message meant to be shown
 * to the user, since this also backs the "import a .json file" button.
 */
export function deserialise(raw: unknown): Project {
  if (!isRecord(raw)) throw new Error(t.notObject)

  const width = Number(raw.width)
  const height = Number(raw.height)
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error(t.noSize)
  }
  if (width < MIN_SIZE || height < MIN_SIZE || width > MAX_SIZE || height > MAX_SIZE) {
    throw new Error(t.sizeOutOfRange(MAX_SIZE))
  }

  const palette = Array.isArray(raw.palette)
    ? raw.palette.flatMap((entry) => {
        if (!isRecord(entry) || typeof entry.code !== 'string') return []
        return [{ code: entry.code, symbol: typeof entry.symbol === 'string' ? entry.symbol : '?' }]
      })
    : []

  const fabricRaw = isRecord(raw.fabric) ? raw.fabric : {}
  const count = Number(fabricRaw.count)
  const fabric = {
    count: Number.isFinite(count) && count > 0 ? count : 14,
    countUnit: fabricRaw.countUnit === 'cm' ? ('cm' as const) : ('in' as const),
    displayUnit: fabricRaw.displayUnit === 'in' ? ('in' as const) : ('cm' as const),
  }

  const cells = decodeCells(typeof raw.cells === 'string' ? raw.cells : '', width, height)
  // Clamp stray indices so a hand-edited file cannot point past the palette.
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] >= palette.length) cells[i] = -1
  }

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newProjectId(),
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name : t.importedName,
    createdAt: Number(raw.createdAt) || Date.now(),
    updatedAt: Number(raw.updatedAt) || Date.now(),
    width,
    height,
    fabric,
    palette,
    cells,
    done: decodeFlags(typeof raw.done === 'string' ? raw.done : '', width, height),
    ...(raw.kind === 'motif' ? { kind: 'motif' as const } : {}),
    ...(typeof raw.folderId === 'string' && raw.folderId ? { folderId: raw.folderId } : {}),
    ...(typeof raw.category === 'string' && raw.category.trim() ? { category: raw.category.trim() } : {}),
  }
}

/* ------------------------------------------------------------ local storage */

export function listProjects(): ProjectMeta[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return (parsed as ProjectMeta[]).sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

function writeIndex(entries: ProjectMeta[]) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(entries))
}

export function saveProject(project: Project): void {
  const payload = JSON.stringify(serialise(project))
  try {
    localStorage.setItem(PROJECT_KEY(project.id), payload)
  } catch {
    throw new StorageFullError()
  }
  const meta: ProjectMeta = {
    id: project.id,
    name: project.name,
    width: project.width,
    height: project.height,
    updatedAt: project.updatedAt,
    kind: project.kind,
    folderId: project.folderId,
    category: project.category,
  }
  const all = listProjects()
  const before = all.find((entry) => entry.id === project.id)
  const entries = all.filter((entry) => entry.id !== project.id)
  entries.unshift(meta)
  try {
    writeIndex(entries)
  } catch {
    throw new StorageFullError()
  }
  // Only the motif library listens: saving an ordinary project (every
  // autosave) must not make it re-read anything.
  if (project.kind === 'motif' || before?.kind === 'motif') notifyStoreChange()
}

export function loadProject(id: string): Project | null {
  try {
    const raw = localStorage.getItem(PROJECT_KEY(id))
    if (!raw) return null
    return deserialise(JSON.parse(raw))
  } catch {
    return null
  }
}

export function deleteProject(id: string): void {
  try {
    localStorage.removeItem(PROJECT_KEY(id))
    writeIndex(listProjects().filter((entry) => entry.id !== id))
    notifyStoreChange()
  } catch {
    /* Nothing useful to do if storage is unavailable. */
  }
}

export function getLastOpenedId(): string | null {
  try {
    return localStorage.getItem(LAST_OPENED_KEY)
  } catch {
    return null
  }
}

export function setLastOpenedId(id: string): void {
  try {
    localStorage.setItem(LAST_OPENED_KEY, id)
  } catch {
    /* Ignore: losing the "reopen last project" hint is harmless. */
  }
}

/* ------------------------------------------------------------- file on disk */

function slugify(name: string): string {
  return (
    name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || t.slugFallback
  )
}

function download(data: unknown, fileName: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function exportProjectFile(project: Project): void {
  const data = serialise(project)
  // A motif carries its folder path, so an import files it in the same place.
  const extra = project.kind === 'motif' ? { folderPath: folderPath(listFolders(), project.folderId) } : {}
  // The folder id means nothing in another browser: the path replaces it.
  const rest: Partial<SerialisedProject> = { ...data }
  delete rest.folderId
  download({ ...rest, ...extra }, t.projectFile(slugify(project.name)))
}

/** The file is a full backup, to restore rather than open. */
export class BackupFileError extends Error {
  readonly backup: Backup
  constructor(backup: Backup) {
    super(t.backupIsNotProject)
    this.name = 'BackupFileError'
    this.backup = backup
  }
}

/* ------------------------------------------------------------ full backup */

export type Backup = { type: 'backup'; version: 1; createdAt: number; projects: SerialisedProject[]; folders: MotifFolder[] }

export function isBackup(raw: unknown): raw is Backup {
  return isRecord(raw) && raw.type === 'backup' && Array.isArray(raw.projects)
}

/** Everything in this browser — projects, motifs, folders — in one file. */
export function exportBackup(): number {
  const projects = listProjects().flatMap((meta) => {
    const project = loadProject(meta.id)
    return project ? [serialise(project)] : []
  })
  const backup: Backup = { type: 'backup', version: 1, createdAt: Date.now(), projects, folders: listFolders() }
  const day = new Date().toISOString().slice(0, 10)
  download(backup, t.backupFile(day))
  try {
    localStorage.setItem(LAST_BACKUP_KEY, String(Date.now()))
  } catch {
    /* The reminder will simply show again. */
  }
  return projects.length
}

/* ------------------------------------------------------- backup reminder */

// Projects only live in this browser, which may clear them (Safari, cleaning
// tools…): remind to download a full backup when there are changes it lacks.
const LAST_BACKUP_KEY = 'stitchly.lastBackup.v1'
const FIRST_SEEN_KEY = 'stitchly.firstSeen.v1'
const SNOOZE_KEY = 'stitchly.backupSnooze.v1'
const DAY = 24 * 60 * 60 * 1000
export const BACKUP_REMINDER_DAYS = 14

function readTime(key: string): number | null {
  const value = Number(localStorage.getItem(key))
  return Number.isFinite(value) && value > 0 ? value : null
}

/** True when work changed since the last full backup, and that backup (or the first visit) is old. */
export function isBackupDue(now = Date.now()): boolean {
  try {
    let firstSeen = readTime(FIRST_SEEN_KEY)
    if (firstSeen === null) {
      firstSeen = now
      localStorage.setItem(FIRST_SEEN_KEY, String(now))
    }
    if ((readTime(SNOOZE_KEY) ?? 0) > now) return false
    const lastBackup = readTime(LAST_BACKUP_KEY)
    const newestChange = Math.max(0, ...listProjects().map((meta) => meta.updatedAt))
    if (newestChange <= (lastBackup ?? 0)) return false
    return now - (lastBackup ?? firstSeen) > BACKUP_REMINDER_DAYS * DAY
  } catch {
    return false
  }
}

/** Hide the reminder for a week. */
export function snoozeBackupReminder(now = Date.now()): void {
  try {
    localStorage.setItem(SNOOZE_KEY, String(now + 7 * DAY))
  } catch {
    /* Nothing to do: it shows again. */
  }
}

export type RestoreSummary = {
  projects: number
  motifs: number
  folders: number
  replaced: number
  skipped: number
  /** Open in a tab: never overwritten under the user's feet. */
  open: number
}

/**
 * Adds what is missing from this browser. Same id = already here: skipped,
 * or replaced when `replaceOlder` and the backup's copy is newer.
 */
export function restoreBackup(backup: Backup, options: { replaceOlder: boolean; openIds: string[] }): RestoreSummary {
  const summary: RestoreSummary = { projects: 0, motifs: 0, folders: 0, replaced: 0, skipped: 0, open: 0 }
  const folders = listFolders()
  const known = new Set(folders.map((folder) => folder.id))
  const incoming = (Array.isArray(backup.folders) ? backup.folders : []).filter(isFolder)
  const added = incoming.filter((folder) => !known.has(folder.id))
  if (added.length > 0) saveFolders([...folders, ...added])
  summary.folders = added.length

  const existing = new Map(listProjects().map((meta) => [meta.id, meta]))
  for (const raw of backup.projects) {
    let project: Project
    try {
      project = deserialise(raw)
    } catch {
      continue
    }
    const here = existing.get(project.id)
    if (here) {
      if (options.openIds.includes(project.id)) {
        summary.open++
        continue
      }
      if (!options.replaceOlder || project.updatedAt <= here.updatedAt) {
        summary.skipped++
        continue
      }
      summary.replaced++
    } else if (project.kind === 'motif') summary.motifs++
    else summary.projects++
    saveProject(project)
  }
  notifyStoreChange()
  return summary
}

export async function importProjectFile(file: File): Promise<Project> {
  const text = await file.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error(t.invalidJson)
  }
  if (isBackup(parsed)) throw new BackupFileError(parsed)
  const project = deserialise(parsed)
  // A motif goes back to its folder, recreated if needed.
  const path = isRecord(parsed) && Array.isArray(parsed.folderPath) ? parsed.folderPath.filter((n) => typeof n === 'string') : null
  const placed = project.kind === 'motif' && path ? { folderId: ensurePath(path as string[]) } : { folderId: undefined }
  // Imports always land as a new project so they never clobber an open one.
  return { ...project, ...placed, id: newProjectId(), updatedAt: Date.now() }
}
