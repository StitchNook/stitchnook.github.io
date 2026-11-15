import { useState } from 'react'
import { TextInput } from './ui'
import { t } from './ProjectNameField.i18n'

/**
 * Project name, edited as a draft and committed on Enter or blur (Escape
 * restores the previous name). After each commit the input is re-created,
 * which wipes the browser's own text-undo history for it: a later ⌘Z / Ctrl+Z
 * on the grid can then never jump back here and revert the name.
 */
export function ProjectNameField(props: { name: string; onRename: (name: string) => void }) {
  // Editing state: null when idle (the field shows the project's name).
  const [draft, setDraft] = useState<string | null>(null)
  const [generation, setGeneration] = useState(0)

  const commit = () => {
    if (draft === null) return
    const name = draft.trim()
    if (name && name !== props.name) props.onRename(name)
    setDraft(null)
    setGeneration((g) => g + 1)
  }

  const cancel = () => {
    setDraft(null)
    setGeneration((g) => g + 1)
  }

  return (
    <TextInput
      key={generation}
      value={draft ?? props.name}
      aria-label={t.label}
      title={t.title}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          event.currentTarget.blur()
        } else if (event.key === 'Escape') {
          event.preventDefault()
          cancel()
        }
      }}
    />
  )
}
