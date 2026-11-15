import { DMC_BY_CODE, DMC_COLORS, DMC_FRENCH_NAMES } from '../data/dmc'
import { LOCALE } from '../i18n'
import { t } from './dmc.i18n'
import type { DmcColor } from './types'

export { DMC_BY_CODE, DMC_COLORS }

/** The catalogue entry for a code, or a neutral grey placeholder. */
export function dmcByCode(code: string): DmcColor {
  return DMC_BY_CODE.get(code) ?? { code, name: t.unknown, hex: '#808080' }
}

export function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ]
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0)
  else if (max === gn) h = (bn - rn) / d + 2
  else h = (rn - gn) / d + 4
  return [h * 60, s, l]
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex)
  const channel = (c: number) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** Black or white, whichever stays readable on top of `hex`. */
export function readableInk(hex: string): string {
  return relativeLuminance(hex) > 0.45 ? '#111827' : '#f8fafc'
}

/** Catalogue order, but grouped by hue so the picker reads like a colour wheel. */
export const DMC_BY_HUE: DmcColor[] = [...DMC_COLORS].sort((a, b) => {
  const [ha, sa, la] = rgbToHsl(...hexToRgb(a.hex))
  const [hb, sb, lb] = rgbToHsl(...hexToRgb(b.hex))
  // Near-greys have a meaningless hue, so park them at the end by lightness.
  const greyA = sa < 0.12
  const greyB = sb < 0.12
  if (greyA !== greyB) return greyA ? 1 : -1
  if (greyA && greyB) return la - lb
  const bucketA = Math.round(ha / 12)
  const bucketB = Math.round(hb / 12)
  if (bucketA !== bucketB) return bucketA - bucketB
  return la - lb
})

export type SortMode = 'code' | 'hue'

const DMC_BY_CODE_ORDER: DmcColor[] = [...DMC_COLORS].sort((a, b) => {
  const na = Number(a.code)
  const nb = Number(b.code)
  if (Number.isNaN(na) && Number.isNaN(nb)) return a.code.localeCompare(b.code)
  if (Number.isNaN(na)) return -1
  if (Number.isNaN(nb)) return 1
  return na - nb
})

/** Lower-cased, accent-free text, so « ecru » finds « Écru ». */
function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase(LOCALE)
}

/** What a query is matched against: code, name in the interface language, French name. */
const SEARCH_TEXT = new Map(
  DMC_COLORS.map((c) => [c.code, fold(`${c.code}\n${c.name}\n${DMC_FRENCH_NAMES.get(c.code) ?? ''}`)]),
)

/** Catalogue filtered by a free-text query on the code or the name (current language or French). */
export function searchDmc(query: string, sort: SortMode): DmcColor[] {
  const source = sort === 'hue' ? DMC_BY_HUE : DMC_BY_CODE_ORDER
  const q = fold(query.trim())
  if (!q) return source
  return source.filter((c) => SEARCH_TEXT.get(c.code)?.includes(q))
}

/** Closest catalogue entry to an arbitrary colour, by squared RGB distance. */
export function nearestDmc(hex: string): DmcColor {
  const [r, g, b] = hexToRgb(hex)
  let best = DMC_COLORS[0]
  let bestDistance = Infinity
  for (const color of DMC_COLORS) {
    const [cr, cg, cb] = hexToRgb(color.hex)
    const distance = (cr - r) ** 2 + (cg - g) ** 2 + (cb - b) ** 2
    if (distance < bestDistance) {
      bestDistance = distance
      best = color
    }
  }
  return best
}

/* ---------------------------------------------------------------- Lab space
 * Perceptual distances: RGB distance badly over-weights greens and under-
 * weights darks, which makes photo conversion pick odd threads.
 */

export type Lab = [number, number, number]

