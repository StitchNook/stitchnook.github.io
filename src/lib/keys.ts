/**
 * Shortcuts on symbol keys follow the key's physical position (`event.code`),
 * so they stay one keystroke on every layout: the two keys right of P are
 * `[ ]` in QWERTY and `^ $` in French AZERTY. The typed character still works
 * as a fallback. Letters (B, E, ⌘Z…) keep using the character: they exist,
 * unmodified, on every layout.
 */

export type Shortcut = { codes: string[]; keys: string[] }

export const SHORTCUT_KEYS = {
  brushSmaller: { codes: ['BracketLeft'], keys: ['['] },
  brushBigger: { codes: ['BracketRight'], keys: [']'] },
  zoomIn: { codes: ['Equal', 'NumpadAdd'], keys: ['+', '='] },
  zoomOut: { codes: ['Minus', 'NumpadSubtract'], keys: ['-'] },
} satisfies Record<string, Shortcut>

export function matches(event: KeyboardEvent, shortcut: Shortcut): boolean {
  return shortcut.codes.includes(event.code) || shortcut.keys.includes(event.key)
}

/* ------------------------------------------------- labels of the layout */

/** Hint token for a physical key, e.g. "code:BracketLeft". */
export const codeToken = (code: string) => `code:${code}`

const FALLBACK: Record<string, string> = {
  BracketLeft: '[',
  BracketRight: ']',
  Equal: '=',
  Minus: '-',
}

let layout: Map<string, string> | null = null
const listeners = new Set<() => void>()

type KeyboardWithLayout = { getLayoutMap?: () => Promise<Map<string, string>> }

// Chromium (Chrome, Edge, Electron) can tell what each physical key prints
// with the active layout. Elsewhere the QWERTY fallback is shown.
if (typeof navigator !== 'undefined') {
  const keyboard = (navigator as Navigator & { keyboard?: KeyboardWithLayout }).keyboard
  void keyboard
    ?.getLayoutMap?.()
    .then((map) => {
      layout = new Map(map)
      for (const listener of listeners) listener()
    })
    .catch(() => {
      /* Not allowed here (e.g. in an iframe): keep the fallback. */
    })
}

export function subscribeLayout(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function layoutVersion(): Map<string, string> | null {
  return layout
}

/** What the user's keyboard prints on this physical key. */
export function keyLabel(code: string): string {
  return layout?.get(code) ?? FALLBACK[code] ?? code
}

/** True once the real layout is known (otherwise labels are QWERTY guesses). */
export function layoutKnown(): boolean {
  return layout !== null
}

const TEXT_INPUTS = new Set(['text', 'search', 'email', 'url', 'tel', 'password', 'number'])

/**
 * Whether keystrokes belong to a field (typing text, choosing in a list)
 * rather than to the app's shortcuts. Sliders, checkboxes and buttons do not
 * count: keeping focus after a click on them must not disable the shortcuts.
 * Shared by the shortcut handler and the hint highlighting, so both agree.
 */
export function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return true
  return target instanceof HTMLInputElement && TEXT_INPUTS.has(target.type)
}
