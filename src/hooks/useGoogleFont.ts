import { useEffect, useState } from 'react'
import { ensureFont, findFont } from '../lib/fonts'

export type FontStatus = 'loading' | 'ready' | 'fallback'

/**
 * Load a font so the canvas can rasterise with it: fetched from Google Fonts,
 * or checked locally for an installed face. Resolves to `fallback` when the
 * family never arrives (offline, blocked request), which lets the caller still
 * draw text with the system face.
 */
export function useGoogleFont(family: string, weight: number, italic = false): FontStatus {
  // Results are memoised per face, so switching back to an already loaded
  // font reports `ready` immediately instead of flashing `loading`.
  const [resolved, setResolved] = useState<Record<string, boolean>>({})
  const key = `${family}:${weight}:${italic ? 'i' : 'n'}`

  useEffect(() => {
    let cancelled = false
    void ensureFont(findFont(family), weight, italic).then((ok) => {
      if (!cancelled) setResolved((current) => ({ ...current, [key]: ok }))
    })
    return () => {
      cancelled = true
    }
  }, [family, italic, key, weight])

  if (!(key in resolved)) return 'loading'
  return resolved[key] ? 'ready' : 'fallback'
}
