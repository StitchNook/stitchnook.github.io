/**
 * Reference layer: an image laid over (or under) the stitches, to trace a
 * design by hand. Never printed, never counted. Stored per project, apart from
 * the project itself (and not in its .json export), as a reduced JPEG so it
 * does not eat the browser's small storage.
 */

export type Reference = {
  /** JPEG data URL of the (reduced) image. */
  src: string
  /** Natural size of `src`, for proportions. */
  naturalWidth: number
  naturalHeight: number
  /** Placement on the grid, in stitches (fractions allowed). */
  x: number
  y: number
  w: number
  h: number
  opacity: number
  /** Drawn over the stitches (tracing) rather than under them. */
  above: boolean
  visible: boolean
}

import { t } from './reference.i18n'
import { dataGet, dataRemove, dataSet } from './db'

const MAX_SIDE = 1600
const key = (projectId: string) => `stitchly.reference.${projectId}`

export class ReferenceStorageError extends Error {}

/** Reduce an image (file or bitmap) to a JPEG data URL of at most 1600 px. */
export async function encodeReference(source: Blob | ImageBitmap): Promise<{ src: string; width: number; height: number }> {
  const bitmap = source instanceof Blob ? await createImageBitmap(source) : source
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error(t.noCanvas)
  ctx.fillStyle = '#ffffff' // JPEG has no transparency
  ctx.fillRect(0, 0, width, height)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, width, height)
  return { src: canvas.toDataURL('image/jpeg', 0.85), width, height }
}

/** Placement that fills the grid while keeping the image's proportions, centred. */
export function fitToGrid(naturalWidth: number, naturalHeight: number, gridWidth: number, gridHeight: number) {
  const scale = Math.min(gridWidth / naturalWidth, gridHeight / naturalHeight)
  const w = naturalWidth * scale
  const h = naturalHeight * scale
  return { x: (gridWidth - w) / 2, y: (gridHeight - h) / 2, w, h }
}

export function loadReference(projectId: string): Reference | null {
  try {
    const raw = dataGet(key(projectId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Reference
    return typeof parsed?.src === 'string' ? parsed : null
  } catch {
    return null
  }
}

export function saveReference(projectId: string, reference: Reference | null): void {
  try {
    if (reference) dataSet(key(projectId), JSON.stringify(reference))
    else dataRemove(key(projectId))
  } catch {
    throw new ReferenceStorageError(t.storageFull)
  }
}
