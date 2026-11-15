import { messages } from '../i18n'

export const t = messages(
  {
    root: 'Bibliothèque',
    newFolder: 'Nouveau dossier',
    emptyName: 'Nom vide.',
    exists: (name: string) => `Un dossier « ${name} » existe déjà à cet endroit.`,
    notFound: 'Dossier introuvable.',
    intoOwnChild: 'Un dossier ne peut pas aller dans l’un de ses sous-dossiers.',
  },
  {
    en: {
      root: 'Library',
      newFolder: 'New folder',
      emptyName: 'Empty name.',
      exists: (name) => `A folder “${name}” already exists here.`,
      notFound: 'Folder not found.',
      intoOwnChild: 'A folder cannot go into one of its own subfolders.',
    },
    es: {
      root: 'Biblioteca',
      newFolder: 'Nueva carpeta',
      emptyName: 'Nombre vacío.',
      exists: (name) => `Ya existe una carpeta «${name}» en este lugar.`,
      notFound: 'Carpeta no encontrada.',
      intoOwnChild: 'Una carpeta no puede ir dentro de una de sus subcarpetas.',
    },
    de: {
      root: 'Bibliothek',
      newFolder: 'Neuer Ordner',
      emptyName: 'Leerer Name.',
      exists: (name) => `Hier gibt es bereits einen Ordner „${name}“.`,
      notFound: 'Ordner nicht gefunden.',
      intoOwnChild: 'Ein Ordner kann nicht in einen seiner Unterordner verschoben werden.',
    },
  },
)
