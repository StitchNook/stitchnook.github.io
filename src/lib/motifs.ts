/**
 * Motif library: reusable elements (letters, borders, flowers…) stored like
 * projects but flagged `kind: 'motif'`, filed in folders (lib/folders), and
 * inserted into projects from the « Motifs » tool.
 */
import { createProject } from '../hooks/useProject'
import { EMPTY } from './grid'
import { ensurePath } from './folders'
import { isMotif, listProjects, loadProject, saveProject, type ProjectMeta } from './storage'
import type { Fabric, Patch, Project, Thread } from './types'

export function listMotifs(): ProjectMeta[] {
  return listProjects().filter(isMotif)
}

/**
 * Once, before the app renders: the old free-text categories become root
 * folders (same spelling = same folder) and their motifs move into them.
 */
export function migrateCategories(): void {
  for (const meta of listMotifs()) {
    if (!meta.category) continue
    const project = loadProject(meta.id)
    if (!project) continue
    const folderId = project.folderId ?? ensurePath([meta.category])
    const migrated: Project = { ...project, folderId }
    delete migrated.category
    try {
      saveProject(migrated)
    } catch {
      return // storage full: retried at the next start
    }
  }
}

/**
 * A motif made of a block of stitches (selection, preview): cropped to the
 * stitches actually set, keeping only the threads it uses.
 */
export function motifFromPatch(
  patch: Patch,
  palette: Thread[],
  options: { name: string; folderId?: string; fabric: Fabric },
): Project | null {
  // Bounding box of the set stitches.
  let minX = patch.width
  let minY = patch.height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < patch.height; y++) {
    for (let x = 0; x < patch.width; x++) {
      if (patch.cells[y * patch.width + x] === EMPTY) continue
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }
  if (maxX < 0) return null

  const width = maxX - minX + 1
  const height = maxY - minY + 1
  const motif = createProject({ name: options.name, width, height, fabric: options.fabric })
  const remap = new Map<number, number>()
  const threads: Thread[] = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = patch.cells[(y + minY) * patch.width + x + minX]
      if (value === EMPTY || !palette[value]) continue
      let index = remap.get(value)
      if (index === undefined) {
        index = threads.length
        remap.set(value, index)
        threads.push({ ...palette[value] })
      }
      motif.cells[y * width + x] = index
    }
  }
  return { ...motif, palette: threads, kind: 'motif', folderId: options.folderId }
}

/** The motif's stitches all in one thread (index 0 of `codes`). */
export function monochrome(patch: Patch): Patch {
  const cells = patch.cells.map((value) => (value === EMPTY ? EMPTY : 0))
  return { ...patch, cells }
}

/** Draw a small preview of a project's stitches (one block per stitch). */
export function drawThumbnail(
  canvas: HTMLCanvasElement,
  project: Pick<Project, 'width' | 'height' | 'cells'>,
  colors: string[],
  size: number,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const scale = Math.max(1, Math.floor(size / Math.max(project.width, project.height)))
  canvas.width = project.width * scale
  canvas.height = project.height * scale
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  for (let y = 0; y < project.height; y++) {
    for (let x = 0; x < project.width; x++) {
      const value = project.cells[y * project.width + x]
      if (value === EMPTY) continue
      ctx.fillStyle = colors[value] ?? '#888'
      ctx.fillRect(x * scale, y * scale, scale, scale)
    }
  }
}
