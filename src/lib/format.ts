// Formats français. Les espaces fines insécables d'Intl sont remplacées par des espaces
// insécables classiques, que la police pixel sait dessiner.
const espaces = (s: string) => s.replace(/[  ]/g, ' ')

export const euros = (n: number) => espaces(Math.round(n).toLocaleString('fr-FR')) + ' €'
export const eurosCentimes = (n: number) => espaces(n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })) + ' €'
export const nombre = (n: number) => espaces(Math.round(n).toLocaleString('fr-FR'))
export const pourcent = (n: number) => espaces(Math.abs(n).toLocaleString('fr-FR', { maximumFractionDigits: 1 })) + ' %'

/** Axe des montants : 40 000 → « 40k ». */
export const kilo = (n: number) => (n >= 1000 ? `${nombre(n / 1000)}k` : nombre(n))

export const dateCourte = (iso: string | null) =>
  iso ? new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'
export const dateLongue = (iso: string | null) =>
  iso ? new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

/** Nombre de jours entre aujourd'hui et `iso` (positif = dans le futur). */
export function joursAvant(iso: string | null) {
  if (!iso) return null
  const a = new Date(iso + 'T12:00:00').getTime()
  const b = new Date()
  b.setHours(12, 0, 0, 0)
  return Math.round((a - b.getTime()) / 86_400_000)
}

export const initiales = (nom: string) =>
  nom
    .replace(/[^\p{L}\s&-]/gu, ' ')
    .split(/[\s-]+/)
    .filter((m) => m.length > 2 || /^\p{Lu}/u.test(m))
    .slice(0, 2)
    .map((m) => m[0]!.toUpperCase())
    .join('') || nom.slice(0, 2).toUpperCase()
