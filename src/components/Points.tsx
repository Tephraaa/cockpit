import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { INTRO } from '../lib/intro'

export type Point = { x: number; y: number; delai?: number }

type Props = {
  /** Repère des points [largeur, hauteur], étiré sur toute la boîte. */
  repere: [number, number]
  /** Côté d'un point, dans le repère. */
  taille: number
  allumes: Point[]
  /** Points toujours visibles, en sombre (le « rail » d'une jauge, la carte vide). */
  eteints?: Point[]
  /** Couleurs : une valeur CSS ou le nom d'une variable (« --vert »). */
  couleur: string
  eclat: string
  couleurEteint?: string
  anime: boolean
  className?: string
}

/**
 * Des points carrés dessinés sur un canvas : des milliers d'éléments HTML animés à la fois
 * feraient ramer la page. Pendant l'intro, chaque point attend son délai, flashe, puis se pose ;
 * ensuite le canvas garde simplement sa dernière image.
 */
export default function Points(props: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const p = useRef(props)
  p.current = props
  const depart = useRef<number | null>(null)
  const image = useRef(0)
  const tourne = useRef(false)

  const dessiner = useCallback(() => {
    const c = canvas.current
    if (!c) return false
    const { width, height } = c.getBoundingClientRect()
    if (!width || !height) return false
    const dpr = window.devicePixelRatio || 1
    const W = Math.round(width * dpr)
    const H = Math.round(height * dpr)
    if (c.width !== W || c.height !== H) {
      c.width = W
      c.height = H
    }
    const ctx = c.getContext('2d')!
    const { repere, taille, allumes, eteints, couleur, eclat, couleurEteint, anime } = p.current
    const style = getComputedStyle(c)
    const teinte = (v: string) => (v.startsWith('--') ? style.getPropertyValue(v).trim() : v)
    const sx = W / repere[0]
    const sy = H / repere[1]
    // calés sur les pixels de l'écran : des carrés nets, sans flou
    const carre = (chemin: Path2D, pt: Point) => {
      const x0 = Math.round(pt.x * sx)
      const y0 = Math.round(pt.y * sy)
      chemin.rect(x0, y0, Math.max(1, Math.round((pt.x + taille) * sx) - x0), Math.max(1, Math.round((pt.y + taille) * sy) - y0))
    }

    ctx.clearRect(0, 0, W, H)
    if (eteints?.length && couleurEteint) {
      const rail = new Path2D()
      eteints.forEach((pt) => carre(rail, pt))
      ctx.fillStyle = teinte(couleurEteint)
      ctx.fill(rail)
    }
    if (anime && depart.current === null) depart.current = performance.now()
    const t = anime ? performance.now() - depart.current! : Infinity
    let enAttente = false
    const poses = new Path2D()
    const eclats = new Path2D()
    for (const pt of allumes) {
      const d = pt.delai ?? 0
      if (t < d) {
        enAttente = true
        continue
      }
      if (t < d + INTRO.pose) enAttente = true
      carre(t < d + INTRO.eclat ? eclats : poses, pt)
    }
    ctx.fillStyle = teinte(couleur)
    ctx.fill(poses)
    ctx.fillStyle = teinte(eclat)
    ctx.fill(eclats)
    return enAttente
  }, [])

  // Pendant l'intro : une image par rafraîchissement d'écran, jusqu'au dernier point posé.
  const lancer = useCallback(() => {
    if (tourne.current) return
    tourne.current = true
    const boucle = () => {
      if (dessiner()) image.current = requestAnimationFrame(boucle)
      else tourne.current = false
    }
    image.current = requestAnimationFrame(boucle)
  }, [dessiner])
  useEffect(() => {
    lancer()
    return () => {
      cancelAnimationFrame(image.current)
      tourne.current = false
    }
  }, [lancer])

  // Ensuite : on redessine quand les données, la taille ou le thème changent.
  useLayoutEffect(() => {
    if (props.anime) lancer()
    else dessiner()
  })
  useEffect(() => {
    const c = canvas.current
    if (!c) return
    const taille = new ResizeObserver(() => dessiner() && lancer())
    taille.observe(c)
    const theme = new MutationObserver(() => dessiner())
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => {
      taille.disconnect()
      theme.disconnect()
    }
  }, [dessiner])

  return <canvas ref={canvas} className={props.className} aria-hidden="true" />
}
