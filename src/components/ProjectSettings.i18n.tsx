import type { ReactNode } from 'react'
import { messages } from '../i18n'

export const t = messages(
  {
    title: (mode: 'create' | 'new' | 'edit', motif: boolean) =>
      mode === 'create'
        ? `Créer un ${motif ? 'motif' : 'projet'}`
        : mode === 'new'
          ? `Nouveau ${motif ? 'motif' : 'projet'}`
          : `Paramètres du ${motif ? 'motif' : 'projet'}`,
    cancel: 'Annuler',
    untitled: (motif: boolean) => (motif ? 'Motif sans titre' : 'Projet sans titre'),
    create: (motif: boolean) => `Créer le ${motif ? 'motif' : 'projet'}`,
    apply: 'Appliquer',
    name: (motif: boolean) => (motif ? 'Nom du motif' : 'Nom du projet'),
    cropping: (width: number, height: number, undo: string): ReactNode => (
      <>
        La grille va être réduite : les points situés au-delà de {width} × {height} seront
        supprimés. L’opération reste annulable avec {undo}.
      </>
    ),
  },
  {
    en: {
      title: (mode, motif) =>
        mode === 'create'
          ? `Create a ${motif ? 'motif' : 'project'}`
          : mode === 'new'
            ? `New ${motif ? 'motif' : 'project'}`
            : `${motif ? 'Motif' : 'Project'} settings`,
      cancel: 'Cancel',
      untitled: (motif) => (motif ? 'Untitled motif' : 'Untitled project'),
      create: (motif) => (motif ? 'Create motif' : 'Create project'),
      apply: 'Apply',
      name: (motif) => (motif ? 'Motif name' : 'Project name'),
      cropping: (width, height, undo) => (
        <>
          The chart will shrink: stitches beyond {width} × {height} will be removed. You can still undo
          it with {undo}.
        </>
      ),
    },
    es: {
      title: (mode, motif) =>
        mode === 'create'
          ? `Crear un ${motif ? 'motivo' : 'proyecto'}`
          : mode === 'new'
            ? `Nuevo ${motif ? 'motivo' : 'proyecto'}`
            : `Ajustes del ${motif ? 'motivo' : 'proyecto'}`,
      cancel: 'Cancelar',
      untitled: (motif) => (motif ? 'Motivo sin título' : 'Proyecto sin título'),
      create: (motif) => `Crear el ${motif ? 'motivo' : 'proyecto'}`,
      apply: 'Aplicar',
      name: (motif) => (motif ? 'Nombre del motivo' : 'Nombre del proyecto'),
      cropping: (width, height, undo) => (
        <>
          El patrón se reducirá: se eliminarán los puntos situados más allá de {width} × {height}. Puedes
          deshacerlo con {undo}.
        </>
      ),
    },
    de: {
      title: (mode, motif) =>
        mode === 'create'
          ? `${motif ? 'Motiv' : 'Projekt'} erstellen`
          : mode === 'new'
            ? `Neues ${motif ? 'Motiv' : 'Projekt'}`
            : `${motif ? 'Motiv' : 'Projekt'}einstellungen`,
      cancel: 'Abbrechen',
      untitled: (motif) => (motif ? 'Motiv ohne Titel' : 'Projekt ohne Titel'),
      create: (motif) => `${motif ? 'Motiv' : 'Projekt'} erstellen`,
      apply: 'Übernehmen',
      name: (motif) => (motif ? 'Name des Motivs' : 'Projektname'),
      cropping: (width, height, undo) => (
        <>
          Das Muster wird verkleinert: Stiche außerhalb von {width} × {height} werden entfernt. Mit {undo}{' '}
          lässt sich das rückgängig machen.
        </>
      ),
    },
  },
)
