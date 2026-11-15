import { t } from './platform.i18n'

/**
 * Keyboard labels that match the user's OS: ⌘ / ⌥ / ⇧ on a Mac,
 * Ctrl / Alt / Maj elsewhere. The handlers already accept both (metaKey or
 * ctrlKey; altKey is the Option key on a Mac); only the wording differs.
 */
export const IS_MAC =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)

/** Running inside the desktop (Electron) app rather than a browser tab. */
export const IS_ELECTRON = typeof navigator !== 'undefined' && /Electron/i.test(navigator.userAgent)

/** Modifier names for running text ("⌥ Option + glisser"). */
export const KEYS = IS_MAC ? t.mac : t.pc

const MAC_GLYPH: Record<string, string> = { mod: '⌘', alt: '⌥', shift: '⇧' }
const PC_NAME: Record<string, string> = { mod: t.pc.mod, alt: t.pc.alt, shift: t.pc.shift }

/** A key combination: shortcut('mod', 'Z') is "⌘Z" on a Mac, "Ctrl+Z" elsewhere. */
export function shortcut(...keys: string[]): string {
  return IS_MAC
    ? keys.map((key) => MAC_GLYPH[key] ?? key).join('')
    : keys.map((key) => PC_NAME[key] ?? key).join('+')
}
