import { formatNumber, messages, plural } from '../i18n'

const n = (value: number) => formatNumber(value)

export const t = messages(
  {
    unknownDate: 'date inconnue',
    title: 'Restaurer une sauvegarde',
    close: 'Fermer',
    cancel: 'Annuler',
    restore: 'Restaurer',
    restored: 'Sauvegarde restaurée.',
    added: (projects: number, motifs: number, folders: number) =>
      `${projects} projet(s), ${motifs} motif(s) et ${folders} dossier(s) ajoutés.`,
    replaced: (count: number) => `${count} remplacé(s) par une version plus récente.`,
    skipped: (count: number) => `${count} déjà présent(s), laissé(s) tel(s) quel(s).`,
    open: (count: number) => `${count} ouvert(s) dans un onglet, non modifié(s).`,
    contents: (date: string, projects: number, motifs: number, folders: number) =>
      `Sauvegarde (${date}) : ${projects} projet(s), ${motifs} motif(s), ${folders} dossier(s).`,
    explain:
      'Ce qui manque dans ce navigateur est ajouté. Ce qui existe déjà est laissé tel quel, sauf si vous cochez l’option ci-dessous. Les projets ouverts dans un onglet ne sont jamais modifiés.',
    replaceOlder: 'Remplacer les versions plus anciennes',
  },
  {
    en: {
      unknownDate: 'unknown date',
      title: 'Restore a backup',
      close: 'Close',
      cancel: 'Cancel',
      restore: 'Restore',
      restored: 'Backup restored.',
      added: (projects, motifs, folders) =>
        `Added ${n(projects)} ${plural(projects, { one: 'project', other: 'projects' })}, ${n(motifs)} ${plural(motifs, { one: 'motif', other: 'motifs' })} and ${n(folders)} ${plural(folders, { one: 'folder', other: 'folders' })}.`,
      replaced: (count) => `${n(count)} replaced by a newer version.`,
      skipped: (count) => `${n(count)} already here, left as is.`,
      open: (count) => `${n(count)} open in a tab, left unchanged.`,
      contents: (date, projects, motifs, folders) =>
        `Backup (${date}): ${n(projects)} ${plural(projects, { one: 'project', other: 'projects' })}, ${n(motifs)} ${plural(motifs, { one: 'motif', other: 'motifs' })}, ${n(folders)} ${plural(folders, { one: 'folder', other: 'folders' })}.`,
      explain:
        'Whatever this browser is missing gets added. What already exists is left as is, unless you tick the option below. Projects open in a tab are never changed.',
      replaceOlder: 'Replace older versions',
    },
    es: {
      unknownDate: 'fecha desconocida',
      title: 'Restaurar una copia de seguridad',
      close: 'Cerrar',
      cancel: 'Cancelar',
      restore: 'Restaurar',
      restored: 'Copia de seguridad restaurada.',
      added: (projects, motifs, folders) =>
        `Se han añadido ${n(projects)} ${plural(projects, { one: 'proyecto', other: 'proyectos' })}, ${n(motifs)} ${plural(motifs, { one: 'motivo', other: 'motivos' })} y ${n(folders)} ${plural(folders, { one: 'carpeta', other: 'carpetas' })}.`,
      replaced: (count) => `${n(count)} ${plural(count, { one: 'reemplazado', other: 'reemplazados' })} por una versión más reciente.`,
      skipped: (count) => `${n(count)} ya ${plural(count, { one: 'existía, se ha dejado', other: 'existían, se han dejado' })} como estaba.`,
      open: (count) => `${n(count)} ${plural(count, { one: 'abierto', other: 'abiertos' })} en una pestaña, sin cambios.`,
      contents: (date, projects, motifs, folders) =>
        `Copia de seguridad (${date}): ${n(projects)} ${plural(projects, { one: 'proyecto', other: 'proyectos' })}, ${n(motifs)} ${plural(motifs, { one: 'motivo', other: 'motivos' })}, ${n(folders)} ${plural(folders, { one: 'carpeta', other: 'carpetas' })}.`,
      explain:
        'Lo que falta en este navegador se añade. Lo que ya existe se deja como está, salvo si marcas la opción de abajo. Los proyectos abiertos en una pestaña nunca se modifican.',
      replaceOlder: 'Reemplazar las versiones más antiguas',
    },
    de: {
      unknownDate: 'unbekanntes Datum',
      title: 'Sicherung wiederherstellen',
      close: 'Schließen',
      cancel: 'Abbrechen',
      restore: 'Wiederherstellen',
      restored: 'Sicherung wiederhergestellt.',
      added: (projects, motifs, folders) =>
        `${n(projects)} ${plural(projects, { one: 'Projekt', other: 'Projekte' })}, ${n(motifs)} ${plural(motifs, { one: 'Motiv', other: 'Motive' })} und ${n(folders)} ${plural(folders, { one: 'Ordner', other: 'Ordner' })} hinzugefügt.`,
      replaced: (count) => `${n(count)} durch eine neuere Version ersetzt.`,
      skipped: (count) => `${n(count)} bereits vorhanden, unverändert gelassen.`,
      open: (count) => `${n(count)} in einem Tab geöffnet, nicht geändert.`,
      contents: (date, projects, motifs, folders) =>
        `Sicherung (${date}): ${n(projects)} ${plural(projects, { one: 'Projekt', other: 'Projekte' })}, ${n(motifs)} ${plural(motifs, { one: 'Motiv', other: 'Motive' })}, ${n(folders)} Ordner.`,
      explain:
        'Was in diesem Browser fehlt, wird hinzugefügt. Was schon existiert, bleibt unverändert, außer du aktivierst die Option unten. In einem Tab geöffnete Projekte werden nie geändert.',
      replaceOlder: 'Ältere Versionen ersetzen',
    },
  },
)
