import { useState } from 'react'
import { Circle, CircleCheck, Zap } from 'lucide-react'
import type { StatutFacture } from '../../server/types'
import { TACHES_SEMAINE, jourOuvre, type TacheSemaine } from '../data/agenda'
import { PuceOutil } from './MissionControl'

type Statut = 'faite' | 'auto' | 'a_faire' | 'en_retard'
// Mêmes couleurs que les statuts de facture : vert fait, bleu automatique, gris à faire, rouge en retard.
const STATUT: Record<Statut, { libelle: string; couleur: StatutFacture }> = {
  faite: { libelle: 'Faite', couleur: 'payee' },
  auto: { libelle: 'Automatique', couleur: 'a_venir' },
  a_faire: { libelle: 'À faire', couleur: 'brouillon' },
  en_retard: { libelle: 'En retard', couleur: 'en_retard' },
}

const statut = (t: TacheSemaine): Statut => (t.etat === 'a_faire' && t.j < 0 ? 'en_retard' : t.etat)

function quand(t: TacheSemaine) {
  const ecart = Math.round((jourOuvre(t.j).getTime() - new Date().setHours(12, 0, 0, 0)) / 86_400_000)
  const jour =
    ecart === 0 ? "aujourd'hui" : ecart === 1 ? 'demain' : ecart === -1 ? 'hier' : jourOuvre(t.j).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
  return `${jour}, ${t.heure}`
}

/** Les tâches de la semaine, cochables. Celles d'aujourd'hui sont celles de « Ta journée ». */
export default function Taches() {
  const [taches, setTaches] = useState(() => [...TACHES_SEMAINE].sort((a, b) => a.j - b.j || a.heure.localeCompare(b.heure)))
  const compte = (s: Statut) => taches.filter((t) => statut(t) === s).length
  const basculer = (i: number) =>
    setTaches((liste) => liste.map((t, k) => (k === i && t.etat !== 'auto' ? { ...t, etat: t.etat === 'faite' ? 'a_faire' : 'faite' } : t)))

  return (
    <section className="carte factures page-pleine taches" aria-label="Tâches">
      <div className="carte__tete">
        <h2 className="etiquette">Tâches de la semaine</h2>
        <span className="journee__date">
          {compte('a_faire') + compte('en_retard')} à faire · {compte('faite')} faites · {compte('auto')} automatiques
        </span>
      </div>
      <div className="factures__defilement">
        <table className="tableau">
          <colgroup>
            <col style={{ width: '5%' }} />
            <col style={{ width: '45%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '14%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>
                <span className="sr-only">Fait</span>
              </th>
              <th>Tâche</th>
              <th>Outil</th>
              <th>Quand</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {taches.map((t, i) => {
              const s = statut(t)
              return (
                <tr key={t.j + t.heure + t.titre} className={`ligne-tache ligne-tache--${t.etat}`}>
                  <td>
                    <button
                      className="tache__case"
                      onClick={() => basculer(i)}
                      disabled={t.etat === 'auto'}
                      aria-pressed={t.etat !== 'a_faire'}
                      aria-label={t.etat === 'auto' ? 'Automatique' : t.etat === 'faite' ? 'Marquer à faire' : 'Marquer faite'}
                    >
                      {t.etat === 'faite' ? <CircleCheck /> : t.etat === 'auto' ? <Zap /> : <Circle />}
                    </button>
                  </td>
                  <td className="tache__titre">{t.titre}</td>
                  <td>
                    <PuceOutil id={t.outil} />
                  </td>
                  <td>{quand(t)}</td>
                  <td>
                    <span className={`pastille pastille--${STATUT[s].couleur}`}>{STATUT[s].libelle}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