const SRGB_TO_LINEAR = new Float64Array(256)
for (let i = 0; i < 256; i++) {
  const v = i / 255
  SRGB_TO_LINEAR[i] = v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

function labF(t: number): number {
  return t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116
}

/** sRGB (0–255 channels) to CIE L*a*b* under D65. */
export function rgbToLab(r: number, g: number, b: number): Lab {
  const lr = SRGB_TO_LINEAR[Math.max(0, Math.min(255, Math.round(r)))]
  const lg = SRGB_TO_LINEAR[Math.max(0, Math.min(255, Math.round(g)))]
  const lb = SRGB_TO_LINEAR[Math.max(0, Math.min(255, Math.round(b)))]
  const x = (lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375) / 0.95047
  const y = lr * 0.2126729 + lg * 0.7151522 + lb * 0.072175
  const z = (lr * 0.0193339 + lg * 0.119192 + lb * 0.9503041) / 1.08883
  const fx = labF(x)
  const fy = labF(y)
  const fz = labF(z)
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

export function labDistance2(a: Lab, b: Lab): number {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
}

/** Catalogue colours in Lab, aligned with `DMC_COLORS`. */
export const DMC_LAB: Lab[] = DMC_COLORS.map((color) => rgbToLab(...hexToRgb(color.hex)))

/**
 * Index (into `DMC_COLORS`) of the closest catalogue entry, optionally
 * restricted to a subset of catalogue indices.
 */
export function nearestDmcIndex(lab: Lab, candidates?: readonly number[]): number {
  let best = -1
  let bestDistance = Infinity
  const count = candidates ? candidates.length : DMC_LAB.length
  for (let k = 0; k < count; k++) {
    const i = candidates ? candidates[k] : k
    const distance = labDistance2(lab, DMC_LAB[i])
    if (distance < bestDistance) {
      bestDistance = distance
      best = i
    }
  }
  return best
}

/**
 * CIEDE2000 colour difference (ΔE00). Much closer to what the eye sees than
 * plain Lab distance, notably for blues, greens and dark tones.
 */
export function ciede2000(a: Lab, b: Lab): number {
  const [L1, a1, b1] = a
  const [L2, a2, b2] = b
  const rad = Math.PI / 180
  const C1 = Math.hypot(a1, b1)
  const C2 = Math.hypot(a2, b2)
  const Cm = (C1 + C2) / 2
  const G = 0.5 * (1 - Math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)))
  const a1p = (1 + G) * a1
  const a2p = (1 + G) * a2
  const C1p = Math.hypot(a1p, b1)
  const C2p = Math.hypot(a2p, b2)
  const h1p = C1p === 0 ? 0 : (Math.atan2(b1, a1p) / rad + 360) % 360
  const h2p = C2p === 0 ? 0 : (Math.atan2(b2, a2p) / rad + 360) % 360
  const dLp = L2 - L1
  const dCp = C2p - C1p
  let dhp = 0
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p
    if (dhp > 180) dhp -= 360
    else if (dhp < -180) dhp += 360
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * rad)
  const Lpm = (L1 + L2) / 2
  const Cpm = (C1p + C2p) / 2
  let hpm = h1p + h2p
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) > 180) hpm += h1p + h2p < 360 ? 360 : -360
    hpm /= 2
  }
  const T =
    1 -
    0.17 * Math.cos((hpm - 30) * rad) +
    0.24 * Math.cos(2 * hpm * rad) +
    0.32 * Math.cos((3 * hpm + 6) * rad) -
    0.2 * Math.cos((4 * hpm - 63) * rad)
  const dTheta = 30 * Math.exp(-(((hpm - 275) / 25) ** 2))
  const Rc = 2 * Math.sqrt(Cpm ** 7 / (Cpm ** 7 + 25 ** 7))
  const Sl = 1 + (0.015 * (Lpm - 50) ** 2) / Math.sqrt(20 + (Lpm - 50) ** 2)
  const Sc = 1 + 0.045 * Cpm
  const Sh = 1 + 0.015 * Cpm * T
  const Rt = -Math.sin(2 * dTheta * rad) * Rc
  return Math.sqrt(
    (dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh),
  )
}

/** Closest catalogue entry by ΔE00 (index into `DMC_COLORS`). */
export function nearestDmcIndex00(lab: Lab, candidates?: readonly number[]): number {
  let best = -1
  let bestDistance = Infinity
  const count = candidates ? candidates.length : DMC_LAB.length
  for (let k = 0; k < count; k++) {
    const i = candidates ? candidates[k] : k
    const distance = ciede2000(lab, DMC_LAB[i])
    if (distance < bestDistance) {
      bestDistance = distance
      best = i
    }
  }
  return best
}
