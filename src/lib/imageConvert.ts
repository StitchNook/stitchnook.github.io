import { DMC_COLORS, DMC_LAB, ciede2000, hexToRgb, labDistance2, nearestDmcIndex00, rgbToLab } from './dmc'
import type { Lab } from './dmc'
import { EMPTY } from './grid'
import { nextSymbol } from './symbols'
import type { Thread } from './types'
import { t as msg } from './imageConvert.i18n'

/* ------------------------------------------------------------------ loading */

export async function loadImageFile(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file)
  } catch {
    throw new Error(msg.unreadable)
  }
}

/** Part of the source image kept, in fractions of its size (0–1). */
export type CropRect = { x: number; y: number; w: number; h: number }
export const FULL_CROP: CropRect = { x: 0, y: 0, w: 1, h: 1 }

export type Adjustments = {
  /** -100 … 100 */
  brightness: number
  /** -100 … 100 */
  contrast: number
  /** -100 … 100 */
  saturation: number
}

export const NO_ADJUSTMENTS: Adjustments = { brightness: 0, contrast: 0, saturation: 0 }

function makeCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error(msg.noCanvas)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  return { canvas, ctx }
}

/**
 * Resize the image to exactly one pixel per stitch. Large images are halved
 * step by step first: a single huge downscale aliases badly in most browsers.
 */
export function sampleImage(
  source: ImageBitmap,
  width: number,
  height: number,
  crop: CropRect = FULL_CROP,
): ImageData {
  // Start from the cropped part of the image.
  const sx = Math.round(crop.x * source.width)
  const sy = Math.round(crop.y * source.height)
  const sw = Math.max(1, Math.round(crop.w * source.width))
  const sh = Math.max(1, Math.round(crop.h * source.height))
  let current: CanvasImageSource = source
  let cw = sw
  let ch = sh
  if (sx !== 0 || sy !== 0 || sw !== source.width || sh !== source.height) {
    const { canvas, ctx } = makeCanvas(sw, sh)
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh)
    current = canvas
  }
  while (cw / 2 >= width * 2 && ch / 2 >= height * 2) {
    const nw = Math.round(cw / 2)
    const nh = Math.round(ch / 2)
    const { canvas, ctx } = makeCanvas(nw, nh)
    ctx.drawImage(current, 0, 0, cw, ch, 0, 0, nw, nh)
    current = canvas
    cw = nw
    ch = nh
  }
  const { ctx } = makeCanvas(width, height)
  ctx.drawImage(current, 0, 0, cw, ch, 0, 0, width, height)
  return ctx.getImageData(0, 0, width, height)
}

/** Brightness / contrast / saturation, applied to a copy of the pixels. */
export function adjustPixels(data: ImageData, adjust: Adjustments): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data.data)
  if (!adjust.brightness && !adjust.contrast && !adjust.saturation) return out
  const brightness = (adjust.brightness / 100) * 128
  const c = (adjust.contrast / 100) * 255
  const contrast = (259 * (c + 255)) / (255 * (259 - c))
  const saturation = 1 + adjust.saturation / 100
  for (let i = 0; i < out.length; i += 4) {
    let r = out[i]
    let g = out[i + 1]
    let b = out[i + 2]
    const grey = 0.299 * r + 0.587 * g + 0.114 * b
    r = grey + (r - grey) * saturation
    g = grey + (g - grey) * saturation
    b = grey + (b - grey) * saturation
    out[i] = contrast * (r - 128) + 128 + brightness
    out[i + 1] = contrast * (g - 128) + 128 + brightness
    out[i + 2] = contrast * (b - 128) + 128 + brightness
  }
  return out
}

