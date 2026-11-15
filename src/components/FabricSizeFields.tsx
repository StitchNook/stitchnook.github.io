import { useState, type ReactNode } from 'react'
import { MAX_SIZE, MIN_SIZE, clampSize } from '../lib/grid'
import {
  FABRIC_PRESETS,
  formatLength,
  physicalToStitches,
  stitchesPerCm,
  stitchesToPhysical,
} from '../lib/units'
import { Link2, Unlink2 } from 'lucide-react'
import { Field, NumberField, SegmentedControl } from './ui'
import type { Fabric, Unit } from '../lib/types'
import { formatNumber } from '../i18n'
import { t } from './FabricSizeFields.i18n'

export type FabricSizeFieldsProps = {
  fabric: Fabric
  onFabricChange: (fabric: Fabric) => void
  width: number
  height: number
  /** Receive an already clamped stitch count. */
  onWidthChange: (width: number) => void
  onHeightChange: (height: number) => void
  /** Rendered under the dimension inputs. */
  extra?: ReactNode
  /** When provided, a lock between width and height links them (keep ratio). */
  linked?: boolean
  onLinkedChange?: (linked: boolean) => void
}

/** Fabric count, physical/stitch dimensions and the finished-size summary. */
export function FabricSizeFields(props: FabricSizeFieldsProps) {
  const { fabric, width, height } = props
  const perCm = stitchesPerCm(fabric)
  const unit = fabric.displayUnit
  const physicalWidth = stitchesToPhysical(width, fabric)
  const physicalHeight = stitchesToPhysical(height, fabric)

  // The length the user asked for (typed, or reached with ↑ / ↓) is what the
  // length field shows, as long as the stitch count it produced is unchanged.
  // Stitches stay whole, so the exact length may differ slightly: the
  // finished-size summary below always gives the real one.
  type Wish = { stitches: number; length: number; unit: Unit; perCm: number }
  const [asked, setAsked] = useState<{ w?: Wish; h?: Wish }>({})
  const shownLength = (axis: 'w' | 'h') => {
    const stitches = axis === 'w' ? width : height
    const wish = asked[axis]
    return wish && wish.stitches === stitches && wish.unit === unit && wish.perCm === perCm
      ? wish.length
      : stitchesToPhysical(stitches, fabric)
  }

  const setStitches = (axis: 'w' | 'h', stitches: number) => {
    if (axis === 'w') props.onWidthChange(stitches)
    else props.onHeightChange(stitches)
  }
  const setPhysical = (axis: 'w' | 'h', value: number) => {
    if (!Number.isFinite(value) || value <= 0) return
    const stitches = clampSize(physicalToStitches(value, unit, fabric))
    setAsked((current) => ({ ...current, [axis]: { stitches, length: value, unit, perCm } }))
    setStitches(axis, stitches)
  }
  /**
   * ↑ / ↓ on a length: go to the next round measure (0.5 cm or ¼ inch) that
   * really changes the stitch count, so a step never seems stuck.
   */
  const LENGTH_STEP = unit === 'cm' ? 0.5 : 0.25
  const nudgeLength = (axis: 'w' | 'h') => (direction: 1 | -1, big: boolean) => {
    const current = axis === 'w' ? width : height
    const step = LENGTH_STEP * (big ? 10 : 1)
    let length = shownLength(axis)
    // Next round measure; keep going until the stitch count actually moves.
    for (let guard = 0; guard < 200; guard++) {
      length =
        direction > 0
          ? Math.floor(length / step + 1e-6) * step + step
          : Math.ceil(length / step - 1e-6) * step - step
      if (length <= 0) return
      const next = clampSize(physicalToStitches(length, unit, fabric))
      if (next !== current) {
        setAsked((wishes) => ({ ...wishes, [axis]: { stitches: next, length, unit, perCm } }))
        setStitches(axis, next)
        return
      }
      if (next === MIN_SIZE || next === MAX_SIZE) return
    }
  }

  const presetValue = FABRIC_PRESETS.findIndex(
    (preset) =>
      preset.fabric.count === fabric.count && preset.fabric.countUnit === fabric.countUnit,
  )

  return (
    <>
      <div className="rounded-lg border border-panel-line bg-panel-soft/50 p-3">
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">{t.fabric}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t.preset}>
            <select
              value={presetValue >= 0 ? presetValue : ''}
              onChange={(event) => {
                const preset = FABRIC_PRESETS[Number(event.target.value)]
                if (preset) props.onFabricChange({ ...fabric, ...preset.fabric })
              }}
              className="w-full rounded-md border border-panel-line bg-panel-soft px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-sky-500"
            >
              <option value="">{t.custom}</option>
              {FABRIC_PRESETS.map((preset, index) => (
                <option key={preset.label} value={index}>
                  {preset.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.density} hint={t.densityHint(formatNumber(perCm, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}>
            <div className="flex flex-wrap gap-2">
              <NumberField
                className="min-w-24 flex-1"
                min={1}
                max={60}
                step={0.5}
                decimals={2}
                value={fabric.count}
                onChange={(count) => props.onFabricChange({ ...fabric, count })}
                aria-label={t.densityLabel}
              />
              <div className="w-32 shrink-0">
                <SegmentedControl<Unit>
                  value={fabric.countUnit}
                  onChange={(countUnit) => props.onFabricChange({ ...fabric, countUnit })}
                  options={[
                    { value: 'in', label: t.perInch },
                    { value: 'cm', label: '/ cm' },
                  ]}
                />
              </div>
            </div>
          </Field>
        </div>
      </div>

      <div className="rounded-lg border border-panel-line bg-panel-soft/50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
            {t.dimensions}
          </h3>
          <div className="w-32">
            <SegmentedControl<Unit>
              value={unit}
              onChange={(displayUnit) => props.onFabricChange({ ...fabric, displayUnit })}
              options={[
                { value: 'cm', label: 'cm' },
                { value: 'in', label: t.inches },
              ]}
            />
          </div>
        </div>

        {/* Width | lock | height. Stitches are the source of truth; lengths derive from them. */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-x-2 gap-y-3">
          <Field label={t.width(unit === 'cm' ? 'cm' : t.inches)}>
            <NumberField
              min={0.1}
              max={stitchesToPhysical(MAX_SIZE, fabric)}
              decimals={1}
              value={shownLength('w')}
              onChange={(value) => setPhysical('w', value)}
              nudge={nudgeLength('w')}
              suffix={unit === 'cm' ? 'cm' : t.inchShort}
              aria-label={t.widthLength}
            />
          </Field>
          <LinkButton linked={props.linked} onChange={props.onLinkedChange} />
          <Field label={t.height(unit === 'cm' ? 'cm' : t.inches)}>
            <NumberField
              min={0.1}
              max={stitchesToPhysical(MAX_SIZE, fabric)}
              decimals={1}
              value={shownLength('h')}
              onChange={(value) => setPhysical('h', value)}
              nudge={nudgeLength('h')}
              suffix={unit === 'cm' ? 'cm' : t.inchShort}
              aria-label={t.heightLength}
            />
          </Field>
          <Field label={t.widthStitches}>
            <NumberField
              min={MIN_SIZE}
              max={MAX_SIZE}
              value={width}
              onChange={(value) => props.onWidthChange(clampSize(value))}
              suffix={t.stitchUnit}
              aria-label={t.widthStitchesLabel}
            />
          </Field>
          <LinkButton linked={props.linked} onChange={props.onLinkedChange} />
          <Field label={t.heightStitches}>
            <NumberField
              min={MIN_SIZE}
              max={MAX_SIZE}
              value={height}
              onChange={(value) => props.onHeightChange(clampSize(value))}
              suffix={t.stitchUnit}
              aria-label={t.heightStitchesLabel}
            />
          </Field>
        </div>
        {props.extra ? <div className="mt-2">{props.extra}</div> : null}
      </div>

      <div className="rounded-lg border border-sky-700/50 bg-sky-500/10 p-3 text-sm">
        <p className="font-medium text-sky-200">
          {t.finished(width, height, `${formatLength(physicalWidth, unit)} × ${formatLength(physicalHeight, unit)}`)}
        </p>
        <p className="mt-1 text-xs text-sky-300/80">
          {t.margin(
            `${formatLength(physicalWidth + (unit === 'cm' ? 10 : 4), unit)} × ${formatLength(physicalHeight + (unit === 'cm' ? 10 : 4), unit)}`,
          )}
        </p>
      </div>
    </>
  )
}

/** Keep-ratio lock between the width and height fields (hidden when unused). */
function LinkButton(props: { linked?: boolean; onChange?: (linked: boolean) => void }) {
  if (props.linked === undefined || !props.onChange) return <span className="w-7" />
  const { linked, onChange } = props
  return (
    <button
      type="button"
      onClick={() => onChange(!linked)}
      title={linked ? t.linked : t.unlinked}
      aria-pressed={linked}
      className={`mb-1 grid h-7 w-7 place-items-center rounded-md border ${
        linked ? 'border-sky-500 bg-sky-600 text-white' : 'border-panel-line text-slate-400 hover:text-slate-200'
      }`}
    >
      {linked ? <Link2 size={14} /> : <Unlink2 size={14} />}
    </button>
  )
}
