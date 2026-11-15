import { useRef, useState, type ReactNode } from 'react'
import { FileJson, FileText } from 'lucide-react'
import { importPatternPdf, type ImportedPattern } from '../lib/pdfImport'
import { lastMotifFolder } from '../lib/folders'
import type { Fabric, Project, ProjectKind } from '../lib/types'
import { ImageImport, type ImageImportResult } from './ImageImport'
import { KindFields } from './KindFields'
import { PdfImportDialog } from './PdfImportDialog'
import { ProjectSettings, type ProjectSettingsResult } from './ProjectSettings'
import { Button, Modal, SegmentedControl } from './ui'
import { CreateBody } from './CreateLayout'
import { t } from './CreateDialog.i18n'

export type CreateSource = 'blank' | 'image' | 'pdf' | 'json'

export type CreatePreset = { kind: ProjectKind; source: CreateSource; folderId?: string }

/** Drop zone for one file (PDF chart, exported .json). */
function FileDrop(props: { accept: string; label: ReactNode; icon: ReactNode; busy?: boolean; onFile: (file: File) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  return (
    <>
      <input
        ref={input}
        type="file"
        accept={props.accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) props.onFile(file)
        }}
      />
      <button
        type="button"
        disabled={props.busy}
        onClick={() => input.current?.click()}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          const file = event.dataTransfer.files[0]
          if (file) props.onFile(file)
        }}
        className={`flex w-full flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center text-sm ${
          dragging ? 'border-sky-500 bg-sky-500/10 text-sky-300' : 'border-panel-line text-slate-400 hover:border-slate-400'
        }`}
      >
        {props.icon}
        {props.busy ? t.reading : props.label}
      </button>
    </>
  )
}

/**
 * The one window to create something: a project or a library motif (type),
 * blank or from an image, a PDF chart or an exported file (source). Menus
 * and buttons only open it with the type and source already chosen.
 */
export function CreateDialog(props: {
  preset: CreatePreset
  fabric: Fabric
  onBlank: (result: ProjectSettingsResult) => void
  onImage: (result: ImageImportResult) => void
  onPdf: (project: Project) => void
  /** An exported .json, to open as the chosen type. */
  onJson: (file: File, kind: ProjectKind, folderId: string | undefined) => void
  onFoldersChange: () => void
  onClose: () => void
}) {
  const [kind, setKind] = useState<ProjectKind>(props.preset.kind)
  const [folderId, setFolderId] = useState(props.preset.folderId ?? lastMotifFolder())
  const [source, setSource] = useState<CreateSource>(props.preset.source)
  const [pdf, setPdf] = useState<{ fileName: string; pattern: ImportedPattern } | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [reading, setReading] = useState(false)
  const motif = kind === 'motif'
  const title = t.title(motif)

  const header = (
    <div className="grid shrink-0 gap-4 border-b border-panel-line pb-4 md:grid-cols-2">
      <KindFields
        compact
        kind={kind}
        onKindChange={setKind}
        folderId={folderId}
        onFolderChange={setFolderId}
        onFoldersChange={props.onFoldersChange}
      />
      <div>
        <span className="mb-1 block text-xs font-medium text-slate-400">{t.from}</span>
        <SegmentedControl<CreateSource>
          value={source}
          onChange={setSource}
          options={[
            { value: 'blank', label: t.blank, title: t.blankTitle },
            { value: 'image', label: t.image, title: t.imageTitle },
            { value: 'pdf', label: t.pdf, title: t.pdfTitle },
            { value: 'json', label: t.json, title: t.jsonTitle },
          ]}
        />
      </div>
    </div>
  )

  if (source === 'blank') {
    return (
      <ProjectSettings
        mode="new"
        initial={{
          name: t.defaultName(motif),
          width: motif ? 30 : 80,
          height: motif ? 30 : 80,
          fabric: props.fabric,
          kind,
          folderId,
        }}
        create={{ header, kind, folderId: motif ? folderId : undefined }}
        onSubmit={props.onBlank}
        onClose={props.onClose}
      />
    )
  }

  if (source === 'image') {
    return (
      <ImageImport
        header={header}
        kind={kind}
        folderId={motif ? folderId : undefined}
        fabric={props.fabric}
        onCreate={props.onImage}
        onClose={props.onClose}
      />
    )
  }

  if (source === 'pdf' && pdf) {
    return (
      <PdfImportDialog
        header={header}
        kind={kind}
        folderId={motif ? folderId : undefined}
        fileName={pdf.fileName}
        pattern={pdf.pattern}
        onOpen={props.onPdf}
        onClose={props.onClose}
      />
    )
  }

  const readPdf = (file: File) => {
    setPdfError(null)
    setReading(true)
    file
      .arrayBuffer()
      .then(importPatternPdf)
      .then((pattern) => setPdf({ fileName: file.name, pattern }))
      .catch((cause: unknown) => setPdfError(cause instanceof Error ? cause.message : t.readFailed))
      .finally(() => setReading(false))
  }

  return (
    <Modal
      xl
      fill
      title={title}
      onClose={props.onClose}
      footer={
        <Button onClick={props.onClose}>{t.cancel}</Button>
      }
    >
      <CreateBody header={header}>
      <div className="mx-auto max-w-2xl space-y-4 pt-6">
        {source === 'pdf' ? (
          <>
            <FileDrop
              accept="application/pdf,.pdf"
              busy={reading}
              icon={<FileText size={28} />}
              label={
                <>
                  {t.pdfDrop}
                  <br />
                  <span className="text-xs text-slate-500">
                    {t.pdfDropHint}
                  </span>
                </>
              }
              onFile={readPdf}
            />
            {pdfError ? (
              <p className="rounded-md border border-amber-600/50 bg-amber-500/10 p-2.5 text-xs text-amber-200">
                {pdfError}
                <br />
                {t.pdfTip}
              </p>
            ) : null}
          </>
        ) : (
          <FileDrop
            accept="application/json,.json"
            icon={<FileJson size={28} />}
            label={
              <>
                {t.jsonDrop}
                <br />
                <span className="text-xs text-slate-500">
                  {t.jsonDropHint(motif)}
                </span>
              </>
            }
            onFile={(file) => props.onJson(file, kind, motif ? folderId : undefined)}
          />
        )}
        {source === 'json' ? (
          <p className="text-[11px] text-slate-500">
            {t.backupHint}
          </p>
        ) : null}
      </div>
      </CreateBody>
    </Modal>
  )
}
