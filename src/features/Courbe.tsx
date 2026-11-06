import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import type { Serie } from '../../server/types'
import Points, { type Point } from '../components/Points'
import Tendance from '../components/Tendance'
import { usePopover } from '../components/usePopover'
import { FIN_INTRO, delaiPoint } from '../lib/intro'
import { dateCourte, euros, kilo } from '../lib/format'

const PERIODES: { id: Serie['periode']; libelle: string }[] = [
  { id: '12m', libelle: '12 mois' },
  { id: '6m', libelle: '6 mois' },
]
const PAS = 5.2 // écart entre deux points de l'aire, en pixels de maquette
const COTE = 3
// Trame ordonnée 4 × 4 : l'aire est pleine sous la courbe et s'éclaircit vers le bas.
const TRAME = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16)

/** Graduation « ronde » de l'axe : 6 intervalles de 1, 2, 2,5 ou 5 × 10ⁿ. */
function graduation(max: number) {
  const brut = Math.max(max, 1) / 6
  const puissance = 10 ** Math.floor(Math.log10(brut))
  const pas = [1, 2, 2.5, 5, 10].map((m) => m * puissance).find((p) => p >= brut)!
  return { pas, haut: pas * 6 }
}

export default function Courbe({ series, intro, titre = "Chiffre d'affaires HT" }: { series: Serie[] | null; intro: boolean; titre?: string }) {
  const [periode, setPeriode] = useState<Serie['periode']>('12m')
  const [rejoue, setRejoue] = useState(false)
  const [survol, setSurvol] = useState<number | null>(null)
  const [boite, setBoite] = useState({ l: 0, h: 0, echelle: 1 })
  const trace = useRef<HTMLDivElement>(null)
  const menu = usePopover()
  const serie = series?.find((s) => s.periode === periode) ?? null
  const anime = intro || rejoue

  useEffect(() => {
    const el = trace.current
    if (!el) return
    const mesure = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      setBoite({ l: r.width, h: r.height, echelle: parseFloat(getComputedStyle(document.documentElement).fontSize) / 16 })
    })
    mesure.observe(el)
    return () => mesure.disconnect()
  }, [])

  const dessin = useMemo(() => {
    if (!serie || !boite.l) return null
    const { pas, haut } = graduation(Math.max(...serie.points.map((p) => p.montant)) * 1.05)
    const n = serie.points.length
    const tx = (i: number) => 0.02 + (i * 0.96) / (n - 1)
    // en pixels de maquette : la grille de points garde la même finesse à toutes les tailles d'écran
    const L = boite.l / boite.echelle
    const H = boite.h / boite.echelle
    const y = (v: number) => H - (v / haut) * H
    const sommets = [
      { x: 0, y: y(serie.points[0].montant) },
      ...serie.points.map((p, i) => ({ x: tx(i) * L, y: y(p.montant) })),
      { x: L, y: y(serie.points[n - 1].montant) },
    ]
    const ligneEn = (x: number) => {
      const k = Math.max(1, sommets.findIndex((s) => s.x >= x))
      const a = sommets[k - 1]
      const b = sommets[k]
      return a.y + ((b.y - a.y) * (x - a.x)) / Math.max(1e-6, b.x - a.x)
    }
    const allumes: Point[] = []
    const colonnes = Math.floor(L / PAS)
    const lignes = Math.floor(H / PAS)
    for (let c = 0; c < colonnes; c++) {
      const cx = c * PAS + COTE / 2
      const sommet = ligneEn(cx) + 1.5
      for (let l = Math.ceil(sommet / PAS); l < lignes; l++) {
        const profondeur = (l * PAS - sommet) / Math.max(1, H - sommet)
        if (TRAME[(l % 4) * 4 + (c % 4)] < 1 - 0.78 * profondeur ** 1.15)
          allumes.push({ x: c * PAS, y: l * PAS, delai: delaiPoint(c / colonnes, c, l) })
      }
    }
    const e = boite.echelle
    const chemin = sommets.map((s, i) => `${i ? 'L' : 'M'}${(s.x * e).toFixed(1)} ${(s.y * e).toFixed(1)}`).join(' ')
    return { pas, haut, tx, allumes, chemin, L, H }
  }, [serie, boite])

  const choisir = (p: Serie['periode']) => {
    menu.setOuvert(false)
    if (p === periode) return
    setPeriode(p)
    setRejoue(true)
    window.setTimeout(() => setRejoue(false), FIN_INTRO + 200)
  }

  const survolDe = (x: number) => {
    if (!dessin || !serie) return null
    const u = x / boite.l
    let meilleur = 0
    serie.points.forEach((_, i) => Math.abs(dessin.tx(i) - u) < Math.abs(dessin.tx(meilleur) - u) && (meilleur = i))
    return meilleur
  }
  const point = survol !== null && serie ? serie.points[survol] : null

  return (
    <section className="carte courbe" aria-label={titre}>
      <div className="carte__tete">
        <h2 className="etiquette">{titre}</h2>
        <div className="deroulant" ref={menu.ref}>
          <button className="bouton deroulant__bouton" aria-expanded={menu.ouvert} onClick={menu.basculer}>
            {PERIODES.find((p) => p.id === periode)!.libelle}
            <ChevronDown />
          </button>
          {menu.ouvert && (
            <div className="menu" role="menu">
              {PERIODES.map((p) => (
                <button key={p.id} className={`menu__item${p.id === periode ? ' est-choisi' : ''}`} role="menuitemradio" aria-checked={p.id === periode} onClick={() => choisir(p.id)}>
                  {p.libelle}
                  {p.id === periode && <Check className="coche" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="courbe__entete">
        <p className="chiffre" key={periode}>{serie ? euros(serie.total) : '—'}</p>
        {serie?.variation !== null && serie?.variation !== undefined && <Tendance tendance={{ pourcent: serie.variation }} />}
      </div>

      <div className="courbe__zone">
        <div className="courbe__axe-y" aria-hidden="true">
          {dessin && Array.from({ length: 7 }, (_, i) => <span key={i} style={{ top: `${(1 - i / 6) * 100}%` }}>{kilo(dessin.pas * i)}</span>)}
        </div>
        <div
          className="courbe__trace"
          ref={trace}
          onMouseMove={(e) => setSurvol(survolDe(e.clientX - e.currentTarget.getBoundingClientRect().left))}
          onMouseLeave={() => setSurvol(null)}
        >
          {dessin && (
            <>
              <Points key={periode} repere={[dessin.L, dessin.H]} taille={COTE} allumes={dessin.allumes} couleur="--vert" eclat="--vert-vif" anime={anime} />
              <svg viewBox={`0 0 ${boite.l} ${boite.h}`} aria-hidden="true">
                <path key={periode} className={`trait${anime ? ' est-intro' : ''}`} d={dessin.chemin} pathLength={1} />
              </svg>
              {point && survol !== null && (
                <>
                  <span className="courbe__repere" style={{ left: `${dessin.tx(survol) * 100}%` }} />
                  <span
                    className="bulle"
                    style={{
                      left: `${dessin.tx(survol) * 100}%`,
                      top: 6,
                      translate: dessin.tx(survol) > 0.7 ? 'calc(-100% - 10px) 0' : '10px 0',
                    }}
                  >
                    du {dateCourte(point.debut)} au {dateCourte(point.fin)}
                    <strong>{euros(point.montant)} HT</strong>
                  </span>
                </>
              )}
            </>
          )}
          {!serie && <p className="charge">Lecture des factures…</p>}
        </div>
        <div className="courbe__axe-x" aria-hidden="true">
          {dessin &&
            serie!.points.map((p, i) =>
              periode === '6m' && i % 2 ? null : (
                <span key={i} style={{ left: `${dessin.tx(i) * 100}%` }}>
                  {p.etiquette}
                </span>
              ),
            )}
        </div>
      </div>
    </section>
  )
}
