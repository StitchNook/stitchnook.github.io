import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Printer, X } from 'lucide-react'
import { KOFI_URL, SUPPORT_ENABLED } from '../lib/support'
import { markSupporter } from '../lib/supportPrompt'
import { EMPTY, countByThread, idx } from '../lib/grid'
import { dmcByCode, readableInk } from '../lib/dmc'
import { estimateThreadMetres, formatLength, stitchesToPhysical } from '../lib/units'
import {
  A4_LONG_MM,
  A4_SHORT_MM,
  FOOTER_MM,
  HEADER_MM,
  RULER_MM,
  type PrintLayout,
  type SheetsChoice,
} from '../lib/printLayout'
import { SheetsControl } from './SheetsControl'
import { Button, Field, SegmentedControl, ToggleRow } from './ui'
import type { Project } from '../lib/types'
import { t } from './PrintView.i18n'

export type PrintViewProps = {
  project: Project
  /** Shared with the editor's page overlay, so both always agree. */
  sheetsChoice: SheetsChoice
  onSheetsChoiceChange: (choice: SheetsChoice) => void
  layout: PrintLayout
  onClose: () => void
}

type Ink = 'color' | 'bw'

/** Colour of the centre markers and lines, as on classic printed charts. */
const MARK = '#1d4ed8'
const FRAME = '#111827'

/** Area of the full pattern a page shows, overlap included. */
type PageRect = {
  number: number
  col: number
  row: number
  /** First stitch owned by this page. */
  x0: number
  y0: number
  w: number
  h: number
  /** Rows/columns repeated from the previous page (0 or 1). */
  overlapX: number
  overlapY: number
}

export function PrintView({
  project,
  sheetsChoice,
  onSheetsChoiceChange,
  layout,
  onClose,
}: PrintViewProps) {
  const [ink, setInk] = useState<Ink>('color')
  const [showSymbols, setShowSymbols] = useState(true)
  const [showLegend, setShowLegend] = useState(true)
  const [showDone, setShowDone] = useState(false)
  const [showCentre, setShowCentre] = useState(true)

  const counts = useMemo(
    () => countByThread(project.cells, project.palette.length),
    [project.cells, project.palette.length],
  )


  const pages = useMemo(() => {
    const list: PageRect[] = []
    for (let row = 0; row < layout.pagesY; row++) {
      for (let col = 0; col < layout.pagesX; col++) {
        const x0 = col * layout.cols
        const y0 = row * layout.rows
        list.push({
          number: list.length + 1,
          col,
          row,
          x0,
          y0,
          w: Math.min(layout.cols, project.width - x0),
          h: Math.min(layout.rows, project.height - y0),
          overlapX: col > 0 ? 1 : 0,
          overlapY: row > 0 ? 1 : 0,
        })
      }
    }
    return list
  }, [layout, project.height, project.width])

  const totalPages = pages.length + (showLegend ? 1 : 0)
  const totalStitches = counts.reduce((sum, value) => sum + value, 0)


  return (
    <div className="print-shell fixed inset-0 z-50 overflow-auto bg-slate-700/95 p-6">
      <div className="no-print sticky top-0 z-10 mx-auto mb-5 flex max-w-5xl flex-wrap items-end gap-4 rounded-xl border border-panel-line bg-panel p-4 shadow-xl">
        <Field label={t.sheets}>
          <SheetsControl choice={sheetsChoice} onChange={onSheetsChoiceChange} layout={layout} />
        </Field>
        <div className="w-40">
          <Field label={t.ink}>
            <SegmentedControl<Ink>
              value={ink}
              onChange={setInk}
              options={[
                { value: 'color', label: t.color },
                { value: 'bw', label: t.bw },
              ]}
            />
          </Field>
        </div>
        <div className="space-y-0.5">
          <ToggleRow label={t.symbols} checked={showSymbols} onChange={setShowSymbols} />
          <ToggleRow label={t.centreLines} checked={showCentre} onChange={setShowCentre} />
          <ToggleRow label={t.legend} checked={showLegend} onChange={setShowLegend} />
          <ToggleRow label={t.markDone} checked={showDone} onChange={setShowDone} />
        </div>
        <div className="ml-auto flex flex-col items-end gap-2">
          <span className="text-xs text-slate-300">
            {t.pagesToPrint(totalPages, showLegend)}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="primary" onClick={() => window.print()}>
              <Printer size={14} /> {t.print}
            </Button>
            <Button onClick={onClose}>
              <X size={14} /> {t.close}
            </Button>
          </div>
        </div>
        {SUPPORT_ENABLED ? (
          <p className="w-full text-xs text-slate-400">
            {t.thanks}{' '}
            <a href={KOFI_URL} target="_blank" rel="noopener" onClick={() => markSupporter()} className="font-medium text-sky-400 hover:underline">
              ♥ Ko-fi
            </a>
          </p>
        ) : null}
      </div>

      <div className="mx-auto flex max-w-fit flex-col items-center gap-5">
        {pages.map((page) => (
          <ChartPage
            key={`${page.col}-${page.row}`}
            project={project}
            page={page}
            layout={layout}
            totalPages={totalPages}
            chartPages={pages.length}
            ink={ink}
            showSymbols={showSymbols}
            showDone={showDone}
            showCentre={showCentre}
          />
        ))}

        {showLegend ? (
          <Legend
            project={project}
            counts={counts}
            totalStitches={totalStitches}
            ink={ink}
            layout={layout}
            pageNumber={totalPages}
          />
        ) : null}
      </div>
    </div>
  )
}

