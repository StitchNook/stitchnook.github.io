import { useState, type ReactNode } from 'react'
import { clampSize } from '../lib/grid'
import { FabricSizeFields } from './FabricSizeFields'
import { Button, Field, Modal, TextInput } from './ui'
import type { Fabric, Project, ProjectKind } from '../lib/types'
import { rememberMotifFolder } from '../lib/folders'
import { KindFields } from './KindFields'
import { CreateBody } from './CreateLayout'

/** In the « Créer » window, the shared layout; otherwise the plain modal body. */
const Body = (props: { header?: ReactNode; children: ReactNode }) =>
  props.header !== undefined ? <CreateBody header={props.header}>{props.children}</CreateBody> : <>{props.children}</>
import { shortcut } from '../lib/platform'
import { t } from './ProjectSettings.i18n'
import { SupportButton } from './SupportCard'

export type ProjectSettingsResult = {
  name: string
  width: number
  height: number
  fabric: Fabric
  kind: ProjectKind
  folderId?: string
}

export type ProjectSettingsProps = {
  mode: 'new' | 'edit'
  initial: Pick<Project, 'name' | 'width' | 'height' | 'fabric' | 'kind' | 'folderId'>
  /** Set when editing, to warn before stitches get cropped away. */
  currentSize?: { width: number; height: number }
  /** In the « Créer » window: its shared header, and the type and folder chosen there. */
  create?: { header: ReactNode; kind: ProjectKind; folderId?: string }
  onSubmit: (result: ProjectSettingsResult) => void
  onClose: () => void
}

export function ProjectSettings(props: ProjectSettingsProps) {
  const [name, setName] = useState(props.initial.name)
  const [fabric, setFabric] = useState<Fabric>(props.initial.fabric)
  const [width, setWidth] = useState(props.initial.width)
  const [height, setHeight] = useState(props.initial.height)
  const [ownKind, setKind] = useState<ProjectKind>(props.initial.kind ?? 'project')
  const kind = props.create?.kind ?? ownKind
  // A new motif goes where the last one went, unless a folder is given.
  const [ownFolderId, setFolderId] = useState(props.initial.folderId)
  const folderId = props.create ? props.create.folderId : ownFolderId
  const motif = kind === 'motif'

  const cropping =
    props.currentSize &&
    (width < props.currentSize.width || height < props.currentSize.height)

  return (
    <Modal
      xl={props.create !== undefined}
      fill={props.create !== undefined}
      title={t.title(props.create ? 'create' : props.mode, motif)}
      onClose={props.onClose}
      footer={
        <>
          {props.mode === 'new' ? <SupportButton /> : null}
          <Button onClick={props.onClose}>{t.cancel}</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (motif) rememberMotifFolder(folderId)
              props.onSubmit({
                name: name.trim() || t.untitled(motif),
                width: clampSize(width),
                height: clampSize(height),
                fabric,
                kind,
                folderId: motif ? folderId : undefined,
              })
            }}
          >
            {props.mode === 'new' ? t.create(motif) : t.apply}
          </Button>
        </>
      }
    >
      <Body header={props.create?.header}>
      <div className={`space-y-4 ${props.create ? 'mx-auto max-w-2xl' : ''}`}>
        {props.create ? null : (
          <KindFields kind={kind} onKindChange={setKind} folderId={folderId} onFolderChange={setFolderId} />
        )}

        <Field label={t.name(motif)}>
          <TextInput value={name} onChange={(event) => setName(event.target.value)} />
        </Field>



        <FabricSizeFields
          fabric={fabric}
          onFabricChange={setFabric}
          width={width}
          height={height}
          onWidthChange={setWidth}
          onHeightChange={setHeight}
        />

        {cropping ? (
          <p className="rounded-lg border border-amber-600/50 bg-amber-500/10 p-3 text-xs text-amber-200">
            {t.cropping(width, height, shortcut('mod', 'Z'))}
          </p>
        ) : null}
      </div>
      </Body>
    </Modal>
  )
}
