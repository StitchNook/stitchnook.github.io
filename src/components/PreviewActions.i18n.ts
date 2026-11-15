import { messages } from '../i18n'

export const t = messages(
  {
    pending: (w: number, h: number) => `Aperçu ${w} × ${h} points, pas encore appliqué.`,
    applyTitle: 'Valider (Entrée)',
    apply: 'Valider',
    resetTitle: 'Revenir à la position et à la forme de départ',
    reset: 'Réinitialiser',
    cancelTitle: 'Annuler (Échap)',
    restoreTitle: 'Afficher à nouveau l’aperçu avec les réglages actuels',
    restore: 'Réafficher l’aperçu',
  },
  {
    en: {
      pending: (w, h) => `Preview ${w} × ${h} stitches, not applied yet.`,
      applyTitle: 'Apply (Enter)',
      apply: 'Apply',
      resetTitle: 'Back to the starting position and shape',
      reset: 'Reset',
      cancelTitle: 'Cancel (Esc)',
      restoreTitle: 'Show the preview again with the current settings',
      restore: 'Show preview again',
    },
    es: {
      pending: (w, h) => `Vista previa de ${w} × ${h} puntos, aún sin aplicar.`,
      applyTitle: 'Aplicar (Intro)',
      apply: 'Aplicar',
      resetTitle: 'Volver a la posición y la forma iniciales',
      reset: 'Restablecer',
      cancelTitle: 'Cancelar (Esc)',
      restoreTitle: 'Volver a mostrar la vista previa con los ajustes actuales',
      restore: 'Volver a mostrar',
    },
    de: {
      pending: (w, h) => `Vorschau ${w} × ${h} Stiche, noch nicht übernommen.`,
      applyTitle: 'Übernehmen (Eingabe)',
      apply: 'Übernehmen',
      resetTitle: 'Zurück zur Ausgangsposition und -form',
      reset: 'Zurücksetzen',
      cancelTitle: 'Abbrechen (Esc)',
      restoreTitle: 'Vorschau mit den aktuellen Einstellungen erneut anzeigen',
      restore: 'Vorschau erneut zeigen',
    },
  },
)
