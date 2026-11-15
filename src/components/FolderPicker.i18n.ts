import { messages } from '../i18n'

export const t = messages(
  {
    existed: (name: string) => `« ${name} » existait déjà : il est choisi.`,
    createIn: (name: string) => `Créer un dossier dans « ${name} »`,
    newIn: (name: string) => `Nouveau dossier dans « ${name} »`,
    namePlaceholder: (name: string) => `Nom du dossier (dans « ${name} »)`,
    create: 'Créer',
  },
  {
    en: {
      existed: (name) => `“${name}” already existed: it is now selected.`,
      createIn: (name) => `Create a folder in “${name}”`,
      newIn: (name) => `New folder in “${name}”`,
      namePlaceholder: (name) => `Folder name (in “${name}”)`,
      create: 'Create',
    },
    es: {
      existed: (name) => `«${name}» ya existía: queda seleccionada.`,
      createIn: (name) => `Crear una carpeta en «${name}»`,
      newIn: (name) => `Nueva carpeta en «${name}»`,
      namePlaceholder: (name) => `Nombre de la carpeta (en «${name}»)`,
      create: 'Crear',
    },
    de: {
      existed: (name) => `„${name}“ gab es schon: Er ist jetzt ausgewählt.`,
      createIn: (name) => `Ordner in „${name}“ erstellen`,
      newIn: (name) => `Neuer Ordner in „${name}“`,
      namePlaceholder: (name) => `Ordnername (in „${name}“)`,
      create: 'Erstellen',
    },
  },
)
