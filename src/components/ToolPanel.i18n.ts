import { messages } from '../i18n'

export const t = messages(
  {
    settings: (tool: string) => `Réglages : ${tool}`,
    show: (tool: string) => `Afficher les réglages : ${tool}`,
    help: 'Aide de l’outil',
    fold: 'Replier le panneau',
  },
  {
    en: {
      settings: (tool) => `Settings: ${tool}`,
      show: (tool) => `Show settings: ${tool}`,
      help: 'Tool help',
      fold: 'Collapse the panel',
    },
    es: {
      settings: (tool) => `Ajustes: ${tool}`,
      show: (tool) => `Mostrar ajustes: ${tool}`,
      help: 'Ayuda de la herramienta',
      fold: 'Contraer el panel',
    },
    de: {
      settings: (tool) => `Einstellungen: ${tool}`,
      show: (tool) => `Einstellungen anzeigen: ${tool}`,
      help: 'Hilfe zum Werkzeug',
      fold: 'Bereich einklappen',
    },
  },
)
