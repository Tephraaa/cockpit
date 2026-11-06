import { useEffect, useMemo, useRef, useState } from 'react'
import { delaiPoint } from '../lib/intro'
import Points, { type Point } from './Points'

export type Ton = 'vert' | 'ambre' | 'rouge' | 'gris'

const COULEURS: Record<Ton, [string, string]> = {
  vert: ['--vert', '--vert-vif'],
  ambre: ['--ambre', '--ambre-eclat'],
  rouge: ['--rouge', '--rouge'],
  gris: ['--gris', '--gris'],
}

type Props = {
  /** Remplissage, de 0 à 1. */
  valeur: number
  lignes: number
  /** Écart entre deux points et côté d'un point, en pixels de maquette. */
  pas?: number
  cote?: number
  ton?: Ton
  anime: boolean
  libelle: string
  className?: string
}

/**
 * Une jauge en points. Elle prend toute la largeur disponible : le nombre de colonnes se déduit
 * de sa largeur, pour que les points restent carrés. Le bord du remplissage est tramé en damier,
 * décalé d'une ligne à l'autre, comme une image de jeu vidéo.
 */
export default function BarrePoints({ valeur, lignes, pas = 4, cote = 2.6, ton = 'vert', anime, libelle, className = '' }: Props) {
  const boite = useRef<HTMLSpanElement>(null)
  const [colonnes, setColonnes] = useState(0)

  useEffect(() => {
    const el = boite.current
    if (!el) return
    const mesure = new ResizeObserver(() => {
      const echelle = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16
      const largeur = el.getBoundingClientRect().width / echelle
      setColonnes(Math.max(4, Math.floor((largeur - cote) / pas) + 1))
    })
    mesure.observe(el)
    return () => mesure.disconnect()
  }, [pas, cote])

  const { allumes, eteints } = useMemo(() => {
    const fin = Math.round(Math.max(0, Math.min(1, valeur)) * colonnes)
    const allumes: Point[] = []
    const eteints: Point[] = []
    for (let l = 0; l < lignes; l++) {
      for (let c = 0; c < colonnes; c++) {
        // les 3 dernières colonnes pleines deviennent un damier
        const pleine = c < fin - 3 || (c < fin && (c + l) % 2 === 0)
        const pt = { x: c * pas, y: l * pas }
        if (pleine) allumes.push({ ...pt, delai: delaiPoint(c / colonnes, c * 7 + fin, l) })
        if (!pleine || anime) eteints.push(pt)
      }
    }
    return { allumes, eteints }
  }, [valeur, colonnes, lignes, pas, anime])

  const [couleur, eclat] = COULEURS[ton]
  return (
    <span ref={boite} className={`barre-points ${className}`} style={{ height: `${((lignes - 1) * pas + cote) / 16}rem` }} role="img" aria-label={libelle}>
      {colonnes > 0 && (
        <Points
          repere={[(colonnes - 1) * pas + cote, (lignes - 1) * pas + cote]}
          taille={cote}
          allumes={allumes}
          eteints={eteints}
          couleur={couleur}
          eclat={eclat}
          couleurEteint="--point-eteint"
          anime={anime}
        />
      )}
    </span>
  )
}
