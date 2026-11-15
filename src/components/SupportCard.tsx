import { Heart } from 'lucide-react'
import { KOFI_URL } from '../lib/support'
import { markSupporter, markTipped, type SupportMoment } from '../lib/supportPrompt'
import { Button } from './ui'
import { t } from './SupportCard.i18n'

/** Suggests a tip right after the app helped; same place and look as the welcome card. */
export function SupportCard(props: { moment: SupportMoment; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-labelledby="support-card-title"
      className="no-print fixed right-4 bottom-12 z-[60] w-80 rounded-xl border border-rose-500/50 bg-panel p-3 shadow-2xl"
    >
      <p id="support-card-title" className="flex items-center gap-1.5 text-sm font-medium text-slate-100">
        <Heart size={14} className="fill-rose-500 text-rose-500" /> {t.title[props.moment]}
      </p>
      <p className="mt-1 text-xs text-slate-400">{t.body}</p>
      <div className="mt-2.5 flex items-center gap-1.5">
        <button
          type="button"
          className="mr-auto text-[11px] text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline"
          onClick={() => {
            markSupporter()
            props.onClose()
          }}
        >
          {t.already}
        </button>
        <Button size="sm" variant="ghost" onClick={props.onClose}>
          {t.later}
        </Button>
        <a
          href={KOFI_URL}
          target="_blank"
          rel="noopener"
          className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-500"
          onClick={() => {
            markTipped()
            props.onClose()
          }}
        >
          {t.tip}
        </a>
      </div>
    </div>
  )
}
