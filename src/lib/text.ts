import { EMPTY, createCells } from './grid'
import type { Patch } from './types'
import { LOCALE } from '../i18n'

export type TextAlign = 'left' | 'center' | 'right'

export type TextRasterOptions = {
  family: string
  weight: number
  /** Cap height target, in stitches. Drives the rasterisation resolution. */
  size: number
  italic: boolean
  /** Extra stitches between glyphs, may be negative. */
  letterSpacing: number
  /** Alpha cut-off in [0, 1]; higher keeps only the solid core of a glyph. */
  threshold: number
  lineGap: number
  align?: TextAlign
  uppercase?: boolean
  underline?: boolean
  strike?: boolean
  /** −100 (curved down, like a smile) … 0 (straight) … 100 (arched up). */
  arc?: number
}

export type TextRaster = {
  mask: Uint8Array
  width: number
  height: number
}

/**
 * Supersampling factor. Glyphs are drawn several times larger than the target
 * stitch grid, then each stitch samples the average coverage of its block.
 * This keeps thin strokes from vanishing at small sizes.
 */
const OVERSAMPLE = 6

const EMPTY_RASTER: TextRaster = { mask: new Uint8Array(0), width: 0, height: 0 }

/**
 * Render text to a boolean stitch mask.
 *
 * The glyphs go on an offscreen canvas at `OVERSAMPLE` times the requested
 * stitch size; every stitch then averages the alpha of the pixels it covers
 * and is kept when that average clears `threshold`. Cropping to the inked
 * bounding box means the caller receives a patch with no dead margin.
 */
