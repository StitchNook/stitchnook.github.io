/**
 * When to suggest supporting the project (Ko-fi), without nagging.
 *
 * A card only follows a moment where the app just helped (a printed chart, a
 * converted image, a finished embroidery, regular use), at most once every
 * two weeks, never on the first day except right after printing, and never
 * again for a year once the person says they already gave.
 */

export type SupportMoment = 'print' | 'import' | 'complete' | 'loyal'

type State = {
  /** Distinct days of use (YYYY-MM-DD), oldest first, capped. */
  days: string[]
  /** No card before this time (ms). */
  pausedUntil: number
  /** The "thanks for coming back" card already showed. */
  loyalShown: boolean
}

const KEY = 'stitchly.support.v1'
const DAY = 24 * 60 * 60 * 1000
const GAP_DAYS = 14
const AFTER_TIP_DAYS = 60
const SUPPORTER_DAYS = 365
export const LOYAL_DAYS = 5

const today = (now: number) => new Date(now).toISOString().slice(0, 10)

function read(): State {
  const raw = localStorage.getItem(KEY)
  const parsed = raw ? (JSON.parse(raw) as Partial<State>) : {}
  return {
    days: Array.isArray(parsed.days) ? parsed.days.filter((d) => typeof d === 'string') : [],
    pausedUntil: typeof parsed.pausedUntil === 'number' ? parsed.pausedUntil : 0,
    loyalShown: parsed.loyalShown === true,
  }
}

function write(state: State): void {
  localStorage.setItem(KEY, JSON.stringify(state))
}

/** Note that the app is used today. Call once at start-up. */
export function recordUsageDay(now = Date.now()): void {
  try {
    const state = read()
    const day = today(now)
    if (!state.days.includes(day)) state.days = [...state.days, day].slice(-30)
    write(state)
  } catch {
    /* Storage unavailable: no card is ever shown. */
  }
}

/** Whether a card may show now for this moment. */
export function canPrompt(moment: SupportMoment, now = Date.now()): boolean {
  try {
    const state = read()
    if (now < state.pausedUntil) return false
    const firstDay = state.days.length <= 1
    if (firstDay && moment !== 'print') return false
    if (moment === 'loyal') return !state.loyalShown && state.days.length >= LOYAL_DAYS
    return true
  } catch {
    return false
  }
}

function pause(days: number, now: number, extra?: Partial<State>): void {
  try {
    const state = read()
    write({ ...state, ...extra, pausedUntil: Math.max(state.pausedUntil, now + days * DAY) })
  } catch {
    /* Nothing to remember. */
  }
}

/** The card was shown: wait two weeks before the next one. */
export function markShown(moment: SupportMoment, now = Date.now()): void {
  pause(GAP_DAYS, now, moment === 'loyal' ? { loyalShown: true } : undefined)
}

/** The person opened Ko-fi from the card. */
export function markTipped(now = Date.now()): void {
  pause(AFTER_TIP_DAYS, now)
}

/** The person says they already support the project. */
export function markSupporter(now = Date.now()): void {
  pause(SUPPORTER_DAYS, now)
}
