import { useEffect, useState } from 'react'
import { isTextEntry } from '../lib/keys'
import { KEYS } from '../lib/platform'
import { t } from '../components/ui.i18n'

export type Modifiers = {
  shift: boolean
  alt: boolean
  mod: boolean
  space: boolean
  /** Other keys held, both as `event.code` and as lowercase `event.key`. */
  keys: ReadonlySet<string>
}

const NO_KEYS: ReadonlySet<string> = new Set()
const NONE: Modifiers = { shift: false, alt: false, mod: false, space: false, keys: NO_KEYS }


const MODIFIER_KEYS = new Set(['Shift', 'Alt', 'Meta', 'Control', 'AltGraph'])

/**
 * Which keys are held right now, so the hints can light up the shortcut being
 * used. Everything is released when the window loses focus (otherwise a key
 * released elsewhere would stay "stuck").
 */
export function useModifiers(): Modifiers {
  const [state, setState] = useState<Modifiers>(NONE)

  useEffect(() => {
    const update = (event: KeyboardEvent) => {
      const down = event.type === 'keydown'
      const typing = isTextEntry(event.target)
      setState((current) => {
        let keys = current.keys
        if (!MODIFIER_KEYS.has(event.key) && !typing) {
          const next = new Set(keys)
          for (const id of [event.code, event.key.toLowerCase()]) {
            if (down) next.add(id)
            else next.delete(id)
          }
          keys = next
        }
        // macOS sends no keyup for keys released while ⌘ is held.
        if (!down && event.key === 'Meta') keys = NO_KEYS
        const space = event.code === 'Space' && !typing ? down : current.space
        const next: Modifiers = {
          shift: event.shiftKey,
          alt: event.altKey,
          mod: event.metaKey || event.ctrlKey,
          space,
          keys,
        }
        const same =
          next.shift === current.shift &&
          next.alt === current.alt &&
          next.mod === current.mod &&
          next.space === current.space &&
          next.keys.size === current.keys.size &&
          [...next.keys].every((k) => current.keys.has(k))
        return same ? current : next
      })
    }
    const release = () => setState(NONE)
    window.addEventListener('keydown', update)
    window.addEventListener('keyup', update)
    window.addEventListener('blur', release)
    return () => {
      window.removeEventListener('keydown', update)
      window.removeEventListener('keyup', update)
      window.removeEventListener('blur', release)
    }
  }, [])

  return state
}

/** Keyboard ids a hint key stands for (empty for mouse actions). */
function idsFor(token: string): string[] {
  if (token.startsWith('code:')) return [token.slice(5)]
  // Key names shown in the session's language (see Kbd) are understood too.
  if (token === t.keys.enter) return ['enter']
  if (token === t.keys.escape) return ['escape']
  if (token === KEYS.del) return ['delete', 'backspace']
  if (token === t.keys.drag || token === t.keys.click || token === t.keys.wheel) return []
  switch (token) {
    case 'Entrée':
      return ['enter']
    case 'Échap':
      return ['escape']
    case 'Suppr':
    case '⌫ Effacer':
      return ['delete', 'backspace']
    case '↑↓←→':
      return ['arrowup', 'arrowdown', 'arrowleft', 'arrowright']
    case 'shift':
    case 'alt':
    case 'mod':
    case 'space':
    case 'clic':
    case 'glisser':
    case 'molette':
      return []
    default:
      return [token.toLowerCase()]
  }
}

/** True while one of the hint's (non-modifier) keys is held. */
export function anyKeyHeld(tokens: string[], keys: ReadonlySet<string>): boolean {
  if (keys.size === 0) return false
  return tokens.some((token) => idsFor(token).some((id) => keys.has(id)))
}
