import { messages } from '../i18n'

/** Key names: Mac keeps its glyphs, only the words around them change. */
export const t = messages(
  {
    mac: { mod: '⌘ Cmd', alt: '⌥ Option', shift: '⇧ Maj', del: '⌫ Effacer' },
    pc: { mod: 'Ctrl', alt: 'Alt', shift: 'Maj', del: 'Suppr' },
  },
  {
    en: {
      mac: { mod: '⌘ Cmd', alt: '⌥ Option', shift: '⇧ Shift', del: '⌫ Delete' },
      pc: { mod: 'Ctrl', alt: 'Alt', shift: 'Shift', del: 'Delete' },
    },
    es: {
      mac: { mod: '⌘ Cmd', alt: '⌥ Opción', shift: '⇧ Mayús', del: '⌫ Retroceso' },
      pc: { mod: 'Ctrl', alt: 'Alt', shift: 'Mayús', del: 'Supr' },
    },
    de: {
      mac: { mod: '⌘ Cmd', alt: '⌥ Wahltaste', shift: '⇧ Umschalt', del: '⌫ Rücktaste' },
      pc: { mod: 'Strg', alt: 'Alt', shift: 'Umschalt', del: 'Entf' },
    },
  },
)
