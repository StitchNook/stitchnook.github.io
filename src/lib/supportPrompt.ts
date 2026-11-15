/**
 * When to suggest supporting the project (Ko-fi).
 *
 * - Creating a project (blank, from an image or a PDF) always shows the card.
 * - Other good moments (a printed chart, a finished embroidery, regular use)
 *   show it at most once every two weeks, and not on the first day except
 *   right after printing.
 * - Once the person opened Ko-fi or said they already gave, no card at all
 *   for a month.
 */

import { SUPPORT_ENABLED } from './support'

export type SupportMoment = 'create' | 'import' | 'print' | 'complete' | 'loyal'

/** Moments shown every time (only a recent tip silences them). */
const ALWAYS: SupportMoment[] = ['create', 'import']

type State = {
  /** Distinct days of use (YYYY-MM-DD), oldest first, capped. */
  days: string[]
  /** No "good moment" card before this time (ms). */
  pausedUntil: number
  /** Opened Ko-fi or already gave: no card at all before this time (ms). */
  supporterUntil: number
  /** The "thanks for coming back" card already showed. */
  loyalShown: boolean
}

const KEY = 'stitchly.support.v1'
const DAY = 24 * 60 * 60 * 1000
const GAP_DAYS = 14
const SUPPORTER_DAYS = 30
export const LOYAL_DAYS = 5

const today = (now: number) => new Date(now).toISOString().slice(0, 10)

function read(): State {
  const raw = localStorage.getItem(KEY)
  const parsed = raw ? (JSON.parse(raw) as Partial<State>) : {}
  return {
    days: Array.isArray(parsed.days) ? parsed.days.filter((d) => typeof d === 'string') : [],
    pausedUntil: typeof parsed.pausedUntil === 'number' ? parsed.pausedUntil : 0,
    supporterUntil: typeof parsed.supporterUntil === 'number' ? parsed.supporterUntil : 0,
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
  if (!SUPPORT_ENABLED) return false
  try {
    const state = read()
    if (now < state.supporterUntil) return false
    if (ALWAYS.includes(moment)) return true
    if (now < state.pausedUntil) return false
    const firstDay = state.days.length <= 1
    if (firstDay && moment !== 'print') return false
    if (moment === 'loyal') return !state.loyalShown && state.days.length >= LOYAL_DAYS
    return true
  } catch {
    return false
  }
}

function update(change: (state: State) => Partial<State>): void {
  try {
    const state = read()
    write({ ...state, ...change(state) })
  } catch {
    /* Nothing to remember. */
  }
}

/** The card was shown: the next "good moment" card waits two weeks (creations still show). */
export function markShown(moment: SupportMoment, now = Date.now()): void {
  update((state) => ({
    pausedUntil: Math.max(state.pausedUntil, now + GAP_DAYS * DAY),
    ...(moment === 'loyal' ? { loyalShown: true } : {}),
  }))
}

/** The person opened Ko-fi (card, header or creation window) or says they already gave: a month of silence. */
export function markSupporter(now = Date.now()): void {
  update((state) => ({ supporterUntil: Math.max(state.supporterUntil, now + SUPPORTER_DAYS * DAY) }))
}
