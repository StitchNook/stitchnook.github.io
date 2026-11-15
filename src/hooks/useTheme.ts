import { useEffect, useState } from 'react'

export type ThemeChoice = 'light' | 'dark' | 'auto'
export type Theme = 'light' | 'dark'

/** Also read by the inline script in index.html, to avoid a flash on load. */
const THEME_KEY = 'stitchly.theme.v1'

function readChoice(): ThemeChoice {
  try {
    const value = localStorage.getItem(THEME_KEY)
    return value === 'light' || value === 'dark' ? value : 'auto'
  } catch {
    return 'auto'
  }
}

const systemQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

/**
 * Light / dark / auto (follows the operating system, live). Sets
 * `data-theme` on <html>, which the CSS tokens in index.css key off.
 */
export function useTheme() {
  const [choice, setChoiceState] = useState<ThemeChoice>(readChoice)
  const [systemDark, setSystemDark] = useState(() => systemQuery().matches)

  useEffect(() => {
    const query = systemQuery()
    const onChange = () => setSystemDark(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const theme: Theme = choice === 'auto' ? (systemDark ? 'dark' : 'light') : choice

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const setChoice = (next: ThemeChoice) => {
    setChoiceState(next)
    try {
      if (next === 'auto') localStorage.removeItem(THEME_KEY)
      else localStorage.setItem(THEME_KEY, next)
    } catch {
      /* Storage unavailable: the choice lasts for this session only. */
    }
  }

  return { choice, theme, setChoice }
}
