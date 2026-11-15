import { messages } from '../i18n'

export const t = messages(
  {
    title: 'Fils du projet',
    empty: 'Aucun fil pour l’instant. Ouvrez le catalogue DMC pour en ajouter.',
    symbolTitle: 'Symbole imprimé',
    replaceTitle: 'Remplacer par une autre référence DMC',
    remove: 'Retirer ce fil',
    removeWithStitches: (count: number) => `Retirer ce fil et effacer ses ${count} points`,
  },
  {
    en: {
      title: 'Project threads',
      empty: 'No threads yet. Open the DMC catalog to add some.',
      symbolTitle: 'Printed symbol',
      replaceTitle: 'Replace with another DMC reference',
      remove: 'Remove this thread',
      removeWithStitches: (count) =>
        `Remove this thread and erase its ${count} ${count === 1 ? 'stitch' : 'stitches'}`,
    },
    es: {
      title: 'Hilos del proyecto',
      empty: 'Aún no hay hilos. Abre el catálogo DMC para añadir alguno.',
      symbolTitle: 'Símbolo impreso',
      replaceTitle: 'Sustituir por otra referencia DMC',
      remove: 'Quitar este hilo',
      removeWithStitches: (count) =>
        `Quitar este hilo y borrar sus ${count} ${count === 1 ? 'punto' : 'puntos'}`,
    },
    de: {
      title: 'Garne im Projekt',
      empty: 'Noch keine Garne. Öffne den DMC-Katalog, um welche hinzuzufügen.',
      symbolTitle: 'Gedrucktes Symbol',
      replaceTitle: 'Durch eine andere DMC-Referenz ersetzen',
      remove: 'Dieses Garn entfernen',
      removeWithStitches: (count) =>
        `Dieses Garn entfernen und ${count === 1 ? 'seinen Stich' : `seine ${count} Stiche`} löschen`,
    },
  },
)
