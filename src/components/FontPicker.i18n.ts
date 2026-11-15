import { messages } from '../i18n'

export const t = messages(
  {
    all: 'Toutes',
    recent: 'Récentes',
    search: (count: number) => `Rechercher parmi ${count} polices`,
    listInstalled: 'Lister toutes mes polices installées',
    noRecent: 'Aucune police récente.',
    noneFound: 'Aucune police trouvée.',
    footer: (count: number) =>
      `${count} police${count > 1 ? 's' : ''} · Google Fonts et polices de l’ordinateur`,
  },
  {
    en: {
      all: 'All',
      recent: 'Recent',
      search: (count) => `Search ${count} fonts`,
      listInstalled: 'List all my installed fonts',
      noRecent: 'No recent fonts.',
      noneFound: 'No fonts found.',
      footer: (count) => `${count} font${count === 1 ? '' : 's'} · Google Fonts and this computer’s fonts`,
    },
    es: {
      all: 'Todas',
      recent: 'Recientes',
      search: (count) => `Buscar entre ${count} fuentes`,
      listInstalled: 'Mostrar todas mis fuentes instaladas',
      noRecent: 'No hay fuentes recientes.',
      noneFound: 'No se ha encontrado ninguna fuente.',
      footer: (count) => `${count} fuente${count === 1 ? '' : 's'} · Google Fonts y fuentes del ordenador`,
    },
    de: {
      all: 'Alle',
      recent: 'Zuletzt',
      search: (count) => `${count} Schriften durchsuchen`,
      listInstalled: 'Alle installierten Schriften auflisten',
      noRecent: 'Keine zuletzt verwendeten Schriften.',
      noneFound: 'Keine Schrift gefunden.',
      footer: (count) => `${count} Schrift${count === 1 ? '' : 'en'} · Google Fonts und Schriften des Computers`,
    },
  },
)