export function rasterizeText(input: string, options: TextRasterOptions): TextRaster {
  const text = options.uppercase ? input.toLocaleUpperCase(LOCALE) : input
  const lines = text.split('\n')
  if (lines.every((line) => line.length === 0)) return EMPTY_RASTER

  const stitchSize = Math.max(3, Math.round(options.size))
  const px = stitchSize * OVERSAMPLE
  const spacing = options.letterSpacing * OVERSAMPLE
  const lineHeight = Math.round(px * 1.25) + options.lineGap * OVERSAMPLE
  const align = options.align ?? 'center'
  const arc = Math.max(-100, Math.min(100, options.arc ?? 0))
  const curved = Math.abs(arc) >= 1
  // Decorations scale with the text, never thinner than one stitch.
  const rule = Math.max(OVERSAMPLE, Math.round(px * 0.08))

  const measure = document.createElement('canvas').getContext('2d')
  if (!measure) return EMPTY_RASTER
  const fontSpec = `${options.italic ? 'italic ' : ''}${options.weight} ${px}px "${options.family}", sans-serif`
  measure.font = fontSpec

  // letterSpacing is not universally supported, so advance glyph by glyph.
  const advances = lines.map((line) => [...line].map((char) => measure.measureText(char).width))
  const lineWidths = advances.map((list) =>
    Math.max(0, list.reduce((sum, w) => sum + w + spacing, 0) - spacing),
  )
  const maxWidth = Math.max(...lineWidths, 1)

  // Arc: the line's length is laid along a circle spanning up to 180°.
  const span = (Math.abs(arc) / 100) * Math.PI
  const sagitta = (width: number) => {
    if (!curved || width === 0) return 0
    const radius = width / span
    return radius * (1 - Math.cos(span / 2))
  }
  const bend = Math.ceil(Math.max(...lineWidths.map(sagitta), 0))

  const pad = Math.ceil(px * 0.6) + rule
  const canvasW = Math.ceil(maxWidth) + pad * 2
  const canvasH = lineHeight * lines.length + bend + pad * 2
  if (canvasW * canvasH > 64e6) return EMPTY_RASTER

  const canvas = document.createElement('canvas')
  canvas.width = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return EMPTY_RASTER

  ctx.font = fontSpec
  ctx.fillStyle = '#000'
  ctx.strokeStyle = '#000'
  ctx.lineWidth = rule
  ctx.textBaseline = 'alphabetic'

  lines.forEach((line, row) => {
    const width = lineWidths[row]
    const chars = [...line]
    // Arched-down text dips at the ends, so its baseline moves down by the bend.
    const baseline = pad + lineHeight * row + px + (arc < 0 ? bend : 0)

    if (!curved) {
      const free = canvasW - pad * 2 - width
      let x = pad + (align === 'left' ? 0 : align === 'right' ? free : free / 2)
      const start = x
      ctx.textAlign = 'left'
      chars.forEach((char, i) => {
        ctx.fillText(char, x, baseline)
        x += advances[row][i] + spacing
      })
      if (options.underline) ctx.fillRect(start, baseline + rule, width, rule)
      if (options.strike) ctx.fillRect(start, baseline - px * 0.32 - rule / 2, width, rule)
      return
    }

    // Each glyph sits on the circle, rotated along its tangent.
    const radius = width / span
    const centreX = canvasW / 2
    const up = arc > 0
    const centreY = up ? baseline + radius : baseline - radius
    ctx.textAlign = 'center'
    let s = 0
    chars.forEach((char, i) => {
      const advance = advances[row][i]
      const angle = (s + advance / 2 - width / 2) / radius
      ctx.save()
      if (up) {
        ctx.translate(centreX + radius * Math.sin(angle), centreY - radius * Math.cos(angle))
        ctx.rotate(angle)
      } else {
        ctx.translate(centreX + radius * Math.sin(angle), centreY + radius * Math.cos(angle))
        ctx.rotate(-angle)
      }
      ctx.fillText(char, 0, 0)
      ctx.restore()
      s += advance + spacing
    })
    const decorate = (offset: number) => {
      ctx.beginPath()
      if (up) ctx.arc(centreX, centreY, radius - offset, -Math.PI / 2 - span / 2, -Math.PI / 2 + span / 2)
      else ctx.arc(centreX, centreY, radius + offset, Math.PI / 2 - span / 2, Math.PI / 2 + span / 2)
      ctx.stroke()
    }
    if (options.underline) decorate(-rule * 1.5)
    if (options.strike) decorate(px * 0.32)
  })

  const image = ctx.getImageData(0, 0, canvasW, canvasH).data
  const gridW = Math.ceil(canvasW / OVERSAMPLE)
  const gridH = Math.ceil(canvasH / OVERSAMPLE)
  const coverage = new Float32Array(gridW * gridH)
  const samples = new Uint16Array(gridW * gridH)

  for (let y = 0; y < canvasH; y++) {
    const gy = (y / OVERSAMPLE) | 0
    for (let x = 0; x < canvasW; x++) {
      const gx = (x / OVERSAMPLE) | 0
      const at = gy * gridW + gx
      coverage[at] += image[(y * canvasW + x) * 4 + 3] / 255
      samples[at]++
    }
  }

  const cut = Math.min(0.98, Math.max(0.02, options.threshold))
  const full = new Uint8Array(gridW * gridH)
  for (let i = 0; i < full.length; i++) {
    if (samples[i] > 0 && coverage[i] / samples[i] >= cut) full[i] = 1
  }
  return cropMask(full, gridW, gridH)
}

function cropMask(full: Uint8Array, gridW: number, gridH: number): TextRaster {
  let minX = gridW
  let minY = gridH
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      if (!full[y * gridW + x]) continue
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }
  if (maxX < 0) return EMPTY_RASTER
  const width = maxX - minX + 1
  const height = maxY - minY + 1
  const mask = new Uint8Array(width * height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) mask[y * width + x] = full[(minY + y) * gridW + (minX + x)]
  }
  return { mask, width, height }
}

/* ------------------------------------------------------------- effects */

/** One thread per layer; a negative index leaves that layer out. */
export type TextLayers = {
  text: number
  outline: { width: number; thread: number }
  shadow: { dx: number; dy: number; thread: number }
  frame: { padding: number; width: number; thread: number }
}

