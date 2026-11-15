import type { ReactNode } from 'react'
import { Kbd, type HintKey } from '../components/ui'
import { H, Hints, P } from '../components/HelpBlocks'
import type { Modifiers } from '../hooks/useModifiers'
import type { ToolId } from './types'
import { codeToken } from './keys'
import { t } from './help.i18n'

/** A shortcut and its effect; `when` is the modifier that makes it light up. */
export type Hint = {
  keys: HintKey[]
  label: string
  when?: Exclude<keyof Modifiers, 'keys'>
  /** The keys are alternatives (shown « a / b »), not a combination (« a + b »). */
  either?: boolean
  title?: string
}

/** Brush size: the two keys right of P ([ ] in QWERTY, ^ $ in AZERTY), or ⌥ + wheel. */
const BRUSH_SIZE_HINT: Hint = {
  keys: [codeToken('BracketLeft'), codeToken('BracketRight')],
  label: t.hints.brushSize,
  either: true,
  title: t.hints.brushSizeTitle,
}
const BRUSH_WHEEL_HINT: Hint = { keys: ['alt', 'molette'], label: t.hints.brushWheel, when: 'alt' }

/** Shortcuts of each tool: shown in the tool bar and in the help centre. */
export const TOOL_HINTS: Record<ToolId, Hint[]> = {
  pencil: [
    { keys: ['alt'], label: t.hints.erase, when: 'alt' },
    BRUSH_SIZE_HINT,
    BRUSH_WHEEL_HINT,
  ],
  eraser: [BRUSH_SIZE_HINT, BRUSH_WHEEL_HINT],
  fill: [{ keys: ['alt', 'clic'], label: t.hints.clearArea, when: 'alt' }],
  picker: [{ keys: ['clic'], label: t.hints.pickThread }],
  line: [{ keys: ['shift'], label: t.hints.angles45, when: 'shift' }],
  rect: [{ keys: ['shift'], label: t.hints.square, when: 'shift' }],
  ellipse: [{ keys: ['shift'], label: t.hints.circle, when: 'shift' }],
  select: [
    { keys: ['shift'], label: t.hints.addArea, when: 'shift' },
    { keys: ['alt'], label: t.hints.removeArea, when: 'alt' },
    { keys: ['↑↓←→'], label: t.hints.move },
    { keys: ['Entrée'], label: t.hints.apply },
    { keys: ['Échap'], label: t.hints.cancel },
  ],
  text: [
    { keys: ['clic', '↑↓←→'], label: t.hints.movePreview },
    { keys: ['Entrée'], label: t.hints.apply },
  ],
  progress: [
    { keys: ['alt'], label: t.hints.invert, when: 'alt' },
    BRUSH_SIZE_HINT,
    BRUSH_WHEEL_HINT,
  ],
  motif: [
    { keys: ['clic'], label: t.hints.motifThumb },
    { keys: ['Entrée'], label: t.hints.apply },
  ],
}

/** Navigation hints of the view bar. */
export const VIEW_HINTS: Hint[] = [
  { keys: ['molette'], label: t.hints.pan },
  { keys: ['mod', 'molette'], label: t.hints.zoom, when: 'mod' },
  { keys: ['space'], label: t.hints.hand, when: 'space' },
]

/** Hints of a floating motif (paste, lifted selection, text preview). */
export const FLOATING_HINTS: Hint[] = [
  { keys: ['↑↓←→'], label: t.hints.floatingMove, when: 'shift' },
  { keys: ['shift'], label: t.hints.floatingAlign, when: 'shift' },
  { keys: ['Entrée'], label: t.hints.apply },
  { keys: ['Échap'], label: t.hints.cancel },
]

/* ------------------------------------------------------------- help centre */

export type HelpSection = {
  id: string
  title: string
  /** Extra words the search should match. */
  keywords: string
  body: ReactNode
}

// Same order as the tool column: freehand, shapes, utilities.
const TOOL_ORDER: ToolId[] = [
  'pencil',
  'eraser',
  'line',
  'rect',
  'ellipse',
  'text',
  'select',
  'fill',
  'picker',
  'progress',
  'motif',
]

