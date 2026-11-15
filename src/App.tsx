import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArchiveRestore, ChevronDown, CircleHelp, Heart, HardDriveDownload, LibraryBig, SquareDashed, Type, Download, FileText, FolderOpen, ImagePlus, Languages, Monitor, Moon, Plus, Printer, Settings, Sun, Upload } from 'lucide-react'
import { CanvasToolbar, ToolOptionsBar, ToolRail } from './components/Toolbar'
import { ColorFilterPanel } from './components/ColorFilterPanel'
import { ColorPalette } from './components/ColorPalette'
import { DMCModal } from './components/DMCModal'
import { GridCanvas } from './components/GridCanvas'
import type { ImageImportResult } from './components/ImageImport'
import { PrintView } from './components/PrintView'
import { ProgressPanel } from './components/ProgressPanel'
import { ProjectManager } from './components/ProjectManager'
import { ProjectSettings } from './components/ProjectSettings'
import type { ProjectSettingsResult } from './components/ProjectSettings'
import { SelectionPanel } from './components/SelectionPanel'
import { StatusBar } from './components/StatusBar'
import { TextPanel } from './components/TextPanel'
import { PreviewActions } from './components/PreviewActions'
import { HelpCenter } from './components/HelpCenter'
import { useModifiers } from './hooks/useModifiers'
import { useTheme } from './hooks/useTheme'
import { ReferencePanel } from './components/ReferencePanel'
import { ToolPanel } from './components/ToolPanel'
import { CropEditor } from './components/ImageImport'
import { Modal } from './components/ui'
import { FULL_CROP } from './lib/imageConvert'
import { encodeReference, fitToGrid, loadReference, saveReference, type Reference } from './lib/reference'
import { Menu } from './components/Menu'
import { TabBar } from './components/TabBar'
import { useTabs } from './hooks/useTabs'
import { clampSelection, extractSelection, projectToPatch } from './lib/selection'
import { Button } from './components/ui'
import { ProjectNameField } from './components/ProjectNameField'
import { useAutosave } from './hooks/useAutosave'
import { floatingPatch, useEditor } from './hooks/useEditor'
import { DEFAULT_DISPLAY_UNIT, createProject, useProject } from './hooks/useProject'
import { useViewport } from './hooks/useViewport'
import { dmcByCode } from './lib/dmc'
import { countByThread, countDoneByThread, resizeCells, resizeFlags } from './lib/grid'
import { BackupFileError, StorageFullError, deleteProject, exportBackup, isBackupDue, snoozeBackupReminder, exportProjectFile, getLastOpenedId, importProjectFile, isBackup, loadProject, newProjectId, saveProject, type Backup } from './lib/storage'
import { MotifManager } from './components/MotifManager'
import { RestoreDialog } from './components/RestoreDialog'
import { CreateDialog, type CreatePreset } from './components/CreateDialog'
import { monochrome, motifFromPatch } from './lib/motifs'
import { MotifLibrary, type MotifColorMode } from './components/MotifLibrary'
import { MotifDialog } from './components/MotifDialog'
import { lastMotifFolder } from './lib/folders'
import type { DisplayMode, FilterMode, Patch, Point, Project } from './lib/types'
import { computeLayout, resolveSheets, type SheetsChoice } from './lib/printLayout'
import { IS_ELECTRON, shortcut } from './lib/platform'
import { isBrushTool } from './lib/brush'
import { SHORTCUT_KEYS, isTextEntry, matches } from './lib/keys'
import { LANG, LANGS, LANG_NAMES, setLang } from './i18n'
import { KOFI_URL, SUPPORT_ENABLED } from './lib/support'
import { canPrompt, markShown, markSupporter, recordUsageDay, type SupportMoment } from './lib/supportPrompt'
import { SupportCard } from './components/SupportCard'
import { t } from './App.i18n'

const WELCOME_KEY = 'stitchly.welcomeSeen.v1'

const DEFAULT_FABRIC = { count: 14, countUnit: 'in' as const, displayUnit: DEFAULT_DISPLAY_UNIT }

function initialProject(): Project {
  const lastId = getLastOpenedId()
  if (lastId) {
    const restored = loadProject(lastId)
    if (restored) return restored
  }
  return createProject({
    name: t.firstProject,
    width: 80,
    height: 80,
    fabric: DEFAULT_FABRIC,
  })
}

type Dialog = 'none' | 'dmc' | 'replace' | 'new' | 'image' | 'settings' | 'projects' | 'motifs'

