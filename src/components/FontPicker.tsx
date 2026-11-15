import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Monitor, Search } from 'lucide-react'
import {
  CATEGORY_LABELS,
  GOOGLE_CATALOGUE,
  loadRecentFonts,
  previewFont,
  pushRecentFont,
  systemFont,
  type FontCategory,
  type FontOption,
} from '../lib/fonts'
import { canListAllFonts, probeCommonFonts, queryAllFonts } from '../lib/systemFonts'
import { Button, TextInput } from './ui'
import { t } from './FontPicker.i18n'

const ROW = 30
const VISIBLE = 9
const FILTERS: (FontCategory | 'all' | 'recent')[] = [
  'all',
  'recent',
  'pixel',
  'sans',
  'serif',
  'display',
  'handwriting',
  'mono',
  'system',
]
const FILTER_LABELS: Record<string, string> = { all: t.all, recent: t.recent, ...CATEGORY_LABELS }

/**
 * Searchable picker over the whole Google Fonts catalogue plus the fonts
 * installed on this computer. Every name is drawn in its own face; only the
 * rows on screen fetch their (tiny, name-only) preview stylesheet.
 */
export function FontPicker(props: { value: string; onChange: (family: string) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all')
  const [scrollTop, setScrollTop] = useState(0)
  const [recent, setRecent] = useState(loadRecentFonts)
  const [system, setSystem] = useState<string[] | null>(null)
  const [systemFull, setSystemFull] = useState(false)


  const all = useMemo<FontOption[]>(() => {
    const local = (system ?? []).map(systemFont)
    return [...GOOGLE_CATALOGUE, ...local]
  }, [system])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list: FontOption[]
    if (filter === 'recent') {
      list = recent.map((family) => all.find((font) => font.family === family) ?? systemFont(family))
    } else if (filter === 'all') {
      list = all
    } else {
      list = all.filter((font) => font.category === filter)
    }
    return q ? list.filter((font) => font.family.toLowerCase().includes(q)) : list
  }, [all, filter, query, recent])

  const first = Math.max(0, Math.floor(scrollTop / ROW) - 2)
  const slice = results.slice(first, first + VISIBLE + 4)

  useEffect(() => {
    for (const font of slice) previewFont(font)
  }, [slice])

  const choose = (family: string) => {
    props.onChange(family)
    setRecent(pushRecentFont(family))
    setOpen(false)
  }

  const listAllSystemFonts = async () => {
    const fonts = await queryAllFonts()
    if (fonts) {
      setSystem(fonts)
      setSystemFull(true)
    }
    setFilter('system')
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => {
          // Probing installed fonts measures text, so it only runs once needed.
          if (!open && system === null) setSystem(probeCommonFonts())
          setOpen(!open)
        }}
        className="flex w-full items-center gap-2 rounded-md border border-panel-line bg-panel-soft px-2.5 py-1.5 text-left text-sm text-slate-100 hover:border-slate-500"
      >
        <span className="flex-1 truncate" style={{ fontFamily: `"${props.value}", sans-serif` }}>
          {props.value}
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="space-y-1.5 rounded-md border border-panel-line bg-panel-soft/60 p-1.5">
          <div className="relative">
            <Search size={13} className="absolute top-2.5 left-2.5 text-slate-500" />
            <TextInput
              autoFocus
              value={query}
              placeholder={t.search(all.length)}
              onChange={(event) => {
                setQuery(event.target.value)
                setScrollTop(0)
              }}
              className="pl-8"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {FILTERS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setFilter(key)
                  setScrollTop(0)
                }}
                className={`rounded-full px-2 py-0.5 text-[10px] ${
                  filter === key ? 'bg-sky-600 text-white' : 'bg-panel-line/60 text-slate-300 hover:bg-panel-line'
                }`}
              >
                {FILTER_LABELS[key]}
              </button>
            ))}
          </div>

          {filter === 'system' && canListAllFonts && !systemFull ? (
            <Button size="sm" className="w-full" onClick={() => void listAllSystemFonts()}>
              <Monitor size={13} /> {t.listInstalled}
            </Button>
          ) : null}

          <div
            className="overflow-y-auto rounded border border-panel-line bg-panel"
            style={{ height: ROW * VISIBLE }}
            onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
          >
            {results.length === 0 ? (
              <p className="p-3 text-center text-[11px] text-slate-500">
                {filter === 'recent' ? t.noRecent : t.noneFound}
              </p>
            ) : (
              <div style={{ height: results.length * ROW, position: 'relative' }}>
                {slice.map((font, i) => (
                  <button
                    key={`${font.source}:${font.family}`}
                    type="button"
                    onClick={() => choose(font.family)}
                    className={`absolute inset-x-0 flex items-center gap-2 px-2 text-left hover:bg-panel-line/60 ${
                      font.family === props.value ? 'bg-sky-600/25' : ''
                    }`}
                    style={{ top: (first + i) * ROW, height: ROW }}
                    title={`${font.family} — ${CATEGORY_LABELS[font.category]}`}
                  >
                    <span
                      className="flex-1 truncate text-[15px] text-slate-100"
                      style={{ fontFamily: `"${font.family}", sans-serif` }}
                    >
                      {font.family}
                    </span>
                    <span className="shrink-0 text-[9px] text-slate-500 uppercase">
                      {CATEGORY_LABELS[font.category]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-[10px] text-slate-500">
            {t.footer(results.length)}
          </p>
        </div>
      ) : null}
    </div>
  )
}