const S = t.shortcuts
export const SHORTCUTS: { keys: HintKey[]; label: string; either?: boolean }[] = [
  { keys: ['mod', 'Z'], label: S.undo },
  { keys: ['mod', 'shift', 'Z'], label: S.redo },
  { keys: ['mod', 'C'], label: S.copy },
  { keys: ['mod', 'X'], label: S.cut },
  { keys: ['mod', 'V'], label: S.paste },
  { keys: ['mod', 'A'], label: S.selectAll },
  { keys: ['mod', 'D'], label: S.deselect },
  { keys: ['mod', 'S'], label: S.exportProject },
  { keys: ['mod', 'P'], label: S.print },
  { keys: ['Suppr'], label: S.clear },
  { keys: ['Entrée'], label: S.applyPreview },
  { keys: ['Échap'], label: S.cancelPreview },
  { keys: ['↑↓←→'], label: S.moveSelection },
  {
    keys: [codeToken('BracketLeft'), codeToken('BracketRight')],
    label: S.brushKeys,
    either: true,
  },
  { keys: ['alt', 'molette'], label: S.brushWheel },
  {
    keys: [codeToken('Equal'), codeToken('Minus')],
    label: S.zoom,
    either: true,
  },
  { keys: ['space'], label: S.hand },
  { keys: ['F1'], label: S.help },
  { keys: ['H'], label: S.overlay },
  { keys: ['Tab'], label: S.panels },
  { keys: ['B'], label: S.pencil },
  { keys: ['E'], label: S.eraser },
  { keys: ['G'], label: S.fill },
  { keys: ['I'], label: S.picker },
  { keys: ['L'], label: S.line },
  { keys: ['R'], label: S.rect },
  { keys: ['C'], label: S.ellipse },
  { keys: ['S'], label: S.select },
  { keys: ['T'], label: S.text },
  { keys: ['P'], label: S.progress },
  { keys: ['M'], label: S.motif },
]

const sections = t.sections

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'start',
    title: sections.start.title,
    keywords: sections.start.keywords,
    body: sections.start.body(<Hints hints={VIEW_HINTS} />),
  },
  ...TOOL_ORDER.map((tool) => ({
    id: `tool-${tool}`,
    title: sections.tool.title(t.toolNames[tool]),
    keywords: sections.tool.keywords(tool),
    body: (
      <>
        <P>{t.toolText[tool]}</P>
        {TOOL_HINTS[tool].length > 0 ? (
          <>
            <H>{sections.tool.shortcuts}</H>
            <Hints hints={TOOL_HINTS[tool]} />
          </>
        ) : null}
      </>
    ),
  })),
  {
    id: 'selection',
    title: sections.selection.title,
    keywords: sections.selection.keywords,
    body: sections.selection.body(<Hints hints={FLOATING_HINTS} />),
  },
  ...(['text', 'reference', 'threads', 'progress', 'print', 'motifs', 'projects', 'storage'] as const).map(
    (id) => ({ id, title: sections[id].title, keywords: sections[id].keywords, body: sections[id].body() }),
  ),
  {
    id: 'shortcuts',
    title: sections.shortcuts.title,
    keywords: sections.shortcuts.keywords,
    body: (
      <>
      <p className="mb-3 text-xs text-slate-400">{sections.shortcuts.intro()}</p>
      <table className="w-full text-left text-[13px]">
        <tbody>
          {SHORTCUTS.map((row) => (
            <tr key={row.label} className="border-b border-panel-line/60">
              <td className="py-1.5 pr-4 whitespace-nowrap">
                {row.keys.map((k, i) => (
                  <span key={`${k}-${i}`}>
                    {i > 0 ? <span className="px-0.5 text-slate-500">{row.either ? '/' : '+'}</span> : null}
                    <Kbd k={k} />
                  </span>
                ))}
              </td>
              <td className="py-1.5 text-slate-300">{row.label}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </>
    ),
  },
]