/** The corner colour shared by most corners — a decent background guess. */
export function detectBackground(data: ImageData): string {
  const { width: w, height: h } = data
  const corners = [0, w - 1, (h - 1) * w, h * w - 1].map((p) => {
    const i = p * 4
    return [data.data[i], data.data[i + 1], data.data[i + 2]] as const
  })
  let best = corners[0]
  let bestScore = Infinity
  for (const a of corners) {
    let score = 0
    for (const b of corners) score += (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
    if (score < bestScore) {
      bestScore = score
      best = a
    }
  }
  return `#${best.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

/* --------------------------------------------------------------- conversion */

export type ConversionOptions = {
  /**
   * illustration: flat colours with crisp edges (each stitch takes the
   * majority colour of its area); photo: averaged colours, gradients, dither.
   */
  style: 'illustration' | 'photo'
  maxColors: number
  dither: boolean
  removeBackground: boolean
  backgroundColor: string
  /** ΔE (Lab) under which a pixel counts as background. */
  tolerance: number
  /** Replace lone stitches by their neighbours' majority colour. */
  cleanup: boolean
  /** Same-colour islands smaller than this (in stitches) melt into their surroundings. */
  minRegion: number
  /** Only remove background connected to the image border (keeps inner whites). */
  backgroundFromEdges: boolean
}

export type ConversionResult = {
  width: number
  height: number
  /** Indices into `codes`, or `EMPTY`. */
  cells: Int16Array
  /** DMC codes, sorted by stitch count, most used first. */
  codes: string[]
  counts: number[]
}

/** Small deterministic PRNG so the same settings always give the same chart. */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SAMPLE_LIMIT = 20000
const KMEANS_ITERATIONS = 10

/** k-means++ in Lab space over a pixel sample; returns the cluster centres. */
function kmeans(samples: Lab[], k: number): Lab[] {
  if (samples.length <= k) return samples.slice()
  const random = mulberry32(42)
  const centres: Lab[] = [samples[Math.floor(random() * samples.length)]]
  const nearest = new Float64Array(samples.length).fill(Infinity)
  while (centres.length < k) {
    const last = centres[centres.length - 1]
    let total = 0
    for (let i = 0; i < samples.length; i++) {
      const d = labDistance2(samples[i], last)
      if (d < nearest[i]) nearest[i] = d
      total += nearest[i]
    }
    if (total === 0) break
    let target = random() * total
    let picked = samples.length - 1
    for (let i = 0; i < samples.length; i++) {
      target -= nearest[i]
      if (target <= 0) {
        picked = i
        break
      }
    }
    centres.push(samples[picked])
  }

  const assignment = new Int32Array(samples.length)
  for (let iteration = 0; iteration < KMEANS_ITERATIONS; iteration++) {
    const sums = centres.map(() => [0, 0, 0, 0])
    for (let i = 0; i < samples.length; i++) {
      let best = 0
      let bestDistance = Infinity
      for (let c = 0; c < centres.length; c++) {
        const d = labDistance2(samples[i], centres[c])
        if (d < bestDistance) {
          bestDistance = d
          best = c
        }
      }
      assignment[i] = best
      const s = sums[best]
      s[0] += samples[i][0]
      s[1] += samples[i][1]
      s[2] += samples[i][2]
      s[3]++
    }
    for (let c = 0; c < centres.length; c++) {
      const s = sums[c]
      if (s[3] > 0) centres[c] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]]
    }
  }
  return centres
}

/**
 * Turn sampled pixels into a stitch grid using at most `maxColors` DMC threads.
 */
export function convertImage(
  data: ImageData,
  pixels: Uint8ClampedArray,
  options: ConversionOptions,
): ConversionResult {
  const { width, height } = data
  const total = width * height

  /* 1. Which pixels get a stitch at all. */
  const opaque = opaqueMask(data, options)
  let opaqueCount = 0
  for (let p = 0; p < total; p++) opaqueCount += opaque[p]

  if (opaqueCount === 0) {
    return { width, height, cells: new Int16Array(total).fill(EMPTY), codes: [], counts: [] }
  }

  /* 2. Choose the threads: cluster, then snap each centre to the catalogue. */
  const step = Math.max(1, Math.floor(opaqueCount / SAMPLE_LIMIT))
  const samples: Lab[] = []
  let seen = 0
  for (let p = 0; p < total; p++) {
    if (!opaque[p]) continue
    if (seen++ % step !== 0) continue
    const i = p * 4
    samples.push(rgbToLab(pixels[i], pixels[i + 1], pixels[i + 2]))
  }
  const candidates = chooseThreads(samples, options.maxColors)
  const candidateRgb = candidates.map((index) => hexToRgb(DMC_COLORS[index].hex))

  /* 3. Map every pixel to the closest chosen thread. */
  const cache = new Map<number, number>()
  const closest = (r: number, g: number, b: number): number => {
    const key = (r << 16) | (g << 8) | b
    let hit = cache.get(key)
    if (hit === undefined) {
      const lab = rgbToLab(r, g, b)
      let bestDistance = Infinity
      hit = 0
      for (let c = 0; c < candidates.length; c++) {
        const d = ciede2000(lab, DMC_LAB[candidates[c]])
        if (d < bestDistance) {
          bestDistance = d
          hit = c
        }
      }
      cache.set(key, hit)
    }
    return hit
  }

  const cells = new Int16Array(total).fill(EMPTY)
  if (options.dither) {
    const buffer = new Float32Array(total * 3)
    for (let p = 0; p < total; p++) {
      buffer[p * 3] = pixels[p * 4]
      buffer[p * 3 + 1] = pixels[p * 4 + 1]
      buffer[p * 3 + 2] = pixels[p * 4 + 2]
    }
    const spread = (x: number, y: number, er: number, eg: number, eb: number, f: number) => {
      if (x < 0 || x >= width || y >= height) return
      const q = y * width + x
      if (!opaque[q]) return
      buffer[q * 3] += er * f
      buffer[q * 3 + 1] += eg * f
      buffer[q * 3 + 2] += eb * f
    }
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const p = y * width + x
        if (!opaque[p]) continue
        const r = Math.max(0, Math.min(255, Math.round(buffer[p * 3])))
        const g = Math.max(0, Math.min(255, Math.round(buffer[p * 3 + 1])))
        const b = Math.max(0, Math.min(255, Math.round(buffer[p * 3 + 2])))
        const c = closest(r, g, b)
        cells[p] = c
        const [cr, cg, cb] = candidateRgb[c]
        const er = r - cr
        const eg = g - cg
        const eb = b - cb
        spread(x + 1, y, er, eg, eb, 7 / 16)
        spread(x - 1, y + 1, er, eg, eb, 3 / 16)
        spread(x, y + 1, er, eg, eb, 5 / 16)
        spread(x + 1, y + 1, er, eg, eb, 1 / 16)
      }
    }
  } else {
    for (let p = 0; p < total; p++) {
      if (!opaque[p]) continue
      cells[p] = closest(pixels[p * 4], pixels[p * 4 + 1], pixels[p * 4 + 2])
    }
  }

  /* 4. Optional clean-up of lone stitches and tiny islands. */
  let finalCells = options.cleanup ? removeIsolated(cells, width, height) : cells
  if (options.minRegion > 1) finalCells = removeSmallRegions(finalCells, width, height, options.minRegion)

  return compact(
    width,
    height,
    finalCells,
    candidates.map((index) => DMC_COLORS[index].code),
  )
}

/** A stitch with no same-coloured neighbour takes the majority neighbour value. */
function removeIsolated(cells: Int16Array, width: number, height: number): Int16Array {
  const next = new Int16Array(cells)
  const tally = new Map<number, number>()
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = cells[y * width + x]
      if (v === EMPTY) continue
      tally.clear()
      let alone = true
      let neighbours = 0
      for (let dy = -1; dy <= 1 && alone; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
          const n = cells[ny * width + nx]
          if (n === v) {
            alone = false
            break
          }
          neighbours++
          tally.set(n, (tally.get(n) ?? 0) + 1)
        }
      }
      if (!alone || neighbours === 0) continue
      let best = v
      let bestCount = 0
      for (const [value, count] of tally) {
        if (count > bestCount) {
          bestCount = count
          best = value
        }
      }
      next[y * width + x] = best
    }
  }
  return next
}

/**
 * Which pixels get a stitch: opaque, and not background. With
 * `backgroundFromEdges`, only background reachable from the border is removed,
 * so whites inside the motif (white flowers, gaps between petals) survive.
 */
function opaqueMask(data: ImageData, options: ConversionOptions): Uint8Array {
  const { width, height } = data
  const total = width * height
  const mask = new Uint8Array(total)
  const isBg = new Uint8Array(total)
  const bgLab = rgbToLab(...hexToRgb(options.backgroundColor))
  const tolerance2 = options.tolerance ** 2
  for (let p = 0; p < total; p++) {
    const i = p * 4
    if (data.data[i + 3] < 128) continue
    mask[p] = 1
    if (options.removeBackground) {
      // Original pixel, so colour adjustments do not move the background.
      const lab = rgbToLab(data.data[i], data.data[i + 1], data.data[i + 2])
      if (labDistance2(lab, bgLab) <= tolerance2) isBg[p] = 1
    }
  }
  if (!options.removeBackground) return mask
  if (!options.backgroundFromEdges) {
    for (let p = 0; p < total; p++) if (isBg[p]) mask[p] = 0
    return mask
  }
  // Flood fill the background from the border.
  const queue = new Int32Array(total)
  let head = 0
  let tail = 0
  const push = (p: number) => {
    if (!isBg[p] || !mask[p]) return
    mask[p] = 0
    queue[tail++] = p
  }
  for (let x = 0; x < width; x++) {
    push(x)
    push((height - 1) * width + x)
  }
  for (let y = 0; y < height; y++) {
    push(y * width)
    push(y * width + width - 1)
  }
  while (head < tail) {
    const p = queue[head++]
    const x = p % width
    if (x > 0) push(p - 1)
    if (x < width - 1) push(p + 1)
    if (p >= width) push(p - width)
    if (p < total - width) push(p + width)
  }
  return mask
}

/**
 * Pick at most `maxColors` DMC threads for a set of Lab samples: k-means,
 * snap each centre to the catalogue (ΔE00), then merge threads that are
 * nearly identical (ΔE00 < 3) so the budget goes to genuinely different hues.
 */
function chooseThreads(samples: Lab[], maxColors: number): number[] {
  const k = Math.max(1, Math.min(Math.round(maxColors), 200))
  const centres = kmeans(samples, k)
  // Each centre snaps to its DMC thread once; its weight is how many samples it gathers.
  const dmcOf = centres.map((centre) => nearestDmcIndex00(centre))
  const weight = new Map<number, number>()
  for (const sample of samples) {
    let best = 0
    let bestDistance = Infinity
    for (let c = 0; c < centres.length; c++) {
      const d = labDistance2(sample, centres[c])
      if (d < bestDistance) {
        bestDistance = d
        best = c
      }
    }
    const dmc = dmcOf[best]
    weight.set(dmc, (weight.get(dmc) ?? 0) + 1)
  }
  const ranked = [...weight.entries()].sort((a, b) => b[1] - a[1]).map(([index]) => index)
  const kept: number[] = []
  for (const index of ranked) {
    if (kept.every((other) => ciede2000(DMC_LAB[index], DMC_LAB[other]) >= 3)) kept.push(index)
  }
  return kept
}

/** Per-channel 3×3 median: removes paper / watercolour grain, keeps edges sharp. */
function median3(pixels: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(pixels)
  const window = new Uint8Array(9)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const p = (y * width + x) * 4
      for (let c = 0; c < 3; c++) {
        let n = 0
        for (let dy = -1; dy <= 1; dy++) {
          const row = ((y + dy) * width + x) * 4 + c
          window[n++] = pixels[row - 4]
          window[n++] = pixels[row]
          window[n++] = pixels[row + 4]
        }
        window.sort()
        out[p + c] = window[4]
      }
    }
  }
  return out
}

/** Source pixels per stitch side in illustration mode. */
function workingFactor(width: number, height: number): number {
  return Math.max(1, Math.min(4, Math.floor(1600 / Math.max(width, height))))
}

/**
 * Illustration mode. Colours are chosen on a high-resolution copy (no blended
 * edge colours), every source pixel is mapped to its closest thread, then each
 * stitch takes the majority thread of its area — crisp edges, no invented
 * colours. Thin lines that would lose the vote are kept, and tiny islands
 * melt into their surroundings.
 */
export function convertIllustration(
  source: ImageBitmap,
  width: number,
  height: number,
  adjust: Adjustments,
  options: ConversionOptions,
  crop: CropRect = FULL_CROP,
): ConversionResult {
  const f = workingFactor(width, height)
  const ww = width * f
  const wh = height * f
  const working = sampleImage(source, ww, wh, crop)
  const pixels = median3(adjustPixels(working, adjust), ww, wh)
  const opaque = opaqueMask(working, options)
  const total = width * height

  // 1. Threads, from the high-resolution pixels.
  let opaqueCount = 0
  for (let p = 0; p < opaque.length; p++) opaqueCount += opaque[p]
  if (opaqueCount === 0) {
    return { width, height, cells: new Int16Array(total).fill(EMPTY), codes: [], counts: [] }
  }
  const step = Math.max(1, Math.floor(opaqueCount / SAMPLE_LIMIT))
  const samples: Lab[] = []
  let seen = 0
  for (let p = 0; p < opaque.length; p++) {
    if (!opaque[p] || seen++ % step !== 0) continue
    samples.push(rgbToLab(pixels[p * 4], pixels[p * 4 + 1], pixels[p * 4 + 2]))
  }
  const candidates = chooseThreads(samples, options.maxColors)
  const candidateLab = candidates.map((index) => DMC_LAB[index])

  // 2. Every source pixel → closest thread (cached on 5-bit channels).
  const cache = new Int16Array(1 << 15).fill(-1)
  const labels = new Int16Array(ww * wh).fill(EMPTY)
  for (let p = 0; p < labels.length; p++) {
    if (!opaque[p]) continue
    const i = p * 4
    const key = ((pixels[i] >> 3) << 10) | ((pixels[i + 1] >> 3) << 5) | (pixels[i + 2] >> 3)
    let hit = cache[key]
    if (hit < 0) {
      const lab = rgbToLab((pixels[i] & 0xf8) | 4, (pixels[i + 1] & 0xf8) | 4, (pixels[i + 2] & 0xf8) | 4)
      let bestDistance = Infinity
      hit = 0
      for (let c = 0; c < candidateLab.length; c++) {
        const d = ciede2000(lab, candidateLab[c])
        if (d < bestDistance) {
          bestDistance = d
          hit = c
        }
      }
      cache[key] = hit
    }
    labels[p] = hit
  }

  // 3. Votes per stitch.
  const k = candidates.length
  const votes = new Uint16Array(total * (k + 1)) // last slot = empty
  for (let y = 0; y < wh; y++) {
    const sy = Math.floor(y / f)
    for (let x = 0; x < ww; x++) {
      const v = labels[y * ww + x]
      const cell = sy * width + Math.floor(x / f)
      votes[cell * (k + 1) + (v === EMPTY ? k : v)]++
    }
  }
  const area = f * f
  const cells = new Int16Array(total).fill(EMPTY)
  for (let cell = 0; cell < total; cell++) {
    const base = cell * (k + 1)
    if (votes[base + k] * 2 > area) continue // mostly background
    let best = 0
    for (let c = 1; c < k; c++) if (votes[base + c] > votes[base + best]) best = c
    cells[cell] = best
  }

  // 4. Thin lines: a thread covering ≥ 35 % of a stitch that is rare around it
  //    (a stem, a vein) keeps the stitch instead of losing the vote.
  if (f > 1) {
    const thin = new Int16Array(cells)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = y * width + x
        const base = cell * (k + 1)
        for (let c = 0; c < k; c++) {
          if (c === cells[cell] || votes[base + c] < area * 0.35) continue
          let around = 0
          let aroundArea = 0
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx
              const ny = y + dy
              if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
              around += votes[(ny * width + nx) * (k + 1) + c]
              aroundArea += area
            }
          }
          if (around < aroundArea * 0.2) {
            thin[cell] = c
            break
          }
        }
      }
    }
    cells.set(thin)
  }

  // 5. Tiny islands melt into their surroundings.
  const finalCells = options.minRegion > 1 ? removeSmallRegions(cells, width, height, options.minRegion) : cells
  return compact(width, height, finalCells, candidates.map((index) => DMC_COLORS[index].code))
}

/**
 * Same-colour regions (4-connected) smaller than `minSize` take the colour
 * that borders them most. Empty areas are left alone.
 */
export function removeSmallRegions(cells: Int16Array, width: number, height: number, minSize: number): Int16Array {
  const next = new Int16Array(cells)
  const seen = new Uint8Array(cells.length)
  const stack: number[] = []
  const region: number[] = []
  const border = new Map<number, number>()
  for (let start = 0; start < cells.length; start++) {
    if (seen[start] || cells[start] === EMPTY) continue
    const value = cells[start]
    region.length = 0
    border.clear()
    stack.push(start)
    seen[start] = 1
    while (stack.length > 0) {
      const p = stack.pop()!
      region.push(p)
      const x = p % width
      const neighbours = [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, p - width, p + width]
      for (const n of neighbours) {
        if (n < 0 || n >= width * height) continue
        if (cells[n] === value) {
          if (!seen[n]) {
            seen[n] = 1
            stack.push(n)
          }
        } else {
          border.set(cells[n], (border.get(cells[n]) ?? 0) + 1)
        }
      }
    }
    if (region.length >= minSize || border.size === 0) continue
    let best = value
    let bestCount = 0
    for (const [neighbour, count] of border) {
      if (count > bestCount) {
        bestCount = count
        best = neighbour
      }
    }
    for (const p of region) next[p] = best
  }
  return next
}

/**
 * Drop unused codes, merge duplicate codes and sort by usage. `codes[i]` is
 * the thread for cell value `i`; a `null` code turns those cells empty.
 */
function compact(
  width: number,
  height: number,
  cells: Int16Array,
  codes: (string | null)[],
): ConversionResult {
  const counts = new Map<string, number>()
  for (let i = 0; i < cells.length; i++) {
    const v = cells[i]
    if (v === EMPTY) continue
    const code = codes[v]
    if (code === null) continue
    counts.set(code, (counts.get(code) ?? 0) + 1)
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])
  const order = new Map(sorted.map(([code], index) => [code, index]))
  const remap = codes.map((code) => (code === null ? EMPTY : (order.get(code) ?? EMPTY)))
  const next = new Int16Array(cells.length)
  for (let i = 0; i < cells.length; i++) {
    const v = cells[i]
    next[i] = v === EMPTY ? EMPTY : remap[v]
  }
  return {
    width,
    height,
    cells: next,
    codes: sorted.map(([code]) => code),
    counts: sorted.map(([, count]) => count),
  }
}

/**
 * Swap threads after conversion. A code mapped to another code is merged into
 * it (even when that code is already used); a code mapped to `null` is removed.
 */
export function applyReplacements(
  result: ConversionResult,
  replacements: ReadonlyMap<string, string | null>,
): ConversionResult {
  if (replacements.size === 0) return result
  const codes = result.codes.map((code) =>
    replacements.has(code) ? (replacements.get(code) ?? null) : code,
  )
  return compact(result.width, result.height, result.cells, codes)
}

/** Project palette for a list of codes, each with its own printable symbol. */
export function buildPalette(codes: string[]): Thread[] {
  const palette: Thread[] = []
  for (const code of codes) {
    palette.push({ code, symbol: nextSymbol(palette.map((thread) => thread.symbol)) })
  }
  return palette
}
