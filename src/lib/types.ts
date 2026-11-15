/** A reference from the static DMC catalogue. */
export type DmcColor = {
  code: string
  name: string
  hex: string
}

/** A DMC reference actually used by a project, with its printable symbol. */
export type Thread = {
  code: string
  symbol: string
}

export type Unit = 'cm' | 'in'

export type Fabric = {
  /** Stitches per `countUnit` (e.g. 5.5 per cm, or 14 per inch for Aida 14). */
  count: number
  countUnit: Unit
  /** Unit used to display physical dimensions in the UI. */
  displayUnit: Unit
}

export type Project = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  /** Grid size, in stitches. */
  width: number
  height: number
  fabric: Fabric
  /** Cell values index into this array; the order is load-bearing. */
  palette: Thread[]
  /** `width * height` palette indices, `EMPTY` for a blank stitch. */
  cells: Int16Array
  /** `width * height` flags, 1 when the stitch has been embroidered. */
  done: Uint8Array
  /**
   * A full design to embroider, or a reusable element of the motif library
   * (letter, border…) meant to be inserted into projects. Absent = project.
   */
  kind?: ProjectKind
  /** Folder of a motif in the library (root when absent). See lib/folders. */
  folderId?: string
  /** Old free-text category, only read to migrate it into a folder. */
  category?: string
}

export type ProjectKind = 'project' | 'motif'

/** Serialised shape used by localStorage and by JSON export/import. */
export type SerialisedProject = Omit<Project, 'cells' | 'done'> & {
  version: 1
  cells: string
  done: string
}

/** A rectangular block of stitches lifted off the grid. */
export type Patch = {
  width: number
  height: number
  cells: Int16Array
}

export type Rect = { x: number; y: number; w: number; h: number }

/**
 * A free-form selection: the rectangle is its bounding box and `mask` (w×h,
 * 1 = selected) says which stitches inside it actually belong to it.
 */
export type Selection = Rect & { mask: Uint8Array }

export type Point = { x: number; y: number }

export type ToolId =
  | 'pencil'
  | 'eraser'
  | 'picker'
  | 'fill'
  | 'line'
  | 'rect'
  | 'ellipse'
  | 'select'
  | 'text'
  | 'progress'
  | 'motif'

/** How stitches are drawn on the canvas and on the printed chart. */
export type DisplayMode = 'color' | 'symbol' | 'both'

/** What the colour filter does to the threads that are not selected. */
export type FilterMode = 'off' | 'isolate' | 'dim'
