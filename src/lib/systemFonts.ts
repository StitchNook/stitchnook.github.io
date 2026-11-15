/**
 * Fonts installed on the computer. Chromium (Chrome, Edge, Electron) can list
 * them all through the Local Font Access API after a one-time permission;
 * elsewhere, a list of common faces is probed with `document.fonts.check`.
 */

const COMMON = [
  'Arial',
  'Arial Black',
  'Avenir',
  'Avenir Next',
  'Baskerville',
  'Calibri',
  'Cambria',
  'Candara',
  'Century Gothic',
  'Comic Sans MS',
  'Consolas',
  'Constantia',
  'Copperplate',
  'Corbel',
  'Courier New',
  'Didot',
  'Franklin Gothic Medium',
  'Futura',
  'Garamond',
  'Geneva',
  'Georgia',
  'Gill Sans',
  'Helvetica',
  'Helvetica Neue',
  'Impact',
  'Lucida Console',
  'Lucida Grande',
  'Marker Felt',
  'Menlo',
  'Monaco',
  'Optima',
  'Palatino',
  'Papyrus',
  'Segoe Print',
  'Segoe Script',
  'Segoe UI',
  'Snell Roundhand',
  'Tahoma',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana',
]

type LocalFontData = { family: string }
type WindowWithFonts = Window & { queryLocalFonts?: () => Promise<LocalFontData[]> }

export const canListAllFonts = typeof window !== 'undefined' && 'queryLocalFonts' in window

/**
 * A face counts as installed when the browser stops falling back for it:
 * measuring against two different generic fallbacks catches false positives.
 */
function isInstalled(family: string): boolean {
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return false
  const sample = 'mmmmmmmmmlli WQ@#'
  const width = (font: string) => {
    ctx.font = font
    return ctx.measureText(sample).width
  }
  for (const generic of ['monospace', 'serif']) {
    if (width(`72px "${family}", ${generic}`) !== width(`72px ${generic}`)) return true
  }
  return false
}

/** Common faces actually present on this computer (no permission needed). */
export function probeCommonFonts(): string[] {
  return COMMON.filter(isInstalled)
}

/** Every installed family, or null when the API is missing or refused. */
export async function queryAllFonts(): Promise<string[] | null> {
  const query = (window as WindowWithFonts).queryLocalFonts
  if (!query) return null
  try {
    const fonts = await query()
    return [...new Set(fonts.map((font) => font.family))].sort((a, b) => a.localeCompare(b))
  } catch {
    return null
  }
}
