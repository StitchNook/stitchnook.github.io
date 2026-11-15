import { formatNumber, messages } from '../i18n'

const n = (value: number) => formatNumber(value)

export const t = messages(
  {
    createMotif: 'Créer un motif',
    createProject: 'Créer un projet',
    cancel: 'Annuler',
    addToLibrary: 'Ajouter à la bibliothèque',
    openInTab: 'Ouvrir dans un nouvel onglet',
    found: (rebuilt: number, declared: number | null, conform: boolean) =>
      `${n(rebuilt)} points retrouvés${declared !== null ? (conform ? ' — conforme au PDF.' : ` pour ${n(declared)} annoncés.`) : '.'}`,
    unknown: (codes: string) =>
      `Références absentes du catalogue DMC de l’app : ${codes} (affichées en gris, à remplacer depuis la palette).`,
    motifName: 'Nom du motif',
    projectName: 'Nom du projet',
    summary: (width: number, height: number, sections: number, perInch: number | null) =>
      `${width} × ${height} points · ${sections} sections lues${perInch ? ` · toile ${perInch} points / pouce` : ''}`,
    name: 'Nom',
    read: 'Points lus',
    declared: 'Annoncés',
    fullOnly: 'Seuls les points de croix complets sont repris (pas les demi-points ni les points arrière).',
  },
  {
    en: {
      createMotif: 'Create a motif',
      createProject: 'Create a project',
      cancel: 'Cancel',
      addToLibrary: 'Add to library',
      openInTab: 'Open in a new tab',
      found: (rebuilt, declared, conform) =>
        `${n(rebuilt)} stitches recovered${declared !== null ? (conform ? ' — matches the PDF.' : ` out of ${n(declared)} announced.`) : '.'}`,
      unknown: (codes) =>
        `References missing from the app’s DMC catalog: ${codes} (shown in gray, replace them from the palette).`,
      motifName: 'Motif name',
      projectName: 'Project name',
      summary: (width, height, sections, perInch) =>
        `${width} × ${height} stitches · ${sections} sections read${perInch ? ` · fabric ${perInch} stitches / inch` : ''}`,
      name: 'Name',
      read: 'Stitches read',
      declared: 'Announced',
      fullOnly: 'Only full cross stitches are imported (no half stitches or backstitches).',
    },
    es: {
      createMotif: 'Crear un motivo',
      createProject: 'Crear un proyecto',
      cancel: 'Cancelar',
      addToLibrary: 'Añadir a la biblioteca',
      openInTab: 'Abrir en una pestaña nueva',
      found: (rebuilt, declared, conform) =>
        `${n(rebuilt)} puntos recuperados${declared !== null ? (conform ? ' — conforme al PDF.' : ` de ${n(declared)} anunciados.`) : '.'}`,
      unknown: (codes) =>
        `Referencias ausentes del catálogo DMC de la app: ${codes} (en gris, sustitúyelas desde la paleta).`,
      motifName: 'Nombre del motivo',
      projectName: 'Nombre del proyecto',
      summary: (width, height, sections, perInch) =>
        `${width} × ${height} puntos · ${sections} secciones leídas${perInch ? ` · tela ${perInch} puntos / pulgada` : ''}`,
      name: 'Nombre',
      read: 'Puntos leídos',
      declared: 'Anunciados',
      fullOnly: 'Solo se importan los puntos de cruz completos (ni medios puntos ni pespuntes).',
    },
    de: {
      createMotif: 'Motiv erstellen',
      createProject: 'Projekt erstellen',
      cancel: 'Abbrechen',
      addToLibrary: 'Zur Bibliothek hinzufügen',
      openInTab: 'In neuem Tab öffnen',
      found: (rebuilt, declared, conform) =>
        `${n(rebuilt)} Stiche gefunden${declared !== null ? (conform ? ' — stimmt mit dem PDF überein.' : ` von ${n(declared)} angegebenen.`) : '.'}`,
      unknown: (codes) =>
        `Nummern fehlen im DMC-Katalog der App: ${codes} (grau angezeigt, über die Palette ersetzen).`,
      motifName: 'Name des Motivs',
      projectName: 'Name des Projekts',
      summary: (width, height, sections, perInch) =>
        `${width} × ${height} Stiche · ${sections} Abschnitte gelesen${perInch ? ` · Stoff ${perInch} Stiche / Zoll` : ''}`,
      name: 'Name',
      read: 'Gelesene Stiche',
      declared: 'Angegeben',
      fullOnly: 'Nur ganze Kreuzstiche werden übernommen (keine halben Stiche oder Rückstiche).',
    },
  },
)
