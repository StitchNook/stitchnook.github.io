import { Heart } from 'lucide-react'
import { KOFI_URL, SUPPORT_ENABLED } from '../lib/support'
import { markSupporter, type SupportMoment } from '../lib/supportPrompt'
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
      <div className="mt-2.5 flex items-center justify-end gap-1.5">
        <Button size="sm" variant="ghost" className="whitespace-nowrap" onClick={props.onClose}>
          {t.later}
        </Button>
        <a
          href={KOFI_URL}
          target="_blank"
          rel="noopener"
          className="flex items-center gap-1.5 whitespace-nowrap rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
          onClick={() => {
            markSupporter()
            props.onClose()
          }}
        >
          <Heart size={12} className="fill-white" /> {t.tip}
        </a>
      </div>
      <button
        type="button"
        className="mt-1.5 block w-full text-right text-[11px] text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline"
        onClick={() => {
          markSupporter()
          props.onClose()
        }}
      >
        {t.already}
      </button>
    </div>
  )
}

/** Small "Support" pill (Ko-fi), for window footers. Nothing in the desktop app. */
export function SupportButton(props: { pushRight?: boolean }) {
  if (!SUPPORT_ENABLED) return null
  return (
    <a
      href={KOFI_URL}
      target="_blank"
      rel="noopener"
      title={t.buttonTitle}
      onClick={() => markSupporter()}
      className={`${props.pushRight === false ? '' : 'mr-auto '}flex items-center gap-1.5 self-center rounded-full border border-rose-500/50 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-500/20`}
    >
      <Heart size={13} className="fill-rose-500 text-rose-500" /> {t.button}
    </a>
  )
}
