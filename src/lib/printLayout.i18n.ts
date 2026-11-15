import { formatNumber, messages } from '../i18n'

const mm = (value: number) => formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false })

export const t = messages(
  {
    summary: (sheets: number, landscape: boolean, pagesX: number, pagesY: number, cell: number) =>
      `${sheets} feuille${sheets > 1 ? 's' : ''} · ${landscape ? 'paysage' : 'portrait'} · ${pagesX}×${pagesY} · point ${mm(cell)} mm`,
  },
  {
    en: {
      summary: (sheets, landscape, pagesX, pagesY, cell) =>
        `${sheets} sheet${sheets === 1 ? '' : 's'} · ${landscape ? 'landscape' : 'portrait'} · ${pagesX}×${pagesY} · stitch ${mm(cell)} mm`,
    },
    es: {
      summary: (sheets, landscape, pagesX, pagesY, cell) =>
        `${sheets} hoja${sheets === 1 ? '' : 's'} · ${landscape ? 'horizontal' : 'vertical'} · ${pagesX}×${pagesY} · punto ${mm(cell)} mm`,
    },
    de: {
      summary: (sheets, landscape, pagesX, pagesY, cell) =>
        `${sheets} ${sheets === 1 ? 'Blatt' : 'Blätter'} · ${landscape ? 'Querformat' : 'Hochformat'} · ${pagesX}×${pagesY} · Stich ${mm(cell)} mm`,
    },
  },
)