export default function App() {
  const [initial] = useState(initialProject)
  const api = useProject(initial)
  const editor = useEditor(api)
  // Left panel content: rich tools only; a pending preview (paste, shape…) shows the selection panel.
  const toolPanelKind =
    editor.tool === 'text'
      ? 'text'
      : editor.tool === 'select'
        ? 'select'
        : editor.tool === 'motif'
          ? 'motif'
          : editor.floating
            ? 'floating'
            : null
  const viewportApi = useViewport()
  const save = useAutosave(api.project)
  const { project } = api

  // "No recent backup" reminder, checked when the app opens (it is about weeks).
  const [backupDue, setBackupDue] = useState(() => isBackupDue())
  const backupAll = () => {
    save.flush()
    exportBackup()
    setBackupDue(false)
  }

  const [dialog, setDialog] = useState<Dialog>('none')
  /** Bumped when library motifs are created, renamed or removed. */
  const [motifVersion, setMotifVersion] = useState(0)
  // Text preview dismissed by a validation / Escape: the shared bar can show it again.
  const [textRestoreToken, setTextRestoreToken] = useState(0)
  const [textRestorable, setTextRestorable] = useState(false)
  const [printing, setPrinting] = useState(false)
  // Help centre: closed, or open on a topic.
  const [help, setHelp] = useState<string | null>(null)
  const [welcome, setWelcome] = useState(() => {
    try {
      return localStorage.getItem(WELCOME_KEY) === null
    } catch {
      return false
    }
  })
  const dismissWelcome = () => {
    setWelcome(false)
    try {
      localStorage.setItem(WELCOME_KEY, '1')
    } catch {
      /* Storage unavailable: the card may show again next time. */
    }
  }
  const mods = useModifiers()

  // Tip suggestion after a moment where the app helped (see lib/supportPrompt).
  const [supportMoment, setSupportMoment] = useState<SupportMoment | null>(null)
  const suggestSupport = useCallback((moment: SupportMoment, delay = 0) => {
    window.setTimeout(() => {
      if (canPrompt(moment)) setSupportMoment((current) => current ?? moment)
    }, delay)
  }, [])
  useEffect(() => {
    recordUsageDay()
    suggestSupport('loyal', 2 * 60 * 1000)
  }, [suggestSupport])

  /* Reference layer: one per project, kept apart from the project data. */
  const [referenceState, setReferenceState] = useState(() => ({ id: '', reference: null as Reference | null }))
  if (referenceState.id !== project.id) {
    setReferenceState({ id: project.id, reference: loadReference(project.id) })
  }
  const reference = referenceState.reference
  const [referenceEditing, setReferenceEditing] = useState(false)
  /** Tab hides both side panels, to draw with the whole window. */
  const [panelsHidden, setPanelsHidden] = useState(false)
  const [referenceError, setReferenceError] = useState<string | null>(null)
  const [referenceCrop, setReferenceCrop] = useState<ImageBitmap | null>(null)
  const setReference = useCallback(
    (next: Reference | null) => setReferenceState((current) => ({ ...current, reference: next })),
    [],
  )
  // Saved shortly after it stops changing (dragging it fires many updates).
  useEffect(() => {
    const id = referenceState.id
    if (!id) return
    const timer = window.setTimeout(() => {
      try {
        saveReference(id, referenceState.reference)
        setReferenceError(null)
      } catch (cause) {
        setReferenceError(cause instanceof Error ? cause.message : t.saveFailed)
      }
    }, 400)
    return () => window.clearTimeout(timer)
  }, [referenceState])
  const loadReferenceFile = useCallback(
    (file: File) => {
      encodeReference(file)
        .then(({ src, width, height }) => {
          setReference({
            src,
            naturalWidth: width,
            naturalHeight: height,
            ...fitToGrid(width, height, project.width, project.height),
            opacity: 0.5,
            above: false,
            visible: true,
          })
        })
        .catch(() => setReferenceError(t.unreadableImage))
    },
    [project.height, project.width, setReference],
  )
  const { choice: themeChoice, theme, setChoice: setThemeChoice } = useTheme()
  const [display, setDisplay] = useState<DisplayMode>('color')
  const [showGrid, setShowGrid] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [showProgress, setShowProgress] = useState(true)
  const [printSheets, setPrintSheets] = useState<SheetsChoice>('auto')
  const [showPages, setShowPages] = useState(false)
  const printLayout = useMemo(
    () =>
      computeLayout(
        project.width,
        project.height,
        resolveSheets(project.width, project.height, printSheets),
      ),
    [printSheets, project.height, project.width],
  )
  const [filterMode, setFilterMode] = useState<FilterMode>('off')
  const [activeFilter, setActiveFilter] = useState<Set<number>>(new Set())
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  /** Palette index whose DMC reference is being swapped (dialog 'replace'). */
  const [replaceTarget, setReplaceTarget] = useState(-1)

  /* ----------------------------------------------------------- derived data */

  const colors = useMemo(
    () => project.palette.map((thread) => dmcByCode(thread.code).hex),
    [project.palette],
  )
  const symbols = useMemo(() => project.palette.map((thread) => thread.symbol), [project.palette])
  const counts = useMemo(
    () => countByThread(project.cells, project.palette.length),
    [project.cells, project.palette.length],
  )
  const doneCounts = useMemo(
    () => countDoneByThread(project.cells, project.done, project.palette.length),
    [project.cells, project.done, project.palette.length],
  )
  const totalStitches = useMemo(() => counts.reduce((sum, n) => sum + n, 0), [counts])
  const doneStitches = useMemo(() => doneCounts.reduce((sum, n) => sum + n, 0), [doneCounts])

  // Embroidery just finished (not a finished project being opened): suggest a tip.
  const finishedRef = useRef<{ id: string; finished: boolean } | null>(null)
  useEffect(() => {
    const finished = totalStitches >= 100 && doneStitches === totalStitches
    const previous = finishedRef.current
    finishedRef.current = { id: project.id, finished }
    if (finished && previous?.id === project.id && !previous.finished) suggestSupport('complete', 800)
  }, [doneStitches, totalStitches, project.id, suggestSupport])
  const paletteCodes = useMemo(
    () => new Set(project.palette.map((thread) => thread.code)),
    [project.palette],
  )

  const { setActiveThread } = editor
  // The effect below repairs `activeThread`, but render runs first: after
  // deleting a thread the old index can briefly point past the palette.
  const activeThread =
    editor.activeThread >= 0 && editor.activeThread < project.palette.length
      ? editor.activeThread
      : -1

  // Keep a thread selected so the pencil is always usable.
  const rawThread = editor.activeThread
  useEffect(() => {
    if (project.palette.length === 0) {
      if (rawThread !== -1) setActiveThread(-1)
    } else if (rawThread < 0 || rawThread >= project.palette.length) {
      setActiveThread(project.palette.length - 1)
    }
  }, [rawThread, project.palette.length, setActiveThread])

  /* -------------------------------------------------------------- commands */

  // Before the grid changes under them, selection and previews go (no loss:
  // previews never wrote anything) and the colour filter resets.
  const { setSelection, cancelFloating } = editor
  const beforeSwitch = useCallback(() => {
    setSelection(null)
    cancelFloating()
    setActiveFilter(new Set())
    setFilterMode('off')
  }, [cancelFloating, setSelection])

  const tabs = useTabs({
    api,
    viewport: viewportApi.viewport,
    setViewport: viewportApi.setViewport,
    flush: save.flush,
    beforeSwitch,
  })

  /** New, imported or duplicated projects open in their own tab. */
  const openProject = useCallback(
    (next: Project, mode: 'tab' | 'replace' = 'tab') => {
      if (mode === 'tab') tabs.openInNewTab(next)
      else tabs.replaceCurrent(next)
      setDialog('none')
    },
    [tabs],
  )

  const applySettings = useCallback(
    (result: ProjectSettingsResult, mode: 'new' | 'edit') => {
      if (mode === 'new') {
        openProject({ ...createProject(result), kind: result.kind, folderId: result.folderId })
        if (result.kind === 'motif') setMotifVersion((v) => v + 1)
        return
      }
      if ((result.kind === 'motif') !== (project.kind === 'motif') || result.folderId !== project.folderId) {
        setMotifVersion((v) => v + 1)
      }
      api.apply((current) => ({
        ...current,
        kind: result.kind,
        folderId: result.folderId,
        name: result.name,
        fabric: result.fabric,
        width: result.width,
        height: result.height,
        cells:
          current.width === result.width && current.height === result.height
            ? current.cells
            : resizeCells(current.cells, current.width, current.height, result.width, result.height),
        done:
          current.width === result.width && current.height === result.height
            ? current.done
            : resizeFlags(current.done, current.width, current.height, result.width, result.height),
      }))
      editor.setSelection(null)
      setDialog('none')
    },
    [api, editor, openProject, project.folderId, project.kind],
  )

  const createFromImage = (result: ImageImportResult) => {
    const created = { ...createProject(result), palette: result.palette, cells: result.cells }
    if (result.kind === 'motif') addCompleteMotif({ ...created, kind: 'motif', folderId: result.folderId })
    else {
      openProject(created)
      suggestSupport('import', 1500)
    }
  }

  const pickThread = useCallback(
    (code: string) => {
      setActiveThread(api.addThread(code))
    },
    [api, setActiveThread],
  )

  const markThread = useCallback(
    (index: number, done: boolean) => {
      api.apply((current) => {
        const next = new Uint8Array(current.done)
        for (let i = 0; i < current.cells.length; i++) {
          if (current.cells[i] === index) next[i] = done ? 1 : 0
        }
        return { ...current, done: next }
      })
    },
    [api],
  )

  const resetProgress = useCallback(() => {
    if (!window.confirm(t.resetProgress)) return
    api.apply((current) => ({
      ...current,
      done: new Uint8Array(current.width * current.height),
    }))
  }, [api])

  const removeThread = useCallback(
    (index: number) => {
      const count = counts[index] ?? 0
      if (
        count > 0 &&
        !window.confirm(t.removeThread(count))
      ) {
        return
      }
      api.removeThreadAt(index)
    },
    [api, counts],
  )

  // New text previews appear in the middle of what is on screen. Read from a
  // ref so panning or zooming never re-sends (and so resets) the preview.
  const { previewText: showTextPreview } = editor
  const viewCentre = useRef({ x: 0, y: 0 })
  useEffect(() => {
    const { viewport } = viewportApi
    viewCentre.current =
      canvasSize.width > 0
        ? {
            x: (canvasSize.width / 2 - viewport.x) / viewport.scale,
            y: (canvasSize.height / 2 - viewport.y) / viewport.scale,
          }
        : { x: project.width / 2, y: project.height / 2 }
  })
  const previewText = useCallback(
    (patch: Patch) => showTextPreview(patch, viewCentre.current),
    [showTextPreview],
  )

  /** Drop another model into this one, as a transformable preview. */
  const insertProject = useCallback(
    (source: Project, options: { monoCode?: string; at?: Point } = {}) => {
      const patch = projectToPatch(source)
      if (!patch) {
        window.alert(t.nothingToInsert(source.name))
        return false
      }
      if (editor.floating) editor.cancelFloating()
      const centre = viewCentre.current
      const at = options.at ?? { x: Math.round(centre.x - patch.width / 2), y: Math.round(centre.y - patch.height / 2) }
      if (options.monoCode) editor.placeForeign(monochrome(patch), [options.monoCode], at)
      else editor.placeForeign(patch, source.palette.map((thread) => thread.code), at)
      setDialog('none')
      return true
    },
    [editor],
  )

  /* -------------------------------------------------------- motif library */

  const [motifColorMode, setMotifColorMode] = useState<MotifColorMode>('original')
  const [motifDialog, setMotifDialog] = useState<
    null | { mode: 'selection' } | { mode: 'convert' | 'rename'; project: Project }
  >(null)
  /** The « Créer » window, opened with a type and a source already chosen. */
  const [create, setCreate] = useState<CreatePreset | null>(null)

  // The tip card waits until nothing else asks for attention; once seen, the next one is weeks away.
  const supportVisible = supportMoment !== null && !welcome && help === null && dialog === 'none' && create === null
  useEffect(() => {
    if (supportVisible && supportMoment !== null) markShown(supportMoment)
  }, [supportVisible, supportMoment])
  // Right after printing (or saving the PDF) from the print view.
  useEffect(() => {
    if (!printing) return
    const onAfterPrint = () => suggestSupport('print', 600)
    window.addEventListener('afterprint', onAfterPrint)
    return () => window.removeEventListener('afterprint', onAfterPrint)
  }, [printing, suggestSupport])
  /** The library manager's start folder. */
  const [managerFolder, setManagerFolder] = useState<string | null>(null)
  const [restoring, setRestoring] = useState<{ backup: Backup; fileName: string } | null>(null)
  const restoreInput = useRef<HTMLInputElement>(null)
  // The motif shown in the pending preview, so the colour choice can redo it in place.
  const motifPreview = useRef<Project | null>(null)
  useEffect(() => {
    if (!editor.floating) motifPreview.current = null
  }, [editor.floating])

  const insertMotif = useCallback(
    (motif: Project, mode: MotifColorMode, at?: Point) => {
      const monoCode = mode === 'active' && activeThread >= 0 ? project.palette[activeThread]?.code : undefined
      if (insertProject(motif, { monoCode, at })) motifPreview.current = motif
    },
    [activeThread, insertProject, project.palette],
  )

  const changeMotifColorMode = (mode: MotifColorMode) => {
    setMotifColorMode(mode)
    const pending = motifPreview.current
    if (pending && editor.floating) insertMotif(pending, mode, { x: editor.floating.x, y: editor.floating.y })
  }

  /** Stitches to keep as a motif: the pending preview, or else the selection. */
  const motifSource = (): Patch | null => {
    if (editor.floating) return floatingPatch(editor.floating)
    const sel = editor.selection && clampSelection(editor.selection, project.width, project.height)
    return sel ? extractSelection(project.cells, project.width, sel) : null
  }

  const storeMotif = (motif: Project): boolean => {
    try {
      saveProject(motif)
      setMotifVersion((v) => v + 1)
      return true
    } catch (cause) {
      window.alert(cause instanceof StorageFullError ? cause.message : t.saveFailed)
      return false
    }
  }

  /** Rename / recategorise / change the kind of a stored project, live if it is open here. */
  const updateStored = (target: Project, change: Partial<Project>) => {
    if (target.id === project.id) {
      api.apply((current) => ({ ...current, ...change }))
      setMotifVersion((v) => v + 1)
      return
    }
    storeMotif({ ...target, ...change, updatedAt: Date.now() })
  }

  const editMotif = (motif: Project) => {
    if (tabs.tabs.some((tab) => tab.id === motif.id)) tabs.switchTo(motif.id)
    else openProject(motif, 'tab')
  }

  /** Already confirmed by the caller. Motifs open in a tab leave it first. */
  const deleteMotifs = (motifs: Project[]) => {
    for (const motif of motifs) {
      const open = tabs.tabs.some((tab) => tab.id === motif.id)
      if (open && tabs.tabs.length <= 1) {
        window.alert(t.onlyTab(motif.name))
        continue
      }
      if (open) tabs.close(motif.id)
      deleteProject(motif.id)
    }
    setMotifVersion((v) => v + 1)
  }

  const duplicateMotif = (motif: Project) => {
    const now = Date.now()
    storeMotif({ ...motif, id: newProjectId(), name: t.copyName(motif.name), createdAt: now, updatedAt: now })
  }

  const importMotifFile = (file: File, folderId: string | undefined) => {
    importProjectFile(file)
      .then((imported) => {
        // Into the folder shown, unless at the root and the file knows its own folder.
        storeMotif({ ...imported, kind: 'motif', folderId: folderId ?? imported.folderId })
      })
      .catch((cause: unknown) => window.alert(cause instanceof Error ? cause.message : t.importFailed))
  }

  /** A finished motif (from an image or a PDF): filed, then shown in the manager. */
  function addCompleteMotif(motif: Project) {
    if (!storeMotif(motif)) return
    setManagerFolder(motif.folderId ?? null)
    setDialog('motifs')
  }

  const openManager = (folderId: string | null) => {
    setManagerFolder(folderId)
    setDialog('motifs')
  }

  const readBackupFile = (file: File) => {
    file
      .text()
      .then((text) => {
        const parsed: unknown = JSON.parse(text)
        if (!isBackup(parsed)) throw new Error(t.notBackup)
        setRestoring({ backup: parsed, fileName: file.name })
      })
      .catch((cause: unknown) =>
        window.alert(cause instanceof SyntaxError ? t.invalidJson : cause instanceof Error ? cause.message : t.readFailed),
      )
  }

  const fitView = useCallback(() => {
    viewportApi.fit(project.width, project.height, canvasSize)
  }, [canvasSize, project.height, project.width, viewportApi])

  /* ------------------------------------------------------------- shortcuts */

  // The listener is installed once and always runs the latest logic. Re-adding
  // it on every render (as before) lost keystrokes: a state update made by an
  // earlier key listener re-rendered mid-dispatch, removing this listener
  // before the browser reached it.
  const clipboardHandler = useRef<(event: ClipboardEvent) => void>(() => {})
  useLayoutEffect(() => {
    clipboardHandler.current = (event: ClipboardEvent) => {
      if (isTextEntry(document.activeElement)) return
      event.preventDefault()
      if (event.type === 'copy') editor.copy()
      else if (event.type === 'cut') editor.cut()
      else editor.paste()
    }
  })

  const shortcutHandler = useRef<(event: KeyboardEvent) => void>(() => {})
  useEffect(() => {
    const listener = (event: KeyboardEvent) => shortcutHandler.current(event)
    window.addEventListener('keydown', listener)
    // The browser keeps its own undo history for text fields and, on ⌘Z,
    // may revert one that no longer has focus (refocusing it). Only the field
    // being typed in may undo its text; everywhere else ⌘Z is the model's.
    const guard = (event: InputEvent) => {
      const history = event.inputType === 'historyUndo' || event.inputType === 'historyRedo'
      if (history && event.target !== document.activeElement) event.preventDefault()
    }
    document.addEventListener('beforeinput', guard, true)
    // Copy / cut / paste of the grid also answer the clipboard events: in the
    // desktop app the Edit menu (⌘C, ⌘X, ⌘V) may take the keystroke first.
    // In a browser the keydown handler already ran and cancelled them.
    const clipboard = (event: ClipboardEvent) => clipboardHandler.current(event)
    for (const type of ['copy', 'cut', 'paste'] as const) document.addEventListener(type, clipboard)
    return () => {
      window.removeEventListener('keydown', listener)
      document.removeEventListener('beforeinput', guard, true)
      for (const type of ['copy', 'cut', 'paste'] as const) document.removeEventListener(type, clipboard)
    }
  }, [])


  useLayoutEffect(() => {
    shortcutHandler.current = (event: KeyboardEvent) => {
      // Same rule as the hint highlighting (lib/keys), so a lit hint always works.
      if (isTextEntry(event.target)) {
        // Desktop app: Undo / Redo have no menu shortcut (see electron/main.cjs),
        // so a text field's own undo is run here. Browsers do it natively.
        if (IS_ELECTRON && (event.metaKey || event.ctrlKey) && ['z', 'y'].includes(event.key.toLowerCase())) {
          event.preventDefault()
          const redo = event.key.toLowerCase() === 'y' || event.shiftKey
          document.execCommand(redo ? 'redo' : 'undo')
        }
        return
      }
      // The help centre is modal: Escape closes it, nothing else reaches the grid.
      if (help !== null) {
        if (event.key === 'Escape') setHelp(null)
        return
      }
      if (event.key === 'F1' || (event.key === '?' && !event.ctrlKey && !event.metaKey)) {
        event.preventDefault()
        setHelp((current) => current ?? 'start')
        return
      }
      const mod = event.ctrlKey || event.metaKey

      if (mod) {
        switch (event.key.toLowerCase()) {
          case 'z':
            event.preventDefault()
            if (event.shiftKey) api.redo()
            else api.undo()
            return
          case 'y':
            event.preventDefault()
            api.redo()
            return
          case 'c':
            event.preventDefault()
            editor.copy()
            return
          case 'x':
            event.preventDefault()
            editor.cut()
            return
          case 'v':
            event.preventDefault()
            editor.paste()
            return
          case 'a':
            event.preventDefault()
            editor.selectAll()
            return
          case 'd':
            // Deselect, as in image editors; a pending preview stays untouched.
            event.preventDefault()
            if (!editor.floating) editor.clearSelection()
            return
          case 's':
            event.preventDefault()
            exportProjectFile(project)
            return
          case 'p':
            event.preventDefault()
            setPrinting(true)
            return
          default:
            return
        }
      }

      switch (event.key) {
        case 'Tab': {
          // Only from the grid / page: elsewhere Tab keeps moving the focus.
          const target = event.target as Element
          if (event.altKey || event.shiftKey || !(target === document.body || target.tagName === 'CANVAS')) return
          event.preventDefault()
          setPanelsHidden((hidden) => !hidden)
          return
        }
        case 'Delete':
        case 'Backspace':
          event.preventDefault()
          editor.deleteSelection()
          return
        case 'Enter':
          if (referenceEditing) {
            event.preventDefault()
            setReferenceEditing(false)
            return
          }
          if (editor.floating) {
            event.preventDefault()
            editor.commitFloating()
          }
          return
        case 'Escape':
          if (referenceEditing) setReferenceEditing(false)
          else if (editor.floating) editor.cancelFloating()
          else if (create) setCreate(null)
          else if (dialog !== 'none') setDialog('none')
          else if (printing) setPrinting(false)
          else editor.clearSelection()
          return
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'ArrowUp':
        case 'ArrowDown': {
          // Any temporary zone: floating motif, text preview, or a selection.
          if (!editor.floating && !(editor.selection && editor.tool === 'select')) return
          event.preventDefault()
          const step = event.shiftKey ? 10 : 1
          const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0
          const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0
          editor.nudge(dx, dy)
          return
        }
      }

      // Symbol keys go by physical position, so they are one keystroke on any
      // layout (e.g. ^ and $ for the brush on a French AZERTY keyboard).
      // The brush comes first: on German / Spanish layouts the key right of P
      // prints "+", which would otherwise zoom instead of growing the brush.
      const grow = matches(event, SHORTCUT_KEYS.brushBigger)
      if ((grow || matches(event, SHORTCUT_KEYS.brushSmaller)) && isBrushTool(editor.tool)) {
        event.preventDefault()
        const current = editor.brushes[editor.tool].size
        editor.setBrush(editor.tool, { size: current + (grow ? 1 : -1) })
        return
      }
      if (matches(event, SHORTCUT_KEYS.zoomIn)) {
        event.preventDefault()
        viewportApi.zoomBy(1.25, canvasSize)
        return
      }
      if (matches(event, SHORTCUT_KEYS.zoomOut)) {
        event.preventDefault()
        viewportApi.zoomBy(0.8, canvasSize)
        return
      }

      if (event.key.toLowerCase() === 'h' && reference) {
        setReference({ ...reference, visible: !reference.visible })
        return
      }

      const tools: Record<string, Parameters<typeof editor.setTool>[0]> = {
        b: 'pencil',
        e: 'eraser',
        g: 'fill',
        i: 'picker',
        l: 'line',
        r: 'rect',
        c: 'ellipse',
        s: 'select',
        t: 'text',
        p: 'progress',
        m: 'motif',
      }
      const tool = tools[event.key.toLowerCase()]
      if (tool) editor.setTool(tool)
    }

  })

  /* ------------------------------------------------------------------ view */

  const activeColor = colors[activeThread] ?? '#64748b'

  return (
    <div className="app-root flex h-full flex-col bg-panel text-slate-200">
      <header className="no-print flex shrink-0 flex-wrap items-center gap-2 border-b border-panel-line px-3 py-2">
        {/* Application */}
        <div className="flex items-center gap-2 pr-1">
          <img src="./icon.svg" alt="" className="h-7 w-7" />
          <span className="text-sm font-semibold whitespace-nowrap text-slate-100">{t.appName}</span>
        </div>

        {/* Files: shortcuts to « Créer » · my files · backup */}
        <Menu
          width={270}
          items={[
            { heading: t.menu.create },
            {
              label: t.menu.newProject,
              icon: <Plus size={13} />,
              onSelect: () => setCreate({ kind: 'project', source: 'blank' }),
            },
            {
              label: t.menu.newMotif,
              icon: <LibraryBig size={13} />,
              title: t.menu.newMotifTitle,
              onSelect: () => setCreate({ kind: 'motif', source: 'blank' }),
            },
            {
              label: t.menu.fromImage,
              icon: <ImagePlus size={13} />,
              title: t.menu.fromImageTitle,
              onSelect: () => setCreate({ kind: 'project', source: 'image' }),
            },
            {
              label: t.menu.fromPdf,
              icon: <FileText size={13} />,
              title: t.menu.fromPdfTitle,
              onSelect: () => setCreate({ kind: 'project', source: 'pdf' }),
            },
            { heading: t.menu.myFiles },
            { label: t.menu.myProjects, icon: <FolderOpen size={13} />, onSelect: () => setDialog('projects') },
            { label: t.menu.motifLibrary, icon: <LibraryBig size={13} />, onSelect: () => openManager(null) },
            { heading: t.menu.backup },
            {
              label: t.menu.exportProject,
              icon: <Download size={13} />,
              hint: shortcut('mod', 'S'),
              onSelect: () => exportProjectFile(project),
            },
            {
              label: t.menu.openExported,
              icon: <Upload size={13} />,
              title: t.menu.openExportedTitle,
              onSelect: () => setCreate({ kind: 'project', source: 'json' }),
            },
            {
              label: t.menu.backupAll,
              icon: <HardDriveDownload size={13} />,
              title: t.menu.backupAllTitle,
              onSelect: backupAll,
            },
            {
              label: t.menu.restore,
              icon: <ArchiveRestore size={13} />,
              title: t.menu.restoreTitle,
              onSelect: () => restoreInput.current?.click(),
            },
          ]}
          trigger={(toggle, open) => (
            <Button size="sm" variant={open ? 'primary' : 'ghost'} onClick={toggle}>
              <FolderOpen size={14} /> {t.menu.file} <ChevronDown size={12} />
            </Button>
          )}
        />
        <input
          ref={restoreInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) readBackupFile(file)
          }}
        />

        <span className="mx-1 h-5 w-px bg-panel-line" />

        {/* Current project */}
        <div className="flex items-center gap-1">
          <div className="w-64">
            <ProjectNameField key={project.id} name={project.name} onRename={api.rename} />
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDialog('settings')}
            title={t.settingsTitle}
            aria-label={t.settings}
          >
            <Settings size={15} />
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Output: printing is a main feature, kept prominent */}
          <Button size="sm" variant="primary" onClick={() => setPrinting(true)} title={t.printTitle(shortcut('mod', 'P'))}>
            <Printer size={14} /> {t.print}
          </Button>

          <span className="mx-1.5 h-5 w-px bg-panel-line" />

          {/* Interface preferences and help */}
          <Menu
            alignRight
            width={170}
            items={[
              ...(
                [
                  { value: 'light', label: t.theme.light, icon: <Sun size={13} /> },
                  { value: 'dark', label: t.theme.dark, icon: <Moon size={13} /> },
                  { value: 'auto', label: t.theme.auto, icon: <Monitor size={13} /> },
                ] as const
              ).map((item) => ({
                label: `${item.label}${themeChoice === item.value ? '  ✓' : ''}`,
                icon: item.icon,
                onSelect: () => setThemeChoice(item.value),
              })),
            ]}
            trigger={(toggle) => (
              <Button
                size="sm"
                variant="ghost"
                onClick={toggle}
                title={t.themeTitle(themeChoice)}
                aria-label={t.themeLabel}
              >
                {themeChoice === 'auto' ? <Monitor size={14} /> : themeChoice === 'light' ? <Sun size={14} /> : <Moon size={14} />}
              </Button>
            )}
          />
          <Menu
            alignRight
            width={150}
            items={LANGS.map((lang) => ({
              label: `${LANG_NAMES[lang]}${lang === LANG ? '  ✓' : ''}`,
              // Changing the language reloads the page: save the pending edits first.
              onSelect: () => {
                if (lang === LANG) return
                save.flush()
                setLang(lang)
              },
            }))}
            trigger={(toggle) => (
              <Button size="sm" variant="ghost" onClick={toggle} title={t.languageTitle} aria-label={t.language}>
                <Languages size={14} /> {LANG.toUpperCase()}
              </Button>
            )}
          />
          <Button size="sm" variant="ghost" onClick={() => setHelp('start')} title={t.helpTitle}>
            <CircleHelp size={14} /> {t.help}
          </Button>
          {SUPPORT_ENABLED ? (
            <>
              <span className="mx-1.5 h-5 w-px bg-panel-line" />
              <a
                href={KOFI_URL}
                target="_blank"
                rel="noopener"
                title={t.supportTitle}
                onClick={() => markSupporter()}
                className="flex items-center gap-1.5 rounded-full border border-rose-500/50 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-500/20"
              >
                <Heart size={13} className="fill-rose-500 text-rose-500" /> {t.support}
              </a>
            </>
          ) : null}
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        <ToolRail tool={editor.tool} onChange={editor.setTool} />

        <ToolPanel
            contentKey={panelsHidden ? null : toolPanelKind}
            title={
              toolPanelKind === 'text'
                ? t.panel.text
                : toolPanelKind === 'select'
                  ? t.panel.select
                  : toolPanelKind === 'motif'
                    ? t.panel.motif
                    : t.panel.floating
            }
            icon={
              toolPanelKind === 'text' ? (
                <Type size={14} />
              ) : toolPanelKind === 'motif' ? (
                <LibraryBig size={14} />
              ) : (
                <SquareDashed size={14} />
              )
            }
            onHelp={() =>
              setHelp(toolPanelKind === 'text' ? 'tool-text' : toolPanelKind === 'motif' ? 'motifs' : 'tool-select')
            }
          >
            {/* Kept mounted so the typed text and settings survive tool switches. */}
            <div hidden={toolPanelKind !== 'text'}>
              <TextPanel
                active={editor.tool === 'text'}
                activeThread={activeThread}
                palette={project.palette}
                colors={colors}
                previewActive={editor.floating?.kind === 'text'}
                blocked={editor.floating !== null && editor.floating.kind !== 'text'}
                onPreview={previewText}
                restoreToken={textRestoreToken}
                onRestorableChange={setTextRestorable}
              />
            </div>
            {toolPanelKind === 'motif' ? (
              <MotifLibrary
                version={motifVersion}
                current={project}
                colorMode={motifColorMode}
                onColorModeChange={changeMotifColorMode}
                hasActiveThread={activeThread >= 0}
                canSaveSelection={editor.floating !== null || editor.selection !== null}
                onInsert={(motif) => insertMotif(motif, motifColorMode)}
                onEdit={editMotif}
                onSaveSelection={() => setMotifDialog({ mode: 'selection' })}
                onManage={openManager}
              />
            ) : null}
            {toolPanelKind === 'select' || toolPanelKind === 'floating' ? (
              <SelectionPanel
                editor={editor}
                onSaveAsMotif={() => setMotifDialog({ mode: 'selection' })}
              />
            ) : null}
            <PreviewActions
              editor={editor}
              restore={
                toolPanelKind === 'text'
                  ? { disabled: !textRestorable, onRestore: () => setTextRestoreToken((n) => n + 1) }
                  : undefined
              }
            />
          </ToolPanel>

        <main className="flex min-w-0 flex-1 flex-col">
          <TabBar
            tabs={tabs.tabs}
            activeId={tabs.activeId}
            saving={save.status === 'saving'}
            onSelect={tabs.switchTo}
            onClose={tabs.close}
            onCreate={(source) => setCreate({ kind: 'project', source })}
            onOpen={() => setDialog('projects')}
          />
          <CanvasToolbar
            canUndo={api.canUndo}
            canRedo={api.canRedo}
            onUndo={api.undo}
            onRedo={api.redo}
            zoom={viewportApi.viewport.scale}
            onZoomIn={() => viewportApi.zoomBy(1.25, canvasSize)}
            onZoomOut={() => viewportApi.zoomBy(0.8, canvasSize)}
            onFit={fitView}
            display={display}
            onDisplayChange={setDisplay}
            showGrid={showGrid}
            onShowGridChange={setShowGrid}
            showLabels={showLabels}
            onShowLabelsChange={setShowLabels}
            showPages={showPages}
            onShowPagesChange={setShowPages}
            printSheets={printSheets}
            onPrintSheetsChange={setPrintSheets}
            printLayout={printLayout}
            hasReference={reference !== null}
            referenceVisible={reference?.visible ?? false}
            onReferenceVisibleChange={(visible) => reference && setReference({ ...reference, visible })}
            referencePlacing={referenceEditing && reference !== null}
            onStopPlacing={() => setReferenceEditing(false)}
            referencePanel={(close) => (
          <ReferencePanel
            reference={reference}
            error={referenceError}
            editing={referenceEditing}
            onEditingChange={(editing) => {
                  setReferenceEditing(editing)
                  if (editing) close()
                }}
            onLoad={loadReferenceFile}
            onChange={setReference}
            onFit={() =>
              reference &&
              setReference({
                ...reference,
                ...fitToGrid(reference.naturalWidth, reference.naturalHeight, project.width, project.height),
              })
            }
            onCrop={() => {
              if (!reference) return
              fetch(reference.src)
                .then((r) => r.blob())
                .then((blob) => createImageBitmap(blob))
                .then(setReferenceCrop)
                .catch(() => setReferenceError(t.unreadableImage))
            }}
            onRemove={() => {
              setReferenceEditing(false)
              setReference(null)
            }}
          />
            )}
          />
          <ToolOptionsBar
            tool={editor.tool}
            brushes={editor.brushes}
            onBrushChange={editor.setBrush}
            progressMode={editor.progressMode}
            onProgressModeChange={editor.setProgressMode}
            shapeFilled={editor.shapeFilled}
            onShapeFilledChange={editor.setShapeFilled}
            hasSelection={editor.selection !== null}
            onSelectAll={editor.selectAll}
            onDeselect={editor.clearSelection}
            floating={editor.floating !== null}
            mods={mods}
            onHelp={() => setHelp(`tool-${editor.tool}`)}
          />
          <div className="min-h-0 flex-1">
            <GridCanvas
              project={project}
              colors={colors}
              symbols={symbols}
              display={display}
              showGrid={showGrid}
              showLabels={showLabels}
              printLayout={showPages ? printLayout : undefined}
              theme={theme}
              reference={reference}
              referenceEditing={referenceEditing && reference !== null}
              onReferenceChange={setReference}
              showProgress={showProgress}
              filterMode={filterMode}
              activeFilter={activeFilter}
              editor={editor}
              viewportApi={viewportApi}
              onSizeChange={setCanvasSize}
            />
          </div>
        </main>

        <aside
          hidden={panelsHidden}
          className="no-print w-80 shrink-0 overflow-y-auto border-l border-panel-line bg-panel"
        >
          <div className="flex items-center gap-2 border-b border-panel-line px-3 py-2.5">
            <span
              className="h-8 w-8 shrink-0 rounded border border-black/40"
              style={{ background: activeColor }}
            />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-100">
                {activeThread >= 0
                  ? `DMC ${project.palette[activeThread].code}`
                  : t.noThread}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                {activeThread >= 0
                  ? dmcByCode(project.palette[activeThread].code).name
                  : t.addThread}
              </p>
            </div>
          </div>

          <ColorPalette
            palette={project.palette}
            counts={counts}
            activeThread={activeThread}
            onSelect={setActiveThread}
            onRemove={removeThread}
            onReplace={(index) => {
              setReplaceTarget(index)
              setDialog('replace')
            }}
            onSymbolChange={api.setThreadSymbol}
            onOpenCatalog={() => setDialog('dmc')}
          />

          <ColorFilterPanel
            palette={project.palette}
            counts={counts}
            mode={filterMode}
            onModeChange={setFilterMode}
            active={activeFilter}
            onActiveChange={setActiveFilter}
          />

          <ProgressPanel
            palette={project.palette}
            counts={counts}
            doneCounts={doneCounts}
            showProgress={showProgress}
            onShowProgressChange={setShowProgress}
            onMarkThread={markThread}
            onResetAll={resetProgress}
          />
        </aside>
      </div>

      <StatusBar
        project={project}
        hover={editor.hover}
        totalStitches={totalStitches}
        doneStitches={doneStitches}
        save={save}
        mods={mods}
        backupDue={backupDue}
        onBackup={backupAll}
        onSnoozeBackup={() => {
          snoozeBackupReminder()
          setBackupDue(false)
        }}
      />

      {dialog === 'dmc' ? (
        <DMCModal
          paletteCodes={paletteCodes}
          onPick={pickThread}
          onRemove={(code) => {
            const index = project.palette.findIndex((thread) => thread.code === code)
            if (index !== -1) removeThread(index)
          }}
          onClose={() => setDialog('none')}
        />
      ) : null}

      {dialog === 'replace' && project.palette[replaceTarget] ? (
        <DMCModal
          title={t.replaceThread(project.palette[replaceTarget].code)}
          paletteCodes={paletteCodes}
          onPick={(code) => {
            api.replaceThread(replaceTarget, code)
            setDialog('none')
          }}
          onClose={() => setDialog('none')}
        />
      ) : null}

      {create ? (
        <CreateDialog
          preset={create}
          fabric={project.fabric}
          onBlank={(result) => {
            setCreate(null)
            applySettings(result, 'new')
            if (result.kind !== 'motif') suggestSupport('create', 1200)
          }}
          onImage={(result) => {
            setCreate(null)
            createFromImage(result)
          }}
          onPdf={(imported) => {
            setCreate(null)
            if (imported.kind === 'motif') addCompleteMotif(imported)
            else {
              openProject(imported, 'tab')
              suggestSupport('import', 1500)
            }
          }}
          onJson={(file, kind, folderId) => {
            importProjectFile(file)
              .then((imported) => {
                setCreate(null)
                if (kind === 'motif') addCompleteMotif({ ...imported, kind: 'motif', folderId: folderId ?? imported.folderId })
                else openProject({ ...imported, kind: 'project', folderId: undefined }, 'tab')
              })
              .catch((cause: unknown) => {
                // A full backup dropped here: offer to restore it.
                if (cause instanceof BackupFileError) {
                  setCreate(null)
                  setRestoring({ backup: cause.backup, fileName: file.name })
                } else window.alert(cause instanceof Error ? cause.message : t.importFailed)
              })
          }}
          onFoldersChange={() => setMotifVersion((v) => v + 1)}
          onClose={() => setCreate(null)}
        />
      ) : null}

      {dialog === 'settings' ? (
        <ProjectSettings
          mode="edit"
          initial={project}
          currentSize={{ width: project.width, height: project.height }}
          onSubmit={(result) => applySettings(result, 'edit')}
          onClose={() => setDialog('none')}
        />
      ) : null}

      {dialog === 'projects' ? (
        <ProjectManager
          current={project}
          openIds={tabs.tabs.map((tab) => tab.id)}
          onOpen={(next) => openProject(next, 'replace')}
          onOpenTab={(next) => openProject(next, 'tab')}
          onSwitch={(id) => {
            tabs.switchTo(id)
            setDialog('none')
          }}
          onInsert={(source) => insertProject(source)}
          onToLibrary={(source) => {
            setDialog('none')
            setMotifDialog({ mode: 'convert', project: source })
          }}
          onCloseTab={tabs.close}
          onCreateFrom={(source) => {
            setDialog('none')
            setCreate({ kind: 'project', source })
          }}
          onClose={() => setDialog('none')}
        />
      ) : null}

      {dialog === 'motifs' ? (
        <MotifManager
          version={motifVersion}
          current={project}
          initialFolder={managerFolder}
          onEdit={(motif) => {
            setDialog('none')
            editMotif(motif)
          }}
          onNewMotif={(folderId, source) => {
            setDialog('none')
            setCreate({ kind: 'motif', source, folderId })
          }}
          onImportFile={importMotifFile}
          onUpdate={updateStored}
          onDelete={deleteMotifs}
          onDuplicate={duplicateMotif}
          onExport={exportProjectFile}
          onToProject={(motif) => updateStored(motif, { kind: 'project', folderId: undefined })}
          onChanged={() => setMotifVersion((v) => v + 1)}
          onClose={() => setDialog('none')}
        />
      ) : null}

      {restoring ? (
        <RestoreDialog
          backup={restoring.backup}
          fileName={restoring.fileName}
          openIds={tabs.tabs.map((tab) => tab.id)}
          onDone={() => setMotifVersion((v) => v + 1)}
          onClose={() => setRestoring(null)}
        />
      ) : null}

      {motifDialog ? (
        <MotifDialog
          title={
            motifDialog.mode === 'selection'
              ? t.motifDialog.saveTitle
              : motifDialog.mode === 'convert'
                ? t.motifDialog.convertTitle
                : t.motifDialog.renameTitle
          }
          confirmLabel={motifDialog.mode === 'rename' ? t.motifDialog.save : t.motifDialog.add}
          note={
            motifDialog.mode === 'selection'
              ? t.motifDialog.selectionNote
              : motifDialog.mode === 'convert'
                ? t.motifDialog.convertNote
                : undefined
          }
          initialName={motifDialog.mode === 'selection' ? t.motifDialog.newName : motifDialog.project.name}
          initialFolderId={motifDialog.mode === 'selection' ? lastMotifFolder() : motifDialog.project.folderId ?? lastMotifFolder()}
          motifId={motifDialog.mode === 'rename' ? motifDialog.project.id : undefined}
          onFoldersChange={() => setMotifVersion((v) => v + 1)}
          onClose={() => setMotifDialog(null)}
          onConfirm={(name, folderId) => {
            if (motifDialog.mode === 'selection') {
              const patch = motifSource()
              const motif = patch && motifFromPatch(patch, project.palette, { name, folderId, fabric: project.fabric })
              if (!motif) {
                window.alert(t.motifDialog.emptySelection)
                return
              }
              if (!storeMotif(motif)) return
            } else {
              updateStored(motifDialog.project, { name, kind: 'motif', folderId })
            }
            setMotifDialog(null)
          }}
        />
      ) : null}

      {referenceCrop && reference ? (
        <Modal wide fill title={t.cropTitle} onClose={() => setReferenceCrop(null)}>
          <div className="flex h-full min-h-0 flex-col">
          <CropEditor
            bitmap={referenceCrop}
            crop={FULL_CROP}
            onCancel={() => setReferenceCrop(null)}
            onApply={(crop) => {
              const source = referenceCrop
              setReferenceCrop(null)
              if (crop === FULL_CROP) return
              const sx = Math.round(crop.x * source.width)
              const sy = Math.round(crop.y * source.height)
              const sw = Math.max(1, Math.round(crop.w * source.width))
              const sh = Math.max(1, Math.round(crop.h * source.height))
              createImageBitmap(source, sx, sy, sw, sh)
                .then(encodeReference)
                .then(({ src, width, height }) => {
                  // Keep its place and width on the grid; height follows the crop.
                  setReference({ ...reference, src, naturalWidth: width, naturalHeight: height, h: (reference.w * height) / width })
                })
                .catch(() => setReferenceError(t.cropFailed))
            }}
          />
          </div>
        </Modal>
      ) : null}

      {help !== null ? <HelpCenter initialSection={help} onClose={() => setHelp(null)} /> : null}

      {welcome ? (
        <div className="no-print fixed right-4 bottom-12 z-40 w-72 rounded-xl border border-sky-600/60 bg-panel p-3 shadow-2xl">
          <p className="text-sm font-medium text-slate-100">{t.welcome.title}</p>
          <p className="mt-1 text-xs text-slate-400">
            {t.welcome.body}
          </p>
          <div className="mt-2.5 flex justify-end gap-1.5">
            <Button size="sm" variant="ghost" onClick={dismissWelcome}>
              {t.welcome.later}
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                dismissWelcome()
                setHelp('start')
              }}
            >
              {t.welcome.discover}
            </Button>
          </div>
        </div>
      ) : null}

      {supportVisible && supportMoment !== null ? (
        <SupportCard moment={supportMoment} onClose={() => setSupportMoment(null)} />
      ) : null}

      {printing ? (
        <PrintView
          project={project}
          sheetsChoice={printSheets}
          onSheetsChoiceChange={setPrintSheets}
          layout={printLayout}
          onClose={() => setPrinting(false)}
        />
      ) : null}
    </div>
  )
}
