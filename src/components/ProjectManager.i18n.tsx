import type { ReactNode } from 'react'
import { messages } from '../i18n'

const b = (text: ReactNode) => <b className="text-slate-200">{text}</b>

export const t = messages(
  {
    copyName: (name: string) => `${name} (copie)`,
    notFound: 'Ce projet est introuvable ou illisible dans le stockage local.',
    confirmDelete: (name: string) => `Supprimer définitivement « ${name} » du stockage local ?`,
    importFailed: 'Import impossible.',
    intoCurrent: (name: string) => `Copier ce motif dans « ${name} » : il arrive en aperçu à placer, puis à valider`,
    title: 'Mes projets',
    fromFile: 'Depuis un fichier :',
    openJsonTitle: 'Ouvrir un projet exporté (.json) dans un nouvel onglet',
    openJson: 'Ouvrir .json',
    pdfTitle: 'Retranscrire une grille PDF d’une autre application',
    pdf: 'Grille PDF',
    insert: 'Intégrer',
    close: 'Fermer',
    help: (name: string): ReactNode => (
      <>
        {b('Ouvrir')} : afficher le projet dans un onglet · {b('Intégrer')} : copier son motif dans « {name} » (aperçu
        à placer, puis valider).
        <br />
        Les petits éléments réutilisables (lettres, bordures…) se rangent dans la{' '}
        {b('bibliothèque de l’outil Motifs')} (M) : menu ⋯ → « Déplacer vers la bibliothèque ».
      </>
    ),
    empty: 'Aucun projet enregistré pour l’instant. Le projet courant est sauvegardé automatiquement.',
    shown: 'affiché',
    openTab: 'onglet ouvert',
    details: (width: number, height: number, date: string) => `${width} × ${height} points · modifié le ${date}`,
    goToTab: 'Aller à son onglet',
    show: 'Afficher',
    openNewTab: 'Ouvrir dans un nouvel onglet',
    open: 'Ouvrir',
    replaceTab: 'Remplacer l’onglet courant',
    replaceTabTitle: (name: string) => `« ${name} » est sauvegardé puis remplacé`,
    otherWays: 'Autres façons d’ouvrir',
    duplicate: 'Dupliquer (nouvel onglet)',
    exportJson: 'Exporter en .json',
    toLibrary: 'Déplacer vers la bibliothèque…',
    toLibraryTitle: 'En faire un motif à insérer dans les projets (outil Motifs)',
    delete: 'Supprimer…',
    onlyTab: 'Impossible : c’est le seul onglet ouvert',
    more: 'Plus d’actions',
  },
  {
    en: {
      copyName: (name) => `${name} (copy)`,
      notFound: 'This project cannot be found or read in local storage.',
      confirmDelete: (name) => `Permanently delete “${name}” from local storage?`,
      importFailed: 'Import failed.',
      intoCurrent: (name) => `Copy this pattern into “${name}”: it arrives as a preview to place, then apply`,
      title: 'My projects',
      fromFile: 'From a file:',
      openJsonTitle: 'Open an exported project (.json) in a new tab',
      openJson: 'Open .json',
      pdfTitle: 'Transcribe a PDF chart from another application',
      pdf: 'PDF chart',
      insert: 'Insert',
      close: 'Close',
      help: (name) => (
        <>
          {b('Open')}: show the project in a tab · {b('Insert')}: copy its pattern into “{name}” (preview to place,
          then apply).
          <br />
          Small reusable elements (letters, borders…) belong in the {b('Motifs tool library')} (M): ⋯ menu → “Move to
          library”.
        </>
      ),
      empty: 'No saved projects yet. The current project is saved automatically.',
      shown: 'shown',
      openTab: 'open tab',
      details: (width, height, date) => `${width} × ${height} stitches · modified ${date}`,
      goToTab: 'Go to its tab',
      show: 'Show',
      openNewTab: 'Open in a new tab',
      open: 'Open',
      replaceTab: 'Replace the current tab',
      replaceTabTitle: (name) => `“${name}” is saved, then replaced`,
      otherWays: 'Other ways to open',
      duplicate: 'Duplicate (new tab)',
      exportJson: 'Export as .json',
      toLibrary: 'Move to library…',
      toLibraryTitle: 'Make it a motif to insert into projects (Motifs tool)',
      delete: 'Delete…',
      onlyTab: 'Not possible: it is the only open tab',
      more: 'More actions',
    },
    es: {
      copyName: (name) => `${name} (copia)`,
      notFound: 'Este proyecto no se encuentra o no se puede leer en el almacenamiento local.',
      confirmDelete: (name) => `¿Eliminar definitivamente «${name}» del almacenamiento local?`,
      importFailed: 'No se pudo importar.',
      intoCurrent: (name) => `Copiar este diseño en «${name}»: llega como vista previa para colocar y luego aplicar`,
      title: 'Mis proyectos',
      fromFile: 'Desde un archivo:',
      openJsonTitle: 'Abrir un proyecto exportado (.json) en una pestaña nueva',
      openJson: 'Abrir .json',
      pdfTitle: 'Transcribir un patrón PDF de otra aplicación',
      pdf: 'Patrón PDF',
      insert: 'Integrar',
      close: 'Cerrar',
      help: (name) => (
        <>
          {b('Abrir')}: mostrar el proyecto en una pestaña · {b('Integrar')}: copiar su diseño en «{name}» (vista
          previa para colocar y luego aplicar).
          <br />
          Los pequeños elementos reutilizables (letras, cenefas…) se guardan en la{' '}
          {b('biblioteca de la herramienta Motivos')} (M): menú ⋯ → «Mover a la biblioteca».
        </>
      ),
      empty: 'Aún no hay proyectos guardados. El proyecto actual se guarda automáticamente.',
      shown: 'en pantalla',
      openTab: 'pestaña abierta',
      details: (width, height, date) => `${width} × ${height} puntos · modificado el ${date}`,
      goToTab: 'Ir a su pestaña',
      show: 'Mostrar',
      openNewTab: 'Abrir en una pestaña nueva',
      open: 'Abrir',
      replaceTab: 'Reemplazar la pestaña actual',
      replaceTabTitle: (name) => `«${name}» se guarda y luego se reemplaza`,
      otherWays: 'Otras formas de abrir',
      duplicate: 'Duplicar (pestaña nueva)',
      exportJson: 'Exportar en .json',
      toLibrary: 'Mover a la biblioteca…',
      toLibraryTitle: 'Convertirlo en un motivo para insertar en los proyectos (herramienta Motivos)',
      delete: 'Eliminar…',
      onlyTab: 'Imposible: es la única pestaña abierta',
      more: 'Más acciones',
    },
    de: {
      copyName: (name) => `${name} (Kopie)`,
      notFound: 'Dieses Projekt ist im lokalen Speicher nicht auffindbar oder nicht lesbar.',
      confirmDelete: (name) => `„${name}“ endgültig aus dem lokalen Speicher löschen?`,
      importFailed: 'Import nicht möglich.',
      intoCurrent: (name) => `Dieses Muster in „${name}“ kopieren: Es erscheint als Vorschau zum Platzieren und Übernehmen`,
      title: 'Meine Projekte',
      fromFile: 'Aus einer Datei:',
      openJsonTitle: 'Exportiertes Projekt (.json) in neuem Tab öffnen',
      openJson: '.json öffnen',
      pdfTitle: 'PDF-Muster aus einer anderen Anwendung übertragen',
      pdf: 'PDF-Muster',
      insert: 'Einfügen',
      close: 'Schließen',
      help: (name) => (
        <>
          {b('Öffnen')}: Projekt in einem Tab anzeigen · {b('Einfügen')}: sein Muster in „{name}“ kopieren (Vorschau
          platzieren, dann übernehmen).
          <br />
          Kleine wiederverwendbare Elemente (Buchstaben, Bordüren…) gehören in die{' '}
          {b('Bibliothek des Werkzeugs „Motive“')} (M): Menü ⋯ → „In die Bibliothek verschieben“.
        </>
      ),
      empty: 'Noch keine gespeicherten Projekte. Das aktuelle Projekt wird automatisch gespeichert.',
      shown: 'angezeigt',
      openTab: 'Tab geöffnet',
      details: (width, height, date) => `${width} × ${height} Stiche · geändert am ${date}`,
      goToTab: 'Zum Tab wechseln',
      show: 'Anzeigen',
      openNewTab: 'In neuem Tab öffnen',
      open: 'Öffnen',
      replaceTab: 'Aktuellen Tab ersetzen',
      replaceTabTitle: (name) => `„${name}“ wird gespeichert und dann ersetzt`,
      otherWays: 'Weitere Öffnen-Optionen',
      duplicate: 'Duplizieren (neuer Tab)',
      exportJson: 'Als .json exportieren',
      toLibrary: 'In die Bibliothek verschieben…',
      toLibraryTitle: 'Zu einem Motiv machen, das in Projekte eingefügt wird (Werkzeug „Motive“)',
      delete: 'Löschen…',
      onlyTab: 'Nicht möglich: Es ist der einzige offene Tab',
      more: 'Weitere Aktionen',
    },
  },
)