/**
 * Turn the text mask into a multi-thread patch with outline, drop shadow and
 * frame. Effects are computed on the stitch grid, after rasterisation, so they
 * are exactly as many stitches wide as asked.
 */
export function composeText(raster: TextRaster, layers: TextLayers): Patch | null {
  if (raster.width === 0 || layers.text < 0) return null
  const outlineW = layers.outline.thread >= 0 ? Math.max(0, Math.round(layers.outline.width)) : 0
  const { dx, dy } = layers.shadow
  const shadowOn = layers.shadow.thread >= 0 && (dx !== 0 || dy !== 0)
  const frameW = layers.frame.thread >= 0 ? Math.max(0, Math.round(layers.frame.width)) : 0
  const framePad = Math.max(0, Math.round(layers.frame.padding))

  const margin = outlineW + (shadowOn ? Math.max(Math.abs(dx), Math.abs(dy)) : 0) + (frameW ? framePad + frameW : 0)
  const w = raster.width + margin * 2
  const h = raster.height + margin * 2
  const at = (x: number, y: number) => y * w + x

  const text = new Uint8Array(w * h)
  for (let y = 0; y < raster.height; y++) {
    for (let x = 0; x < raster.width; x++) {
      if (raster.mask[y * raster.width + x]) text[at(x + margin, y + margin)] = 1
    }
  }

  // Outline: every stitch within `outlineW` of the text (round-ish dilation).
  const outline = new Uint8Array(w * h)
  if (outlineW > 0) {
    const r2 = (outlineW + 0.5) ** 2
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!text[at(x, y)]) continue
        for (let oy = -outlineW; oy <= outlineW; oy++) {
          for (let ox = -outlineW; ox <= outlineW; ox++) {
            if (ox * ox + oy * oy > r2) continue
            const tx = x + ox
            const ty = y + oy
            if (tx < 0 || ty < 0 || tx >= w || ty >= h || text[at(tx, ty)]) continue
            outline[at(tx, ty)] = 1
          }
        }
      }
    }
  }

  // Shadow: text and outline together, shifted, behind both.
  const shadow = new Uint8Array(w * h)
  if (shadowOn) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!text[at(x, y)] && !outline[at(x, y)]) continue
        const tx = x + dx
        const ty = y + dy
        if (tx < 0 || ty < 0 || tx >= w || ty >= h) continue
        if (!text[at(tx, ty)] && !outline[at(tx, ty)]) shadow[at(tx, ty)] = 1
      }
    }
  }

  const cells = createCells(w, h)
  for (let i = 0; i < cells.length; i++) {
    if (text[i]) cells[i] = layers.text
    else if (outline[i]) cells[i] = layers.outline.thread
    else if (shadow[i]) cells[i] = layers.shadow.thread
  }

  // Frame: a rectangle around everything inked so far.
  if (frameW > 0) {
    let minX = w
    let minY = h
    let maxX = -1
    let maxY = -1
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (cells[at(x, y)] === EMPTY) continue
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
    const x0 = minX - framePad - frameW
    const y0 = minY - framePad - frameW
    const x1 = maxX + framePad + frameW
    const y1 = maxY + framePad + frameW
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const inside = x >= x0 + frameW && x <= x1 - frameW && y >= y0 + frameW && y <= y1 - frameW
        if (!inside && x >= 0 && y >= 0 && x < w && y < h) cells[at(x, y)] = layers.frame.thread
      }
    }
  }

  // Crop to the stitches actually used.
  const used = new Uint8Array(w * h)
  for (let i = 0; i < cells.length; i++) used[i] = cells[i] === EMPTY ? 0 : 1
  let minX = w
  let minY = h
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!used[at(x, y)]) continue
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }
  if (maxX < 0) return null
  const cw = maxX - minX + 1
  const ch = maxY - minY + 1
  const out = createCells(cw, ch)
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) out[y * cw + x] = cells[at(minX + x, minY + y)]
  }
  return { width: cw, height: ch, cells: out }
}
