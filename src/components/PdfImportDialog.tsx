import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, FileText } from 'lucide-react'
import { DMC_BY_CODE, dmcByCode } from '../lib/dmc'
import { patternToProject } from '../lib/pdfProject'
import type { ImportedPattern } from '../lib/pdfImport'
import type { Project, ProjectKind } from '../lib/types'
import { Button, Field, Modal, TextInput } from './ui'
import { rememberMotifFolder } from '../lib/folders'
import { CreateBody } from './CreateLayout'
import { formatNumber } from '../i18n'
import { t as msg } from './PdfImportDialog.i18n'

/** Review what was read from the PDF before opening it as a project. */
export function PdfImportDialog(props: {
  fileName: string
  pattern: ImportedPattern
  /** Shared header of the « Créer » window (type and source). */
  header: ReactNode
  kind: ProjectKind
  folderId?: string
  onOpen: (project: Project) => void
  onClose: () => void
}) {
  const { pattern } = props
  const [name, setName] = useState(pattern.name)
  const { folderId } = props
  const motif = props.kind === 'motif'
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const rebuilt = pattern.threads.reduce((n, t) => n + t.found, 0)
  const unknown = pattern.threads.filter((t) => !DMC_BY_CODE.has(t.code))
  const conform =
    pattern.warnings.length === 0 &&
    (pattern.declaredTotal === null || pattern.declaredTotal === rebuilt) &&
    pattern.threads.every((t) => t.declared === null || t.declared === t.found)

  const colors = useMemo(() => pattern.threads.map((t) => dmcByCode(t.code).hex), [pattern.threads])

  // Thumbnail of the rebuilt grid, one pixel block per stitch.
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const scale = Math.max(1, Math.floor(Math.min(320 / pattern.width, 320 / pattern.height)))
    canvas.width = pattern.width * scale
    canvas.height = pattern.height * scale
    ctx.fillStyle = '#f7f4ee'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    for (let y = 0; y < pattern.height; y++) {
      for (let x = 0; x < pattern.width; x++) {
        const value = pattern.cells[y * pattern.width + x]
        if (value < 0) continue
        ctx.fillStyle = colors[value] ?? '#888'
        ctx.fillRect(x * scale, y * scale, scale, scale)
      }
    }
  }, [colors, pattern])

  return (
    <Modal
      xl
      fill
      title={motif ? msg.createMotif : msg.createProject}
      onClose={props.onClose}
      footer={
        <>
          <span className="mr-auto flex items-center gap-1.5 text-xs text-slate-500">
            <FileText size={13} /> {props.fileName}
          </span>
          <Button size="sm" onClick={props.onClose}>
            {msg.cancel}
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              const project = patternToProject(pattern, name.trim() || pattern.name)
              if (motif) rememberMotifFolder(folderId)
              props.onOpen(motif ? { ...project, kind: 'motif', folderId } : project)
            }}
          >
            {motif ? msg.addToLibrary : msg.openInTab}
          </Button>
        </>
      }
    >
      <CreateBody header={props.header}>
      <div
        className={`mb-4 flex items-start gap-2 rounded-md border p-2.5 text-xs ${
          conform
            ? 'border-emerald-600/50 bg-emerald-500/10 text-emerald-400'
            : 'border-amber-600/50 bg-amber-500/10 text-amber-300'
        }`}
      >
        {conform ? <CheckCircle2 size={15} className="shrink-0" /> : <AlertTriangle size={15} className="shrink-0" />}
        <div>
          <p className="font-medium">
            {msg.found(rebuilt, pattern.declaredTotal, conform)}
          </p>
          {pattern.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
          {unknown.length > 0 ? (
            <p>{msg.unknown(unknown.map((t) => t.code).join(', '))}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-5">
        <div className="shrink-0 self-start lg:sticky lg:top-0">
          <canvas ref={canvasRef} className="max-h-80 max-w-80 rounded border border-panel-line" />
        </div>
        <div className="min-w-64 flex-1 space-y-3">
          <Field label={motif ? msg.motifName : msg.projectName}>
            <TextInput value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <p className="text-xs text-slate-400">
            {msg.summary(pattern.width, pattern.height, pattern.sections, pattern.perInch)}
          </p>
          {/* Long palettes scroll inside their table; the thumbnail stays visible. */}
          <div className="max-h-[42vh] overflow-y-auto pr-1">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-panel text-slate-500">
              <tr className="border-b border-panel-line">
                <th className="py-1 pr-2" />
                <th className="py-1 pr-2">DMC</th>
                <th className="py-1 pr-2">{msg.name}</th>
                <th className="py-1 pr-2 text-right">{msg.read}</th>
                <th className="py-1 pr-2 text-right">{msg.declared}</th>
                <th className="py-1" />
              </tr>
            </thead>
            <tbody>
              {pattern.threads.map((thread, i) => {
                const ok = thread.declared === null || thread.declared === thread.found
                return (
                  <tr key={thread.code} className="border-b border-panel-line/60">
                    <td className="py-1 pr-2">
                      <span className="inline-block h-3.5 w-5 rounded-sm border border-black/30" style={{ background: colors[i] }} />
                    </td>
                    <td className="py-1 pr-2 font-semibold text-slate-200">{thread.code}</td>
                    <td className="py-1 pr-2 text-slate-300">{thread.name || dmcByCode(thread.code).name}</td>
                    <td className="py-1 pr-2 text-right tabular-nums">{formatNumber(thread.found)}</td>
                    <td className="py-1 pr-2 text-right tabular-nums text-slate-500">
                      {thread.declared != null ? formatNumber(thread.declared) : '—'}
                    </td>
                    <td className={`py-1 ${ok ? 'text-emerald-400' : 'text-amber-300'}`}>{ok ? '✓' : '⚠'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
          <p className="text-[11px] text-slate-500">
            {msg.fullOnly}
          </p>
        </div>
      </div>
      </CreateBody>
    </Modal>
  )
}