function PageFrame(props: {
  width: number
  height: number
  landscape?: boolean
  pageLabel: string
  children: ReactNode
}) {
  return (
    <div
      className="print-page bg-white text-black"
      style={{
        width: `${props.width}mm`,
        // 1mm of slack so rounding never spills onto a blank extra sheet.
        height: `${props.height - 1}mm`,
        display: 'flex',
        flexDirection: 'column',
        ...(props.landscape ? ({ page: 'chart-landscape' } as CSSProperties) : null),
      }}
    >
      {props.children}
      <div
        style={{
          marginTop: 'auto',
          height: `${FOOTER_MM}mm`,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          fontSize: '3.2mm',
          fontWeight: 600,
          color: MARK,
        }}
      >
        {props.pageLabel}
      </div>
    </div>
  )
}

function ChartPage(props: {
  project: Project
  page: PageRect
  layout: PrintLayout
  totalPages: number
  chartPages: number
  ink: Ink
  showSymbols: boolean
  showDone: boolean
  showCentre: boolean
}) {
  const { project, page, layout, ink, showSymbols, showDone, showCentre } = props
  const cell = layout.cell
  const mm = (value: number) => `${value}mm`

  // What the page shows, in pattern coordinates, overlap included.
  const vx0 = page.x0 - page.overlapX
  const vy0 = page.y0 - page.overlapY
  const vw = page.w + page.overlapX
  const vh = page.h + page.overlapY
  const chartW = vw * cell
  const chartH = vh * cell

  // Everything inside the chart is one SVG in millimetres: vector output,
  // every line at its exact position whatever the stitch size. (Repeating CSS
  // gradients got rounded differently per repeat when printing.)
  const stitches = []
  const symbols = []
  for (let y = 0; y < vh; y++) {
    for (let x = 0; x < vw; x++) {
      const gx = vx0 + x
      const gy = vy0 + y
      const at = idx(project.width, gx, gy)
      const value = project.cells[at]
      if (value === EMPTY) continue
      const thread = project.palette[value]
      if (!thread) continue
      const color = dmcByCode(thread.code)
      const repeated = gx < page.x0 || gy < page.y0
      const opacity = repeated || (showDone && project.done[at]) ? 0.3 : 1
      if (ink !== 'bw') {
        stitches.push(
          <rect key={at} x={x * cell} y={y * cell} width={cell} height={cell} fill={color.hex} opacity={opacity} />,
        )
      }
      if (showSymbols) {
        symbols.push(
          <text
            key={at}
            x={(x + 0.5) * cell}
            y={(y + 0.5) * cell}
            fontSize={cell * 0.62}
            fill={ink === 'bw' ? '#000' : readableInk(color.hex)}
            opacity={opacity}
          >
            {thread.symbol}
          </text>,
        )
      }
    }
  }

  // Thin line on every stitch boundary, bold on multiples of ten (pattern coords).
  const thin: string[] = []
  const bold: string[] = []
  for (let i = 0; i <= vw; i++) {
    const x = i * cell
    ;((vx0 + i) % 10 === 0 ? bold : thin).push(`M${x} 0V${chartH}`)
  }
  for (let j = 0; j <= vh; j++) {
    const y = j * cell
    ;((vy0 + j) % 10 === 0 ? bold : thin).push(`M0 ${y}H${chartW}`)
  }

  // Centre of the whole pattern: a grid line when even, mid-stitch when odd.
  const centreX = project.width / 2
  const centreY = project.height / 2
  const hasCentreX = centreX >= page.x0 && centreX <= page.x0 + page.w
  const hasCentreY = centreY >= page.y0 && centreY <= page.y0 + page.h
  const cx = (centreX - vx0) * cell
  const cy = (centreY - vy0) * cell

  // Numbers sit on the bold lines (10, 20, …), skipped where a marker sits.
  const labelsX: number[] = []
  for (let k = Math.ceil(vx0 / 10) * 10; k <= vx0 + vw; k += 10) {
    if (k > 0 && !(hasCentreX && Math.abs(k - centreX) < 2)) labelsX.push(k)
  }
  const labelsY: number[] = []
  for (let k = Math.ceil(vy0 / 10) * 10; k <= vy0 + vh; k += 10) {
    if (k > 0 && !(hasCentreY && Math.abs(k - centreY) < 2)) labelsY.push(k)
  }

  const R = RULER_MM
  const label: CSSProperties = {
    position: 'absolute',
    fontSize: '2.2mm',
    lineHeight: 1,
    color: '#374151',
  }
  const tri = 1.6 // half-width of a marker triangle, in mm

  return (
    <PageFrame
      width={layout.pageW}
      height={layout.pageH}
      landscape={layout.orientation === 'landscape'}
      pageLabel={`${page.number}/${props.totalPages}`}
    >
      <header
        style={{
          height: mm(HEADER_MM),
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontSize: '4mm',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: MARK,
          }}
        >
          {project.name}
        </div>
        <div style={{ fontSize: '2.6mm', color: '#374151', marginTop: '0.8mm' }}>
          {t.heading(
            page.number,
            props.chartPages,
            page.row + 1,
            page.col + 1,
            page.x0 + 1,
            page.x0 + page.w,
            page.y0 + 1,
            page.y0 + page.h,
          )}
        </div>
      </header>

      <div
        style={{
          position: 'relative',
          width: mm(chartW + 2 * R),
          height: mm(chartH + 2 * R),
          margin: '0 auto',
        }}
      >
        {labelsX.map((k) => {
          const left = mm(R + (k - vx0) * cell)
          return [
            <span key={`t${k}`} style={{ ...label, left, top: mm(R - 3), transform: 'translateX(-50%)' }}>
              {k}
            </span>,
            <span key={`b${k}`} style={{ ...label, left, top: mm(R + chartH + 0.8), transform: 'translateX(-50%)' }}>
              {k}
            </span>,
          ]
        })}
        {labelsY.map((k) => {
          const top = mm(R + (k - vy0) * cell)
          return [
            <span key={`l${k}`} style={{ ...label, top, right: mm(R + chartW + 0.8), transform: 'translateY(-50%)' }}>
              {k}
            </span>,
            <span key={`r${k}`} style={{ ...label, top, left: mm(R + chartW + 0.8), transform: 'translateY(-50%)' }}>
              {k}
            </span>,
          ]
        })}

        {hasCentreX ? (
          <>
            <Triangle dir="down" x={R + cx} y={R - 0.4} size={tri} />
            <Triangle dir="up" x={R + cx} y={R + chartH + 0.4} size={tri} />
          </>
        ) : null}
        {hasCentreY ? (
          <>
            <Triangle dir="right" x={R - 0.4} y={R + cy} size={tri} />
            <Triangle dir="left" x={R + chartW + 0.4} y={R + cy} size={tri} />
          </>
        ) : null}

        <svg
          width={mm(chartW)}
          height={mm(chartH)}
          viewBox={`0 0 ${chartW} ${chartH}`}
          style={{ position: 'absolute', left: mm(R), top: mm(R), overflow: 'visible' }}
        >
          <defs>
            <pattern id={`hatch-${page.number}`} width={1.2} height={1.2} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width={0.5} height={1.2} fill="rgba(100,116,139,0.28)" />
            </pattern>
          </defs>
          {stitches}
          <g textAnchor="middle" dominantBaseline="central" fontWeight={700} fontFamily="system-ui, sans-serif">
            {symbols}
          </g>

          {/* Repeated row/column from the neighbouring page, hatched. */}
          {page.overlapX ? <rect x={0} y={0} width={cell} height={chartH} fill={`url(#hatch-${page.number})`} /> : null}
          {page.overlapY ? <rect x={0} y={0} width={chartW} height={cell} fill={`url(#hatch-${page.number})`} /> : null}

          <path d={thin.join('')} stroke="#9ca3af" strokeWidth={0.15} fill="none" />
          <path d={bold.join('')} stroke={FRAME} strokeWidth={0.4} fill="none" />

          {showCentre && hasCentreX ? (
            <line x1={cx} y1={0} x2={cx} y2={chartH} stroke={MARK} strokeWidth={0.4} opacity={0.85} />
          ) : null}
          {showCentre && hasCentreY ? (
            <line x1={0} y1={cy} x2={chartW} y2={cy} stroke={MARK} strokeWidth={0.4} opacity={0.85} />
          ) : null}

          <rect x={0} y={0} width={chartW} height={chartH} fill="none" stroke={FRAME} strokeWidth={0.6} />
        </svg>
      </div>
    </PageFrame>
  )
}

