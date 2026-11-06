import { useEffect, useState } from 'react'

// La chorégraphie du chargement : la courbe se trace, puis les points s'allument de gauche à
// droite, chacun avec un éclat vif avant de se poser ; les repères de la carte arrivent en dernier.
export const INTRO = {
  trait: 800,
  debutPoints: 550,
  balayage: 1100,
  desordre: 260,
  eclat: 90,
  pose: 220,
  reperes: 1750,
}
export const FIN_INTRO = INTRO.debutPoints + INTRO.balayage + INTRO.desordre + INTRO.pose

/** Pseudo-hasard stable dans [0, 1) : l'ordre des points semble désordonné mais ne change jamais. */
export function bruit(a: number, b: number) {
  let h = Math.imul(a * 374761393 + b * 668265263, 0x27d4eb2d) ^ (a * 2246822519)
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b)
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296
}

/** Moment où s'allume un point placé à `u` (0 = bord gauche, 1 = bord droit). */
export const delaiPoint = (u: number, a: number, b: number) => INTRO.debutPoints + u * INTRO.balayage + bruit(a, b) * INTRO.desordre

export const reduireAnimations = () => typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Vrai pendant l'intro, qui démarre quand `pret` passe à vrai. Elle se rejoue quand `cle` change
 * (une autre page), jamais au simple rafraîchissement des données.
 */
export function useIntro(pret: boolean, cle = '') {
  const [enCours, setEnCours] = useState(() => !reduireAnimations())
  const [cleVue, setCleVue] = useState(cle)
  if (cle !== cleVue) {
    setCleVue(cle)
    if (!reduireAnimations()) setEnCours(true)
  }
  useEffect(() => {
    if (!enCours || !pret) return
    const t = window.setTimeout(() => setEnCours(false), FIN_INTRO + 900)
    return () => window.clearTimeout(t)
  }, [enCours, pret, cleVue])
  return enCours
}
