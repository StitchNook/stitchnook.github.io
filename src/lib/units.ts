import type { Fabric, Unit } from './types'
import { formatNumber } from '../i18n'
import { t } from './units.i18n'

export const CM_PER_INCH = 2.54

export function toCm(value: number, unit: Unit): number {
  return unit === 'cm' ? value : value * CM_PER_INCH
}

export function fromCm(valueCm: number, unit: Unit): number {
  return unit === 'cm' ? valueCm : valueCm / CM_PER_INCH
}

/** Stitch density expressed per centimetre, whatever unit the user picked. */
export function stitchesPerCm(fabric: Fabric): number {
  const count = fabric.count > 0 ? fabric.count : 1
  return fabric.countUnit === 'cm' ? count : count / CM_PER_INCH
}

/** Physical size of a stitch count, in the fabric's display unit. */
export function stitchesToPhysical(stitches: number, fabric: Fabric): number {
  const cm = stitches / stitchesPerCm(fabric)
  return fromCm(cm, fabric.displayUnit)
}

/** Stitch count that fits in a physical length given in `unit`. */
export function physicalToStitches(value: number, unit: Unit, fabric: Fabric): number {
  return Math.max(1, Math.round(toCm(value, unit) * stitchesPerCm(fabric)))
}

export function formatLength(value: number, unit: Unit): string {
  const digits = value >= 100 ? 0 : 1
  const rounded = formatNumber(value, { minimumFractionDigits: digits, maximumFractionDigits: digits })
  return `${rounded} ${unit === 'cm' ? 'cm' : t.inchShort}`
}

/**
 * Rough thread estimate: a full cross over one stitch uses a little over twice
 * the stitch diagonal, plus a margin for starts, ends and travel.
 */
export function estimateThreadMetres(stitches: number, fabric: Fabric): number {
  const stitchCm = 1 / stitchesPerCm(fabric)
  const cm = stitches * stitchCm * 2.6 * 1.15
  return cm / 100
}

export const UNIT_LABEL: Record<Unit, string> = { cm: 'cm', in: t.inches }

/** Common fabric presets, expressed the way shops label them. */
export const FABRIC_PRESETS: { label: string; fabric: Pick<Fabric, 'count' | 'countUnit'> }[] = [
  { label: t.aida(14, 5.5), fabric: { count: 14, countUnit: 'in' } },
  { label: t.aida(16, 6.3), fabric: { count: 16, countUnit: 'in' } },
  { label: t.aida(18, 7.1), fabric: { count: 18, countUnit: 'in' } },
  { label: t.aida(11, 4.3), fabric: { count: 11, countUnit: 'in' } },
  { label: t.evenweave(28, 5.5), fabric: { count: 14, countUnit: 'in' } },
  { label: t.evenweave(32, 6.3), fabric: { count: 16, countUnit: 'in' } },
  { label: t.perCm(5), fabric: { count: 5, countUnit: 'cm' } },
  { label: t.perCm(6), fabric: { count: 6, countUnit: 'cm' } },
]