/** Solid triangle whose tip sits exactly on (x, y), pointing into the chart. */
function Triangle(props: { dir: 'up' | 'down' | 'left' | 'right'; x: number; y: number; size: number }) {
  const s = props.size
  const h = s * 1.6
  const base: CSSProperties = { position: 'absolute', width: 0, height: 0, borderStyle: 'solid' }
  const styles: Record<typeof props.dir, CSSProperties> = {
    down: {
      left: `${props.x - s}mm`,
      top: `${props.y - h}mm`,
      borderWidth: `${h}mm ${s}mm 0 ${s}mm`,
      borderColor: `${MARK} transparent transparent transparent`,
    },
    up: {
      left: `${props.x - s}mm`,
      top: `${props.y}mm`,
      borderWidth: `0 ${s}mm ${h}mm ${s}mm`,
      borderColor: `transparent transparent ${MARK} transparent`,
    },
    right: {
      left: `${props.x - h}mm`,
      top: `${props.y - s}mm`,
      borderWidth: `${s}mm 0 ${s}mm ${h}mm`,
      borderColor: `transparent transparent transparent ${MARK}`,
    },
    left: {
      left: `${props.x}mm`,
      top: `${props.y - s}mm`,
      borderWidth: `${s}mm ${h}mm ${s}mm 0`,
      borderColor: `transparent ${MARK} transparent transparent`,
    },
  }
  return <span style={{ ...base, ...styles[props.dir] }} />
}

