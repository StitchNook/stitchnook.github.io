import { useSyncExternalStore } from 'react'
import { layoutVersion, subscribeLayout } from '../lib/keys'

/**
 * Re-render once the keyboard layout is known, so physical-key labels switch
 * from the QWERTY guess to what the user's keys actually print.
 */
export function useKeyLayout(): void {
  useSyncExternalStore(subscribeLayout, layoutVersion, () => null)
}
