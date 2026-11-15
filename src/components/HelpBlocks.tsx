import type { ReactNode } from 'react'
import { HintChip } from './ui'
import type { Hint } from '../lib/help'

/* Small typographic blocks for the help centre's topics. */

export const H = (props: { children: ReactNode }) => (
  <h3 className="mt-5 mb-2 text-sm font-semibold text-slate-100 first:mt-0">{props.children}</h3>
)
export const P = (props: { children: ReactNode }) => <p className="mb-2 leading-relaxed">{props.children}</p>
export const UL = (props: { children: ReactNode }) => (
  <ul className="mb-2 list-disc space-y-1 pl-5 leading-relaxed">{props.children}</ul>
)
export const Hints = (props: { hints: Hint[] }) => (
  <div className="mb-2 flex flex-wrap gap-1.5">
    {props.hints.map((hint) => (
      <HintChip key={hint.label} keys={hint.keys} label={hint.label} either={hint.either} title={hint.title} />
    ))}
  </div>
)

