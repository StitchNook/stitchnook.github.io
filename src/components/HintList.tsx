import { HintChip } from './ui'
import type { Hint } from '../lib/help'
import { anyKeyHeld, type Modifiers } from '../hooks/useModifiers'

/** A row of shortcut chips; each lights up while its modifier is held. */
export function HintList(props: { hints: Hint[]; mods: Modifiers }) {
  return (
    <>
      {props.hints.map((hint) => (
        <HintChip
          key={hint.label}
          keys={hint.keys}
          label={hint.label}
          either={hint.either}
          title={hint.title}
          active={(hint.when ? props.mods[hint.when] : false) || anyKeyHeld(hint.keys, props.mods.keys)}
        />
      ))}
    </>
  )
}
