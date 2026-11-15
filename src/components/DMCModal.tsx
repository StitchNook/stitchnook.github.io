import { useMemo, useState } from 'react'
import { Check, Minus, Search } from 'lucide-react'
import { nearestDmc, readableInk, searchDmc } from '../lib/dmc'
import type { SortMode } from '../lib/dmc'
import { Button, Modal, SegmentedControl, TextInput } from './ui'
import { t } from './DMCModal.i18n'

export type DMCModalProps = {
  paletteCodes: Set<string>
  onPick: (code: string) => void
  /**
   * When set, the grid works as a toggle: clicking a reference that is
   * already in the palette removes it instead of picking it again.
   */
  onRemove?: (code: string) => void
  onClose: () => void
  /** Defaults to the catalogue name; used e.g. for « Remplacer DMC 310 par… ». */
  title?: string
}

/** Full DMC catalogue browser: search, sort, and a colour-matching helper. */
export function DMCModal(props: DMCModalProps) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortMode>('hue')
  const [sample, setSample] = useState('#7aa6d8')

  const results = useMemo(() => searchDmc(query, sort), [query, sort])
  const match = useMemo(() => nearestDmc(sample), [sample])

  return (
    <Modal
      wide
      title={props.title ?? t.title}
      onClose={props.onClose}
      footer={
        <>
          <span className="mr-auto text-xs text-slate-500">
            {t.footer(results.length, props.paletteCodes.size)}
          </span>
          <Button onClick={props.onClose}>{t.close}</Button>
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="relative min-w-56 flex-1">
          <Search size={14} className="absolute top-2.5 left-2.5 text-slate-500" />
          <TextInput
            autoFocus
            value={query}
            placeholder={t.searchPlaceholder}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-8"
          />
        </div>
        <div className="w-44">
          <SegmentedControl
            value={sort}
            onChange={setSort}
            options={[
              { value: 'hue', label: t.byHue },
              { value: 'code', label: t.byCode },
            ]}
          />
        </div>
        <div className="flex items-center gap-2 rounded-md border border-panel-line bg-panel-soft px-2 py-1.5">
          <label className="flex items-center gap-2 text-xs text-slate-400">
            {t.match}
            <input
              type="color"
              value={sample}
              onChange={(event) => setSample(event.target.value)}
              className="h-6 w-8 cursor-pointer rounded border border-panel-line bg-transparent"
            />
          </label>
          <Button size="sm" onClick={() => props.onPick(match.code)}>
            <span
              className="mr-1 inline-block h-3 w-3 rounded-sm border border-black/30"
              style={{ background: match.hex }}
            />
            DMC {match.code}
          </Button>
        </div>
      </div>

      {results.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">{t.noResults}</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(94px,1fr))] gap-1.5">
          {results.map((color) => {
            const inPalette = props.paletteCodes.has(color.code)
            const removable = inPalette && props.onRemove !== undefined
            return (
              <button
                key={color.code}
                type="button"
                title={
                  removable
                    ? t.removeTitle(color.code, color.name)
                    : `DMC ${color.code} — ${color.name}`
                }
                onClick={() =>
                  removable ? props.onRemove?.(color.code) : props.onPick(color.code)
                }
                className={`group relative rounded-md border p-1.5 text-left transition ${
                  removable
                    ? 'border-sky-500 ring-1 ring-sky-500/40 hover:border-red-500 hover:ring-red-500/40'
                    : inPalette
                      ? 'border-sky-500 ring-1 ring-sky-500/40'
                      : 'border-panel-line hover:border-slate-400'
                }`}
              >
                <span
                  className="flex h-9 w-full items-center justify-center rounded border border-black/20"
                  style={{ background: color.hex, color: readableInk(color.hex) }}
                >
                  {removable ? (
                    <>
                      <Check size={14} className="group-hover:hidden" />
                      <Minus size={16} strokeWidth={3} className="hidden group-hover:block" />
                    </>
                  ) : inPalette ? (
                    <Check size={14} />
                  ) : null}
                </span>
                <span className="mt-1 block text-[11px] font-semibold text-slate-100">
                  {color.code}
                </span>
                <span className="block truncate text-[10px] text-slate-400">{color.name}</span>
              </button>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
