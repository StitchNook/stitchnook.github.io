import GOOGLE_FONTS from '../data/googleFonts.json'
import { t } from './fonts.i18n'

export type FontCategory = 'pixel' | 'sans' | 'serif' | 'display' | 'handwriting' | 'mono' | 'system'

export type FontOption = {
  /** CSS font-family name, also used in the Google Fonts request. */
  family: string
  category: FontCategory
  /** Weights available for this family. */
  weights: number[]
  italic: boolean
  source: 'google' | 'system'
}

export const CATEGORY_LABELS: Record<FontCategory, string> = t.categories

/** Bitmap-ish faces that stay crisp at a handful of stitches tall. */
const PIXEL_FAMILIES = new Set([
  'Press Start 2P',
  'Silkscreen',
  'VT323',
  'Pixelify Sans',
  'Tiny5',
  'Micro 5',
  'Jersey 10',
  'Handjet',
  'DotGothic16',
  'Workbench',
  'Sixtyfour',
  'Bungee Hairline',
])

type RawFont = { f: string; c: string; w: number[]; i: number }

/** Whole Google Fonts catalogue (see scripts/update-google-fonts.mjs), by popularity. */
export const GOOGLE_CATALOGUE: FontOption[] = (GOOGLE_FONTS as RawFont[]).map((font) => ({
  family: font.f,
  category: PIXEL_FAMILIES.has(font.f) ? 'pixel' : (font.c as FontCategory),
  weights: font.w,
  italic: font.i === 1,
  source: 'google',
}))

const byFamily = new Map(GOOGLE_CATALOGUE.map((font) => [font.family, font]))

export const DEFAULT_FAMILY = 'Press Start 2P'

export function systemFont(family: string): FontOption {
  return { family, category: 'system', weights: [400, 700], italic: true, source: 'system' }
}

/** Resolve a family name to a font; unknown names are treated as installed fonts. */
export function findFont(family: string): FontOption {
  return byFamily.get(family) ?? systemFont(family)
}

/** Nearest available weight, so switching fonts never asks for a missing face. */
export function closestWeight(font: FontOption, weight: number): number {
  return font.weights.reduce((best, w) => (Math.abs(w - weight) < Math.abs(best - weight) ? w : best))
}

const requested = new Set<string>()
const previewed = new Set<string>()

function familyParam(family: string) {
  return encodeURIComponent(family).replace(/%20/g, '+')
}

function addStylesheet(href: string) {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

/** Full stylesheet of a family, so the canvas can draw any character with it. */
function injectStylesheet(font: FontOption) {
  if (font.source !== 'google' || requested.has(font.family)) return
  requested.add(font.family)
  const axes = font.italic
    ? `ital,wght@${[0, 1].flatMap((ital) => font.weights.map((w) => `${ital},${w}`)).join(';')}`
    : `wght@${font.weights.join(';')}`
  addStylesheet(`https://fonts.googleapis.com/css2?family=${familyParam(font.family)}:${axes}&display=swap`)
}

/**
 * Tiny stylesheet holding only the letters of the family's name, so the font
 * picker can show every name in its own face without downloading whole fonts.
 */
export function previewFont(font: FontOption) {
  if (font.source !== 'google' || previewed.has(font.family) || requested.has(font.family)) return
  previewed.add(font.family)
  addStylesheet(
    `https://fonts.googleapis.com/css2?family=${familyParam(font.family)}&text=${encodeURIComponent(font.family)}&display=swap`,
  )
}

/**
 * Make a family usable by `canvas.fillText`. Resolves even when the network is
 * unavailable: the caller then rasterises with the fallback face instead of
 * hanging on a font that will never arrive.
 */
export async function ensureFont(font: FontOption, weight: number, italic = false, size = 64): Promise<boolean> {
  const spec = `${italic ? 'italic ' : ''}${weight} ${size}px "${font.family}"`
  if (font.source === 'system') return document.fonts.check(spec)
  injectStylesheet(font)
  try {
    await Promise.race([
      document.fonts.load(spec),
      new Promise((resolve) => setTimeout(resolve, 4000)),
    ])
    return document.fonts.check(spec)
  } catch {
    return false
  }
}

/* ------------------------------------------------------- recent fonts */

const RECENT_KEY = 'stitchly.recentFonts.v1'

export function loadRecentFonts(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function pushRecentFont(family: string): string[] {
  const next = [family, ...loadRecentFonts().filter((f) => f !== family)].slice(0, 12)
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    /* Storage unavailable: recents just won't persist. */
  }
  return next
}
