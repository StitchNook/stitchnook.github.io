import { messages } from '../i18n'

export const t = messages(
  {
    title: 'Catalogue DMC Mouliné Spécial',
    footer: (shown: number, threads: number) =>
      `${shown} référence${shown > 1 ? 's' : ''} affichée${shown > 1 ? 's' : ''} · ${threads} fil${threads > 1 ? 's' : ''} dans la palette`,
    close: 'Fermer',
    searchPlaceholder: 'Rechercher un numéro ou un nom (ex. 310, bleu, écru)',
    byHue: 'Par teinte',
    byCode: 'Par numéro',
    match: 'Équivalence',
    noResults: 'Aucune référence ne correspond.',
    removeTitle: (code: string, name: string) =>
      `DMC ${code} — ${name} · dans la palette, cliquer pour retirer`,
  },
  {
    en: {
      title: 'DMC Mouliné Spécial catalog',
      footer: (shown, threads) =>
        `${shown} reference${shown === 1 ? '' : 's'} shown · ${threads} thread${threads === 1 ? '' : 's'} in the palette`,
      close: 'Close',
      searchPlaceholder: 'Search a number or name (e.g. 310, blue, ecru)',
      byHue: 'By hue',
      byCode: 'By number',
      match: 'Match',
      noResults: 'No matching reference.',
      removeTitle: (code, name) => `DMC ${code} — ${name} · in the palette, click to remove`,
    },
    es: {
      title: 'Catálogo DMC Mouliné Spécial',
      footer: (shown, threads) =>
        `${shown} referencia${shown === 1 ? '' : 's'} · ${threads} hilo${threads === 1 ? '' : 's'} en la paleta`,
      close: 'Cerrar',
      searchPlaceholder: 'Busca un número o nombre (p. ej. 310, azul, crudo)',
      byHue: 'Por tono',
      byCode: 'Por número',
      match: 'Equivalencia',
      noResults: 'Ninguna referencia coincide.',
      removeTitle: (code, name) => `DMC ${code} — ${name} · en la paleta, haz clic para quitarlo`,
    },
    de: {
      title: 'DMC Mouliné Spécial – Katalog',
      footer: (shown, threads) =>
        `${shown} ${shown === 1 ? 'Referenz' : 'Referenzen'} angezeigt · ${threads} ${threads === 1 ? 'Garn' : 'Garne'} in der Palette`,
      close: 'Schließen',
      searchPlaceholder: 'Nummer oder Name suchen (z. B. 310, blau, ecru)',
      byHue: 'Nach Farbton',
      byCode: 'Nach Nummer',
      match: 'Entsprechung',
      noResults: 'Keine passende Referenz.',
      removeTitle: (code, name) => `DMC ${code} — ${name} · in der Palette, klicken zum Entfernen`,
    },
  },
)
