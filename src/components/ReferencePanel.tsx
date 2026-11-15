import { useRef, useState } from 'react'
import { Crop, Eye, EyeOff, ImagePlus, Maximize, Move, Trash2 } from 'lucide-react'
import type { Reference } from '../lib/reference'
import { Button, Panel, RangeField, SegmentedControl } from './ui'
import { HintChip } from './ui'
import { t } from './ReferencePanel.i18n'

/** Image to trace by hand: opacity, under / over the stitches, placement. */
export function ReferencePanel(props: {
  reference: Reference | null
  error: string | null
  editing: boolean
  onEditingChange: (editing: boolean) => void
  onLoad: (file: File) => void
  onChange: (reference: Reference) => void
  onFit: () => void
  onCrop: () => void
  onRemove: () => void
}) {
  const { reference } = props
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  return (
    <Panel
      title={t.title}
      icon={<ImagePlus size={14} />}
      actions={
        reference ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => props.onChange({ ...reference, visible: !reference.visible })}
            title={reference.visible ? t.hide : t.show}
          >
            {reference.visible ? <Eye size={13} /> : <EyeOff size={13} />}
          </Button>
        ) : null
      }
    >
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) props.onLoad(file)
        }}
      />
      {!reference ? (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            const file = event.dataTransfer.files[0]
            if (file) props.onLoad(file)
          }}
          className={`w-full rounded-md border border-dashed px-3 py-4 text-center text-[11px] ${
            dragging ? 'border-sky-500 bg-sky-500/10 text-sky-300' : 'border-panel-line text-slate-400 hover:border-slate-400'
          }`}
        >
          {t.drop}
        </button>
      ) : (
        <div className="space-y-2.5">
          <RangeField
            label={t.opacity}
            min={5}
            max={100}
            value={Math.round(reference.opacity * 100)}
            defaultValue={50}
            format={t.percent}
            onChange={(n) => props.onChange({ ...reference, opacity: n / 100 })}
          />
          <SegmentedControl<'under' | 'over'>
            value={reference.above ? 'over' : 'under'}
            onChange={(v) => props.onChange({ ...reference, above: v === 'over' })}
            options={[
              { value: 'under', label: t.under, title: t.underTitle },
              { value: 'over', label: t.over, title: t.overTitle },
            ]}
          />
          <div className="grid grid-cols-2 gap-1.5">
            <Button
              size="sm"
              variant={props.editing ? 'primary' : 'default'}
              onClick={() => props.onEditingChange(!props.editing)}
              title={t.placeTitle}
            >
              <Move size={13} /> {props.editing ? t.done : t.place}
            </Button>
            <Button size="sm" onClick={props.onFit} title={t.fitTitle}>
              <Maximize size={13} /> {t.fit}
            </Button>
            <Button size="sm" onClick={props.onCrop}>
              <Crop size={13} /> {t.crop}
            </Button>
            <Button size="sm" variant="danger" onClick={props.onRemove}>
              <Trash2 size={13} /> {t.remove}
            </Button>
          </div>
          {props.editing ? (
            <p className="text-[11px] text-sky-300">
              {t.editingHelp}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-1">
            <HintChip keys={['H']} label={t.toggleHint} />
            <HintChip keys={['shift']} label={t.shiftHint} />
          </div>
        </div>
      )}
      {props.error ? <p className="mt-2 text-[11px] text-amber-300">{props.error}</p> : null}
      <p className="mt-2 text-[10px] text-slate-500">
        {t.note}
      </p>
    </Panel>
  )
}
