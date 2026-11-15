import { formatNumber, messages } from '../i18n'

const n = (value: number) => formatNumber(value)

export const t = messages(
  {
    inchShort: 'po',
    inches: 'pouces',
    aida: (count: number, perCm: number) => `Aïda ${count} (${n(perCm)} pts/cm)`,
    evenweave: (threads: number, perCm: number) => `Étamine ${threads} fils (${n(perCm)} pts/cm)`,
    perCm: (count: number) => `${count} points / cm`,
  },
  {
    en: {
      inchShort: 'in',
      inches: 'inches',
      aida: (count, perCm) => `Aida ${count} count (${n(perCm)} st/cm)`,
      evenweave: (threads, perCm) => `Evenweave ${threads} count (${n(perCm)} st/cm)`,
      perCm: (count) => `${count} stitches / cm`,
    },
    es: {
      inchShort: 'pulg.',
      inches: 'pulgadas',
      aida: (count, perCm) => `Aída ${count} (${n(perCm)} pts/cm)`,
      evenweave: (threads, perCm) => `Lino/etamina ${threads} hilos (${n(perCm)} pts/cm)`,
      perCm: (count) => `${count} puntos / cm`,
    },
    de: {
      inchShort: 'Zoll',
      inches: 'Zoll',
      aida: (count, perCm) => `Aida ${count} ct (${n(perCm)} St./cm)`,
      evenweave: (threads, perCm) => `Leinen/Etamine ${threads} Fäden (${n(perCm)} St./cm)`,
      perCm: (count) => `${count} Stiche / cm`,
    },
  },
)
