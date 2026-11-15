import { messages } from '../i18n'

export const t = messages(
  {
    noCanvas: 'Canvas indisponible.',
    storageFull:
      'Stockage du navigateur plein : l’image de référence n’a pas pu être enregistrée (elle reste affichée jusqu’à la fermeture).',
  },
  {
    en: {
      noCanvas: 'Canvas unavailable.',
      storageFull: 'Browser storage is full: the reference image could not be saved (it stays visible until you close the page).',
    },
    es: {
      noCanvas: 'Canvas no disponible.',
      storageFull:
        'Almacenamiento del navegador lleno: no se pudo guardar la imagen de referencia (seguirá visible hasta cerrar la página).',
    },
    de: {
      noCanvas: 'Canvas nicht verfügbar.',
      storageFull:
        'Browserspeicher voll: Das Referenzbild konnte nicht gespeichert werden (es bleibt bis zum Schließen sichtbar).',
    },
  },
)