function Legend(props: {
  project: Project
  counts: number[]
  totalStitches: number
  ink: Ink
  layout: PrintLayout
  pageNumber: number
}) {
  const { project, counts, ink, layout } = props
  const width = stitchesToPhysical(project.width, project.fabric)
  const height = stitchesToPhysical(project.height, project.fabric)
  const multiPage = layout.pagesX * layout.pagesY > 1

  return (
    <PageFrame width={A4_SHORT_MM} height={A4_LONG_MM} pageLabel={`${props.pageNumber}/${props.pageNumber}`}>
      <div style={{ fontSize: '3mm' }}>
        <h2 style={{ fontSize: '4.5mm', margin: '0 0 2mm', fontWeight: 700 }}>{project.name}</h2>
        <p style={{ margin: '0 0 4mm', fontSize: '3mm' }}>
          {t.summary(
            project.width,
            project.height,
            formatLength(width, project.fabric.displayUnit),
            formatLength(height, project.fabric.displayUnit),
            project.fabric.count,
            project.fabric.countUnit === 'cm',
            props.totalStitches,
          )}
        </p>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '0.4mm solid #111827', textAlign: 'left' }}>
              <th style={{ padding: '1mm' }}>{t.colSymbol}</th>
              <th style={{ padding: '1mm' }}>{t.colColor}</th>
              <th style={{ padding: '1mm' }}>DMC</th>
              <th style={{ padding: '1mm' }}>{t.colName}</th>
              <th style={{ padding: '1mm', textAlign: 'right' }}>{t.colStitches}</th>
              <th style={{ padding: '1mm', textAlign: 'right' }}>{t.colThread}</th>
            </tr>
          </thead>
          <tbody>
            {project.palette.map((thread, index) => {
              const color = dmcByCode(thread.code)
              const count = counts[index] ?? 0
              return (
                <tr key={`${thread.code}-${index}`} style={{ borderBottom: '0.15mm solid #9ca3af' }}>
                  <td style={{ padding: '1mm', fontWeight: 700, textAlign: 'center' }}>
                    {thread.symbol}
                  </td>
                  <td style={{ padding: '1mm' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '6mm',
                        height: '3.5mm',
                        background: ink === 'bw' ? '#fff' : color.hex,
                        border: '0.2mm solid #111827',
                      }}
                    />
                  </td>
                  <td style={{ padding: '1mm', fontWeight: 600 }}>{color.code}</td>
                  <td style={{ padding: '1mm' }}>{color.name}</td>
                  <td style={{ padding: '1mm', textAlign: 'right' }}>{count}</td>
                  <td style={{ padding: '1mm', textAlign: 'right' }}>
                    {t.metres(estimateThreadMetres(count, project.fabric))}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <p style={{ marginTop: '4mm', fontSize: '2.6mm', color: '#4b5563' }}>
          {t.lengthsNote}
        </p>

        {multiPage ? (
          <div style={{ marginTop: '6mm' }}>
            <h3 style={{ fontSize: '3.4mm', fontWeight: 700, margin: '0 0 2mm' }}>
              {t.assembly}
            </h3>
            <div
              style={{
                display: 'inline-grid',
                gridTemplateColumns: `repeat(${layout.pagesX}, 14mm)`,
                gridAutoRows: layout.orientation === 'portrait' ? '19mm' : '10mm',
                border: `0.4mm solid ${FRAME}`,
              }}
            >
              {Array.from({ length: layout.pagesX * layout.pagesY }, (_, i) => (
                <span
                  key={i}
                  style={{
                    border: '0.2mm solid #9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '3.4mm',
                  }}
                >
                  {i + 1}
                </span>
              ))}
            </div>
            <p style={{ marginTop: '2mm', fontSize: '2.6mm', color: '#4b5563' }}>
              {t.assemblyNote}
            </p>
          </div>
        ) : null}
      </div>
    </PageFrame>
  )
}
