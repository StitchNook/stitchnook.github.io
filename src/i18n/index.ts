/**
 * Interface language.
 *
 * Fixed for the whole session: chosen once at start-up (saved choice, else the
 * system languages, else English). Changing it saves the choice and reloads
 * the page — the autosave flushes on `pagehide` — so every text, including
 * module-level constants and non-React helpers, simply reads `LANG`.
 *
 * Texts live next to the code that shows them, as one `messages()` call per
 * module: French first (the reference shape), then the other languages, which
 * TypeScript checks key by key against the French.
 */

export const LANGS = ['fr', 'en', 'es', 'de'] as const
export type Lang = (typeof LANGS)[number]

/** Name of each language in itself, for the language picker. */
export const LANG_NAMES: Record<Lang, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
}

const STORAGE_KEY = 'stitchly.lang.v1'

const isLang = (value: unknown): value is Lang => LANGS.includes(value as Lang)

function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isLang(saved)) return saved
  } catch {
    /* Storage blocked: fall through to the system languages. */
  }
  if (typeof navigator !== 'undefined') {
    const wanted = navigator.languages?.length ? navigator.languages : [navigator.language]
    for (const tag of wanted) {
      const base = tag?.toLowerCase().split('-')[0]
      if (isLang(base)) return base
    }
  }
  return 'en'
}

/** Language of this session. */
export const LANG: Lang = detectLang()

/** BCP 47 locale for numbers, dates and case-insensitive comparisons. */
export const LOCALE = ({ fr: 'fr-FR', en: 'en-US', es: 'es-ES', de: 'de-DE' } as const)[LANG]

if (typeof document !== 'undefined') document.documentElement.lang = LANG

/** Save the choice and reload in that language. */
export function setLang(lang: Lang): void {
  if (lang === LANG) return
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    return
  }
  window.location.reload()
}

/**
 * The texts of one module in the session's language. `fr` is the reference:
 * every other language must provide exactly the same keys and signatures.
 *
 *   const t = messages({ save: 'Enregistrer', count: (n: number) => `${n} fils` }, {
 *     en: { save: 'Save', count: (n) => `${n} threads` }, es: {…}, de: {…},
 *   })
 */
export function messages<T extends object>(fr: T, others: Record<Exclude<Lang, 'fr'>, NoInfer<Widen<T>>>): Widen<T> {
  return (LANG === 'fr' ? fr : others[LANG]) as Widen<T>
}

/** The French shape with string literals widened, so other languages may differ. */
type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => infer R
    ? (...args: A) => R extends string ? string : R
    : T extends object
      ? { [K in keyof T]: Widen<T[K]> }
      : T

/** Pick one value per language (for anything that is not a text table). */
export function byLang<T>(values: Record<Lang, T>): T {
  return values[LANG]
}

/** Number formatted for the session's language (thousands separators, decimals). */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return value.toLocaleString(LOCALE, options)
}

/** "1 fil" / "3 fils": picks the form for `count` with the language's plural rules. */
const pluralRules = new Intl.PluralRules(LOCALE)
export function plural(count: number, forms: { one: string; other: string }): string {
  return pluralRules.select(count) === 'one' ? forms.one : forms.other
}
