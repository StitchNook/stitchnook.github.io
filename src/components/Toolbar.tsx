import {
  CheckCheck,
  Circle,
  Eraser,
  FileStack,
  Hash,
  LibraryBig,
  Maximize2,
  Minus,
  PaintBucket,
  Pencil,
  Pipette,
  Redo2,
  Square,
  SquareDashed,
  Type,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { SheetsControl } from './SheetsControl'
import { Popover } from './Menu'
import { ChevronDown, Eye, EyeOff, Image as ImageIcon } from 'lucide-react'
import { MAX_BRUSH, MIN_BRUSH, isBrushTool, type Brush, type BrushTool } from '../lib/brush'
import type { ProgressMode } from '../hooks/useEditor'
import type { PrintLayout, SheetsChoice } from '../lib/printLayout'
import type { ComponentType, ReactNode } from 'react'
import { Button, RangeField, SegmentedControl } from './ui'
import type { DisplayMode, ToolId } from '../lib/types'
import { KEYS, shortcut as keyCombo } from '../lib/platform'
import { keyLabel } from '../lib/keys'
import { FLOATING_HINTS, TOOL_HINTS } from '../lib/help'
import { HintList } from './HintList'
import type { Modifiers } from '../hooks/useModifiers'
import { t } from './Toolbar.i18n'

type ToolDef = {
  id: ToolId
  label: string
  shortcut: string
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>
}

/** Tools by family: freehand, shapes (previewed before being stitched), utilities. */
const TOOL_GROUPS: { label: string; tools: ToolDef[] }[] = [
  {
    label: t.groups.freehand,
    tools: [
      { id: 'pencil', label: t.tools.pencil, shortcut: 'B', Icon: Pencil },
      { id: 'eraser', label: t.tools.eraser, shortcut: 'E', Icon: Eraser },
    ],
  },
  {
    label: t.groups.shapes,
    tools: [
      { id: 'line', label: t.tools.line, shortcut: 'L', Icon: Minus },
      { id: 'rect', label: t.tools.rect, shortcut: 'R', Icon: Square },
      { id: 'ellipse', label: t.tools.ellipse, shortcut: 'C', Icon: Circle },
      { id: 'text', label: t.tools.text, shortcut: 'T', Icon: Type },
    ],
  },
  {
    label: t.groups.utilities,
    tools: [
      { id: 'select', label: t.tools.select, shortcut: 'S', Icon: SquareDashed },
      { id: 'fill', label: t.tools.fill, shortcut: 'G', Icon: PaintBucket },
      { id: 'picker', label: t.tools.picker, shortcut: 'I', Icon: Pipette },
      { id: 'progress', label: t.tools.progress, shortcut: 'P', Icon: CheckCheck },
      { id: 'motif', label: t.tools.motif, shortcut: 'M', Icon: LibraryBig },
    ],
  },
]
const TOOLS: ToolDef[] = TOOL_GROUPS.flatMap((group) => group.tools)

export function ToolRail(props: { tool: ToolId; onChange: (tool: ToolId) => void }) {
  return (
    <nav className="no-print flex w-14 shrink-0 flex-col items-center gap-1 border-r border-panel-line bg-panel py-2">
      {TOOL_GROUPS.map((group, index) => (
        <div key={group.label} role="group" aria-label={group.label} title={group.label} className="flex flex-col items-center gap-1">
          {index > 0 ? <span className="my-1 h-px w-8 bg-panel-line" /> : null}
      {group.tools.map(({ id, label, shortcut, Icon }) => (
        <button
          key={id}
          type="button"
          title={`${label} (${shortcut})`}
          aria-label={label}
          aria-pressed={props.tool === id}
          onClick={() => props.onChange(id)}
          className={`flex h-10 w-10 items-center justify-center rounded-lg border transition ${
            props.tool === id
              ? 'border-sky-500 bg-sky-600 text-white'
              : 'border-transparent text-slate-300 hover:border-panel-line hover:bg-panel-soft'
          }`}
        >
          <Icon size={18} strokeWidth={1.8} />
        </button>
      ))}
        </div>
      ))}
    </nav>
  )
}

export type CanvasToolbarProps = {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
  display: DisplayMode
  onDisplayChange: (mode: DisplayMode) => void
  showGrid: boolean
  onShowGridChange: (value: boolean) => void
  showLabels: boolean
  onShowLabelsChange: (value: boolean) => void
  showPages: boolean
  onShowPagesChange: (value: boolean) => void
  printSheets: SheetsChoice
  onPrintSheetsChange: (choice: SheetsChoice) => void
  printLayout: PrintLayout
  /** Held modifier keys, to light up the matching hints. */
  /** Reference layer (a board setting): quick visibility + its settings panel. */
  hasReference: boolean
  referenceVisible: boolean
  onReferenceVisibleChange: (visible: boolean) => void
  referencePlacing: boolean
  onStopPlacing: () => void
  referencePanel: (close: () => void) => ReactNode
}

/** View bar: everything about the board itself, nothing about the active tool. */
export function CanvasToolbar(props: CanvasToolbarProps) {
  return (
    // One line whatever the width: labels give way to icons (container
    // queries); the navigation hints live in the status bar.
    <div className="no-print @container border-b border-panel-line bg-panel">
    <div className="flex items-center gap-2 overflow-hidden px-3 py-2">
      <div className="flex shrink-0 items-center gap-1">
        <Button size="sm" onClick={props.onUndo} disabled={!props.canUndo} title={t.undo(keyCombo('mod', 'Z'))}>
          <Undo2 size={14} />
        </Button>
        <Button size="sm" onClick={props.onRedo} disabled={!props.canRedo} title={t.redo(keyCombo('mod', 'shift', 'Z'))}>
          <Redo2 size={14} />
        </Button>
      </div>

      <span className="h-5 w-px shrink-0 bg-panel-line" />

      <div className="flex shrink-0 items-center gap-1">
        <Button size="sm" onClick={props.onZoomOut} title={t.zoomOut}>
          <ZoomOut size={14} />
        </Button>
        <span className="w-14 text-center text-xs tabular-nums text-slate-400">
          {Math.round(props.zoom)} px
        </span>
        <Button size="sm" onClick={props.onZoomIn} title={t.zoomIn}>
          <ZoomIn size={14} />
        </Button>
        <Button size="sm" onClick={props.onFit} title={t.fit}>
          <Maximize2 size={14} />
        </Button>
      </div>

      <span className="h-5 w-px shrink-0 bg-panel-line" />

      {/* Independent switches. Colours and symbols combine (both = "both");
          the last one lit cannot be turned off, or the grid would be empty. */}
      <div className="flex shrink-0 items-center gap-1">
        <DisplayToggle
          compact={props.showPages}
          on={props.display !== 'symbol'}
          icon={<CellIcon fill />}
          label={t.colors}
          title={props.display === 'color' ? t.oneStaysOn : t.showColors}
          onClick={() => {
            if (props.display === 'both') props.onDisplayChange('symbol')
            else if (props.display === 'symbol') props.onDisplayChange('both')
          }}
        />
        <DisplayToggle
          compact={props.showPages}
          on={props.display !== 'color'}
          icon={<CellIcon mark />}
          label={t.symbols}
          title={props.display === 'symbol' ? t.oneStaysOn : t.showSymbols}
          onClick={() => {
            if (props.display === 'both') props.onDisplayChange('color')
            else if (props.display === 'color') props.onDisplayChange('both')
          }}
        />
        <DisplayToggle
          compact={props.showPages}
          on={props.showGrid}
          icon={<Hash size={14} />}
          label={t.grid}
          withIcon
          title={t.showGrid}
          onClick={() => props.onShowGridChange(!props.showGrid)}
        />
        <Button
          size="sm"
          variant={props.showLabels ? 'primary' : 'default'}
          aria-pressed={props.showLabels}
          onClick={() => props.onShowLabelsChange(!props.showLabels)}
          title={t.showLabels}
        >
          123
        </Button>
      </div>

      <span className="h-5 w-px shrink-0 bg-panel-line" />

      <Button
        size="sm"
        variant={props.showPages ? 'primary' : 'default'}
        onClick={() => props.onShowPagesChange(!props.showPages)}
        title={t.pagesTitle}
      >
        <FileStack size={14} /> <span className="@max-[50rem]:hidden">{t.pages}</span>
      </Button>
      {props.showPages ? (
        <SheetsControl
          compact
          choice={props.printSheets}
          onChange={props.onPrintSheetsChange}
          layout={props.printLayout}
        />
      ) : null}

      <span className="h-5 w-px shrink-0 bg-panel-line" />
      {props.referencePlacing ? (
        <Button size="sm" variant="primary" onClick={props.onStopPlacing} title={t.stopPlacingTitle}>
          <ImageIcon size={14} /> {t.stopPlacing}
        </Button>
      ) : (
        <Popover
          width={300}
          content={props.referencePanel}
          trigger={(toggle, open) => (
            <Button
              size="sm"
              variant={open ? 'primary' : 'default'}
              onClick={toggle}
              title={t.referenceTitle}
            >
              <ImageIcon size={14} /> <span className="@max-[50rem]:hidden">{t.reference}</span> <ChevronDown size={12} />
            </Button>
          )}
        />
      )}
      {props.hasReference ? (
        <Button
          size="sm"
          variant={props.referenceVisible ? 'primary' : 'default'}
          onClick={() => props.onReferenceVisibleChange(!props.referenceVisible)}
          title={props.referenceVisible ? t.hideReference : t.showReference}
          aria-label={t.toggleReference}
        >
          {props.referenceVisible ? <Eye size={14} /> : <EyeOff size={14} />}
        </Button>
      ) : null}

    </div>
    </div>
  )
}

/** A grid cell as drawn by each display mode: colour, symbol, or both. */
function CellIcon(props: { fill?: boolean; mark?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <rect
        x="1.5"
        y="1.5"
        width="11"
        height="11"
        rx="1.5"
        fill={props.fill ? 'currentColor' : 'none'}
        fillOpacity={props.fill && props.mark ? 0.45 : 1}
        stroke="currentColor"
        strokeWidth="1.3"
      />
      {props.mark ? <path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /> : null}
    </svg>
  )
}

/** A text switch that keeps only its icon when the bar runs out of room. */
function DisplayToggle(props: {
  on: boolean
  icon: ReactNode
  label: string
  /** Show the icon next to the label too (not only as the narrow fallback). */
  withIcon?: boolean
  /** The bar is crowded (print sheets shown): on narrow bars, icon only. */
  compact: boolean
  title: string
  onClick: () => void
}) {
  return (
    <Button
      size="sm"
      variant={props.on ? 'primary' : 'default'}
      aria-pressed={props.on}
      aria-label={props.label}
      title={props.title}
      onClick={props.onClick}
    >
      <span className={props.withIcon ? 'contents' : props.compact ? 'hidden @max-[50rem]:contents' : 'hidden'}>
        {props.icon}
      </span>
      <span className={props.compact ? '@max-[50rem]:hidden' : ''}>{props.label}</span>
    </Button>
  )
}

export type ToolOptionsBarProps = {
  tool: ToolId
  brushes: Record<BrushTool, Brush>
  onBrushChange: (tool: BrushTool, change: Partial<Brush>) => void
  progressMode: ProgressMode
  onProgressModeChange: (mode: ProgressMode) => void
  shapeFilled: boolean
  onShapeFilledChange: (value: boolean) => void
  hasSelection: boolean
  onSelectAll: () => void
  onDeselect: () => void
  /** A preview (paste, text, transformation) is waiting to be validated. */
  floating: boolean
  mods: Modifiers
  /** Open the help centre on this tool's topic. */
  onHelp: () => void
}

const Divider = () => <span className="h-5 w-px shrink-0 bg-panel-line" />

/**
 * Options of the active tool only, Photoshop style: tool name first, then its
 * settings, then a short hint. Fixed height, so the board never jumps.
 */
export function ToolOptionsBar(props: ToolOptionsBarProps) {
  const def = TOOLS.find((entry) => entry.id === props.tool) ?? TOOLS[0]
  const { Icon } = def
  const brushTool = isBrushTool(props.tool) ? props.tool : null
  const brush = brushTool ? props.brushes[brushTool] : null

  // While a preview floats, its own shortcuts matter more than the tool's.
  const hints = props.floating ? FLOATING_HINTS : TOOL_HINTS[props.tool]

  return (
    <div className="no-print flex h-10 shrink-0 items-center gap-2 overflow-hidden border-b border-panel-line bg-panel-soft/40 px-3">
      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-200">
        <Icon size={14} strokeWidth={1.8} />
        {def.label}
      </span>

      {brush && brushTool ? (
        <>
          <Divider />
          <div className="w-32">
            <SegmentedControl
              value={brush.shape}
              onChange={(shape) => props.onBrushChange(brushTool, { shape })}
              options={[
                { value: 'square', label: t.square },
                { value: 'round', label: t.round },
              ]}
            />
          </div>
          <RangeField
            compact
            label={
              <span
                title={t.brushSizeTitle(keyLabel('BracketLeft'), keyLabel('BracketRight'), KEYS.alt)}
              >
                {t.size}
              </span>
            }
            min={MIN_BRUSH}
            max={MAX_BRUSH}
            value={brush.size}
            defaultValue={MIN_BRUSH}
            format={(size) => t.brushSize(size)}
            onChange={(size) => props.onBrushChange(brushTool, { size })}
          />
        </>
      ) : null}

      {props.tool === 'progress' ? (
        <>
          <Divider />
          <div className="w-56">
            <SegmentedControl
              value={props.progressMode}
              onChange={props.onProgressModeChange}
              options={[
                { value: 'auto', label: 'Auto', title: t.autoTitle },
                { value: 'mark', label: t.mark },
                { value: 'unmark', label: t.unmark },
              ]}
            />
          </div>
        </>
      ) : null}

      {props.tool === 'rect' || props.tool === 'ellipse' ? (
        <>
          <Divider />
          <div className="w-40">
            <SegmentedControl
              value={props.shapeFilled ? 'filled' : 'outline'}
              onChange={(value) => props.onShapeFilledChange(value === 'filled')}
              options={[
                { value: 'outline', label: t.outline },
                { value: 'filled', label: t.filled },
              ]}
            />
          </div>
        </>
      ) : null}

      {props.tool === 'select' ? (
        <>
          <Divider />
          <Button size="sm" onClick={props.onSelectAll} title={t.selectAllTitle(keyCombo('mod', 'A'))}>
            {t.selectAll}
          </Button>
          <Button
            size="sm"
            onClick={props.onDeselect}
            disabled={!props.hasSelection}
            title={t.deselectTitle(keyCombo('mod', 'D'))}
          >
            {t.deselect}
          </Button>
        </>
      ) : null}

      {/* Hints that do not fit wrap onto a hidden second line: never cut in half. */}
      <span className="ml-auto flex h-6 min-w-0 flex-wrap items-center justify-end gap-x-1 gap-y-2 overflow-hidden pl-2">
        <HintList hints={hints} mods={props.mods} />
      </span>
      <button
        type="button"
        onClick={props.onHelp}
        title={t.toolHelpTitle(def.label)}
        aria-label={t.toolHelp}
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-panel-line text-xs font-bold text-slate-300 hover:border-sky-500 hover:text-sky-300"
      >
        ?
      </button>
    </div>
  )
}
