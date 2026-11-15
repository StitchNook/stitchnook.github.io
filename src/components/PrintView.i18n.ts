import { formatNumber, messages } from '../i18n'

const metres = (value: number) =>
  `${formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false })} m`

export const t = messages(
  {
    sheets: 'Feuilles A4 pour la grille',
    ink: 'Rendu',
    color: 'Couleur',
    bw: 'N & B',
    symbols: 'Symboles',
    centreLines: 'Lignes centrales',
    legend: 'Légende des fils',
    markDone: 'Marquer les points brodés',
    pagesToPrint: (count: number, withLegend: boolean) =>
      `${count} page${count > 1 ? 's' : ''} à imprimer${withLegend ? ' (dont la légende)' : ''}`,
    print: 'Imprimer / PDF',
    close: 'Fermer',
    thanks: 'Stitchnook est gratuit. Si ce modèle vous fait plaisir, vous pouvez soutenir le projet :',
    heading: (sheet: number, sheets: number, row: number, col: number, x1: number, x2: number, y1: number, y2: number) =>
      `${sheets > 1 ? `Planche ${sheet}/${sheets} (ligne ${row}, colonne ${col}) · ` : ''}colonnes ${x1} à ${x2}, lignes ${y1} à ${y2}`,
    summary: (width: number, height: number, lengthW: string, lengthH: string, count: number, perCm: boolean, total: number) =>
      `${width} × ${height} points · ${lengthW} × ${lengthH} · ${count} points / ${perCm ? 'cm' : 'pouce'} · ${total} points au total`,
    colSymbol: 'Symb.',
    colColor: 'Coul.',
    colName: 'Nom',
    colStitches: 'Points',
    colThread: 'Fil ≈',
    metres,
    lengthsNote:
      'Longueurs de fil estimées pour deux brins, marges de départ et d’arrêt comprises. À ajuster selon votre tension.',
    assembly: 'Plan d’assemblage',
    assemblyNote:
      'Chaque planche répète en hachuré la dernière ligne et la dernière colonne de sa voisine pour faciliter le raccord. Les flèches et lignes bleues marquent le centre du modèle.',
  },
  {
    en: {
      sheets: 'A4 sheets for the chart',
      ink: 'Rendering',
      color: 'Color',
      bw: 'B & W',
      symbols: 'Symbols',
      centreLines: 'Center lines',
      legend: 'Thread legend',
      markDone: 'Mark stitched stitches',
      pagesToPrint: (count, withLegend) =>
        `${count} page${count === 1 ? '' : 's'} to print${withLegend ? ' (legend included)' : ''}`,
      print: 'Print / PDF',
      close: 'Close',
      thanks: 'Stitchnook is free. If you enjoy this pattern, you can support the project:',
      heading: (sheet, sheets, row, col, x1, x2, y1, y2) =>
        `${sheets > 1 ? `Sheet ${sheet}/${sheets} (row ${row}, column ${col}) · ` : ''}columns ${x1} to ${x2}, rows ${y1} to ${y2}`,
      summary: (width, height, lengthW, lengthH, count, perCm, total) =>
        `${width} × ${height} stitches · ${lengthW} × ${lengthH} · ${count} stitches / ${perCm ? 'cm' : 'inch'} · ${total} stitches in total`,
      colSymbol: 'Sym.',
      colColor: 'Color',
      colName: 'Name',
      colStitches: 'Stitches',
      colThread: 'Thread ≈',
      metres,
      lengthsNote: 'Thread lengths estimated for two strands, including starting and finishing tails. Adjust to your tension.',
      assembly: 'Assembly plan',
      assemblyNote:
        'Each sheet repeats, hatched, the last row and column of its neighbor to help you line them up. The blue arrows and lines mark the center of the pattern.',
    },
    es: {
      sheets: 'Hojas A4 para el patrón',
      ink: 'Impresión',
      color: 'Color',
      bw: 'B y N',
      symbols: 'Símbolos',
      centreLines: 'Líneas centrales',
      legend: 'Leyenda de hilos',
      markDone: 'Marcar puntos bordados',
      pagesToPrint: (count, withLegend) =>
        `${count} página${count === 1 ? '' : 's'} para imprimir${withLegend ? ' (con la leyenda)' : ''}`,
      print: 'Imprimir / PDF',
      close: 'Cerrar',
      thanks: 'Stitchnook es gratis. Si te gusta este patrón, puedes apoyar el proyecto:',
      heading: (sheet, sheets, row, col, x1, x2, y1, y2) =>
        `${sheets > 1 ? `Hoja ${sheet}/${sheets} (fila ${row}, columna ${col}) · ` : ''}columnas ${x1} a ${x2}, filas ${y1} a ${y2}`,
      summary: (width, height, lengthW, lengthH, count, perCm, total) =>
        `${width} × ${height} puntos · ${lengthW} × ${lengthH} · ${count} puntos / ${perCm ? 'cm' : 'pulgada'} · ${total} puntos en total`,
      colSymbol: 'Símb.',
      colColor: 'Color',
      colName: 'Nombre',
      colStitches: 'Puntos',
      colThread: 'Hilo ≈',
      metres,
      lengthsNote:
        'Longitudes de hilo estimadas para dos hebras, incluidos los márgenes de inicio y remate. Ajústalas según tu tensión.',
      assembly: 'Plano de montaje',
      assemblyNote:
        'Cada hoja repite rayadas la última fila y la última columna de su vecina para facilitar el empalme. Las flechas y líneas azules marcan el centro del patrón.',
    },
    de: {
      sheets: 'A4-Blätter für das Stickmuster',
      ink: 'Darstellung',
      color: 'Farbe',
      bw: 'S/W',
      symbols: 'Symbole',
      centreLines: 'Mittellinien',
      legend: 'Garnlegende',
      markDone: 'Gestickte Stiche markieren',
      pagesToPrint: (count, withLegend) =>
        `${count} ${count === 1 ? 'Seite' : 'Seiten'} zu drucken${withLegend ? ' (inkl. Legende)' : ''}`,
      print: 'Drucken / PDF',
      close: 'Schließen',
      thanks: 'Stitchnook ist kostenlos. Wenn dir dieses Muster gefällt, kannst du das Projekt unterstützen:',
      heading: (sheet, sheets, row, col, x1, x2, y1, y2) =>
        `${sheets > 1 ? `Blatt ${sheet}/${sheets} (Zeile ${row}, Spalte ${col}) · ` : ''}Spalten ${x1} bis ${x2}, Zeilen ${y1} bis ${y2}`,
      summary: (width, height, lengthW, lengthH, count, perCm, total) =>
        `${width} × ${height} Stiche · ${lengthW} × ${lengthH} · ${count} Stiche / ${perCm ? 'cm' : 'Zoll'} · ${total} Stiche insgesamt`,
      colSymbol: 'Symb.',
      colColor: 'Farbe',
      colName: 'Name',
      colStitches: 'Stiche',
      colThread: 'Garn ≈',
      metres,
      lengthsNote:
        'Geschätzte Garnlängen für zwei Fäden, inklusive Anfangs- und Endfäden. Je nach Fadenspannung anpassen.',
      assembly: 'Zusammensetzplan',
      assemblyNote:
        'Jedes Blatt wiederholt schraffiert die letzte Zeile und Spalte seines Nachbarn, um das Anlegen zu erleichtern. Die blauen Pfeile und Linien markieren die Mitte des Musters.',
    },
  },
)
