import { Check, Eye, History, X } from 'lucide-react'
import { Button } from './ui'
import { floatingModified, type EditorApi } from '../hooks/useEditor'
import { t } from './PreviewActions.i18n'

/**
 * The only place in the tool panel to validate, reset or cancel the pending
 * preview (pasted motif, lifted selection, text). Sticks to the bottom of the
 * panel so it stays reachable while scrolling through long settings.
 */
export function PreviewActions(props: {
  editor: EditorApi
  /** Text tool without a preview: offer to show it again. */
  restore?: { disabled: boolean; onRestore: () => void }
}) {
  const { floating } = props.editor
  if (!floating && !props.restore) return null

  return (
    <div className="sticky bottom-0 z-10 border-t border-panel-line bg-panel px-3 py-2.5">
      {floating ? (
        <>
          <p className="mb-2 text-[11px] text-sky-300">
            {t.pending(floating.width, floating.height)}
          </p>
          <div className="grid grid-cols-[1fr_auto_auto] gap-1.5">
            <Button size="sm" variant="primary" onClick={props.editor.commitFloating} title={t.applyTitle}>
              <Check size={13} /> {t.apply}
            </Button>
            <Button
              size="sm"
              onClick={props.editor.resetFloating}
              disabled={!floatingModified(floating)}
              title={t.resetTitle}
            >
              <History size={13} /> {t.reset}
            </Button>
            <Button size="sm" variant="danger" onClick={props.editor.cancelFloating} title={t.cancelTitle}>
              <X size={13} />
            </Button>
          </div>
        </>
      ) : props.restore ? (
        <Button
          size="sm"
          className="w-full"
          onClick={props.restore.onRestore}
          disabled={props.restore.disabled}
          title={t.restoreTitle}
        >
          <Eye size={13} /> {t.restore}
        </Button>
      ) : null}
    </div>
  )
}
