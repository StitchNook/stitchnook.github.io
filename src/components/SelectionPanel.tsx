import { useState, type KeyboardEvent } from 'react'
import {
  Clipboard,
  Copy,
  FlipHorizontal,
  FlipVertical,
  LibraryBig,
  RotateCw,
  Scissors,
  SquareDashed,
  Trash2,
} from 'lucide-react'
import { Button, Disclosure, HintChip, NumberField, Panel, Section } from './ui'
import type { EditorApi } from '../hooks/useEditor'
import { KEYS } from '../lib/platform'
import { t } from './SelectionPanel.i18n'

export function SelectionPanel({ editor, onSaveAsMotif }: { editor: EditorApi; onSaveAsMotif?: () => void }) {
  const { selection, floating, clipboard } = editor
  const size = floating
    ? { w: floating.width, h: floating.height }
    : selection
      ? { w: selection.w, h: selection.h }
      : null
  // Proportions come from the original motif, so repeated edits never drift.
  const ratio = floating
    ? floating.base.height / floating.base.width
    : size
      ? size.h / size.w
      : 1

  const [keepRatio, setKeepRatio] = useState(true)

  const hasSource = size !== null

  // NumberField keeps what is typed; each valid value resizes live, the other
  // side following the original motif's proportions (no drift).
  const changeWidth = (w: number) => {
    if (!size) return
    editor.resizeFloating(w, keepRatio ? Math.max(1, Math.round(w * ratio)) : size.h)
  }
  const changeHeight = (h: number) => {
    if (!size) return
    editor.resizeFloating(keepRatio ? Math.max(1, Math.round(h / ratio)) : size.w, h)
  }

  // Global shortcuts ignore inputs, so Enter / Escape are handled here too.
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && floating) {
      event.preventDefault()
      editor.commitFloating()
    } else if (event.key === 'Escape' && floating) {
      event.preventDefault()
      editor.cancelFloating()
    }
  }

  return (
    <Panel title={t.title} icon={<SquareDashed size={14} />}>
      <div className="space-y-2.5">
        {floating ? null : (
          <p className="text-[11px] text-slate-500">
            {selection
              ? t.area(selection.w, selection.h, selection.x, selection.y)
              : t.empty}
          </p>
        )}

        <Section title={t.clipboard}>
          <div className="grid grid-cols-2 gap-1.5">
            <Button size="sm" onClick={editor.copy} disabled={!hasSource}>
              <Copy size={13} /> {t.copy}
            </Button>
            <Button size="sm" onClick={editor.cut} disabled={!hasSource}>
              <Scissors size={13} /> {t.cut}
            </Button>
            <Button size="sm" onClick={editor.paste} disabled={!clipboard || floating !== null}>
              <Clipboard size={13} /> {t.paste}
            </Button>
            <Button size="sm" variant="danger" onClick={editor.deleteSelection} disabled={!hasSource}>
              <Trash2 size={13} /> {t.erase}
            </Button>
          </div>
          {onSaveAsMotif ? (
            <Button
              size="sm"
              className="w-full"
              onClick={onSaveAsMotif}
              disabled={!hasSource}
              title={t.saveMotifTitle}
            >
              <LibraryBig size={13} /> {t.saveMotif}
            </Button>
          ) : null}
        </Section>

        <Section title={t.transform}>
          <div className="grid grid-cols-5 gap-1.5">
            <Button size="sm" onClick={editor.flipHorizontal} disabled={!hasSource} title={t.flipH}>
              <FlipHorizontal size={13} />
            </Button>
            <Button size="sm" onClick={editor.flipVertical} disabled={!hasSource} title={t.flipV}>
              <FlipVertical size={13} />
            </Button>
            <Button size="sm" onClick={editor.rotate} disabled={!hasSource} title={t.rotate}>
              <RotateCw size={13} />
            </Button>
            <Button size="sm" disabled={!hasSource} onClick={() => editor.rescale(0.5)} title={t.halve}>
              ÷2
            </Button>
            <Button size="sm" disabled={!hasSource} onClick={() => editor.rescale(2)} title={t.double}>
              ×2
            </Button>
          </div>
        </Section>

        <Section title={t.sizeSection}>
          <div className="flex items-center gap-2">
            <NumberField
              className="flex-1"
              min={1}
              max={600}
              value={size?.w ?? 1}
              disabled={!hasSource}
              onChange={changeWidth}
              onKeyDown={onKeyDown}
              aria-label={t.widthAria}
            />
            <span className="text-xs text-slate-500">×</span>
            <NumberField
              className="flex-1"
              min={1}
              max={600}
              value={size?.h ?? 1}
              disabled={!hasSource}
              onChange={changeHeight}
              onKeyDown={onKeyDown}
              aria-label={t.heightAria}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-[11px] text-slate-400">
            <input
              type="checkbox"
              className="h-3.5 w-3.5"
              checked={keepRatio}
              onChange={(event) => setKeepRatio(event.target.checked)}
            />
            {t.keepRatio}
          </label>
        </Section>

        <div className="border-t border-panel-line/60 pt-2.5">
          <Disclosure title={t.shortcuts} storageKey="selection.shortcuts" defaultOpen={false}>
            <div className="flex flex-wrap gap-x-1 gap-y-1">
              <HintChip keys={['shift', 'glisser']} label={t.hints.addArea} />
              <HintChip keys={['alt', 'glisser']} label={t.hints.removeArea} />
              <HintChip keys={['↑↓←→']} label={t.hints.move} />
              <HintChip keys={['shift', '↑↓←→']} label={t.hints.by10} />
              <HintChip keys={['shift']} label={t.hints.keepAligned} />
              <HintChip keys={['shift']} label={t.hints.freeSize} />
              <HintChip keys={['Entrée']} label={t.hints.apply} />
              <HintChip keys={['Échap']} label={t.hints.cancel} />
              <HintChip keys={['mod', 'A']} label={t.hints.all} />
              <HintChip keys={['mod', 'D']} label={t.hints.deselect} />
              <HintChip keys={['mod', 'C']} label={t.hints.copy} />
              <HintChip keys={['mod', 'V']} label={t.hints.paste} />
              <HintChip keys={[KEYS.del]} label={t.hints.erase} />
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
              {t.handles}
            </p>
          </Disclosure>
        </div>
      </div>
    </Panel>
  )
}
