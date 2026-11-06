import { useEffect, useRef, useState } from 'react'
import { AlarmClock, Hourglass, Landmark, TrendingUp } from 'lucide-react'
import type { Kpi } from '../../server/types'
import Tendance from '../components/Tendance'
import { euros } from '../lib/format'

const ICONES = { ca: TrendingUp, encaisse: Landmark, a_encaisser: Hourglass, retard: AlarmClock }

/**
 * Un montant qui, quand il change (une facture émise, un paiement reçu), défile jusqu'à sa nouvelle
 * valeur en 0,9 s et s'éclaire un instant. Au premier affichage, il apparaît directement.
 */
export function Montant({ valeur }: { valeur: number }) {
  const [affiche, setAffiche] = useState(valeur)
  const [eclaire, setEclaire] = useState(false)
  const actuel = useRef(valeur)
  useEffect(() => {
    const depart = actuel.current
    if (depart === valeur) return
    setEclaire(true)
    const t0 = performance.now()
    let image = 0
    const pas = (t: number) => {
      const p = Math.min(1, (t - t0) / 900)
      actuel.current = depart + (valeur - depart) * (1 - (1 - p) ** 3)
      setAffiche(actuel.current)
      if (p < 1) image = requestAnimationFrame(pas)
    }
    image = requestAnimationFrame(pas)
    const fin = window.setTimeout(() => setEclaire(false), 1400)
    return () => {
      cancelAnimationFrame(image)
      window.clearTimeout(fin)
    }
  }, [valeur])
  return <span className={eclaire ? 'est-maj' : undefined}>{euros(affiche)}</span>
}

export default function Kpis({ kpis }: { kpis: Kpi[] | null }) {
  return (
    <section className="carte kpis" aria-label="Chiffres clés">
      {kpis
        ? kpis.map((k) => {
            const Icone = ICONES[k.cle]
            return (
              <article className="kpi" key={k.cle}>
                <header className="kpi__tete">
                  <span className="tuile">
                    <Icone strokeWidth={1.7} />
                  </span>
                  <h2 className="etiquette">{k.libelle}</h2>
                </header>
                <p className={`chiffre${k.valeur === null ? ' valeur-absente' : ''}`}>{k.valeur === null ? '—' : <Montant valeur={k.valeur} />}</p>
                <footer className="kpi__pied">
                  <span>{k.legende}</span>
                  <Tendance tendance={k.tendance} />
                </footer>
              </article>
            )
          })
        : <p className="charge" style={{ gridColumn: '1 / -1' }}>Lecture des factures…</p>}
    </section>
  )
}
