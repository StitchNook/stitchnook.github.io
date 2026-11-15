import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { HELP_SECTIONS } from '../lib/help'
import { t } from '../lib/help.i18n'
import { Modal, TextInput } from './ui'

/** Searchable help: table of contents on the left, the chosen topic on the right. */
export function HelpCenter(props: { initialSection?: string; onClose: () => void }) {
  const [current, setCurrent] = useState(props.initialSection ?? HELP_SECTIONS[0].id)
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return HELP_SECTIONS
    return HELP_SECTIONS.filter((section) =>
      `${section.title} ${section.keywords}`.toLowerCase().includes(q),
    )
  }, [query])

  const shown = results.find((section) => section.id === current) ?? results[0]

  return (
    <Modal xl fill title={t.center.title} onClose={props.onClose}>
      {/* Contents and article scroll independently. */}
      <div className="flex h-full min-h-0 gap-5">
        <nav className="flex w-60 shrink-0 flex-col gap-2">
          <div className="relative">
            <Search size={13} className="absolute top-2.5 left-2.5 text-slate-500" />
            <TextInput
              autoFocus
              value={query}
              placeholder={t.center.search}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                // The search box has focus at first; Escape still closes.
                if (event.key === 'Escape') props.onClose()
              }}
              className="pl-8"
            />
          </div>
          <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
            {results.map((section) => (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => setCurrent(section.id)}
                  className={`w-full rounded px-2 py-1.5 text-left text-xs ${
                    section.id === shown?.id
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-300 hover:bg-panel-soft'
                  } ${section.id.startsWith('tool-') ? 'pl-4' : 'font-medium'}`}
                >
                  {section.title}
                </button>
              </li>
            ))}
            {results.length === 0 ? (
              <li className="px-2 py-3 text-xs text-slate-500">{t.center.noMatch}</li>
            ) : null}
          </ul>
        </nav>
        <article className="min-h-0 min-w-0 flex-1 overflow-y-auto border-l border-panel-line pr-2 pl-5 text-sm text-slate-300">
          {shown ? (
            <>
              <h2 className="mb-3 text-lg font-semibold text-slate-100">{shown.title}</h2>
              {shown.body}
            </>
          ) : null}
        </article>
      </div>
    </Modal>
  )
}
