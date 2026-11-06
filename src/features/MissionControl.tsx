import { useState } from 'react'
import { ArrowRight, CircleCheck, Circle, Landmark, ListChecks, Timer, Workflow, Zap } from 'lucide-react'
import type { Tableau } from '../../server/types'
import BarrePoints from '../components/BarrePoints'
import { AUTOMATISATIONS, OUTILS, TACHES, type Tache } from '../data/mission'
import { Montant } from './Kpis'

type Props = {
  tableau: Tableau | null
  ouvrirPennylane: () => void
  intro: boolean
}

const outil = (id: string) => OUTILS.find((o) => o.id === id)!
const duree = (minutes: number) => `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`

export function PuceOutil({ id }: { id: string }) {
  const { nom, icone: Icone } = outil(id)
  return (
    <span className={`puce-outil puce-outil--${id}`}>
      <Icone strokeWidth={1.6} aria-hidden="true" />
      {nom}
    </span>
  )
}

/** La vue d'ensemble de l'entreprise : sa journée, ses outils, ses automatisations, et Pennylane en module. */
export default function MissionControl({ tableau, ouvrirPennylane, intro }: Props) {
  const [taches, setTaches] = useState<Tache[]>(TACHES)
  const faites = taches.filter((t) => t.etat !== 'a_faire').length
  const automatiques = taches.filter((t) => t.etat === 'auto').length
  const minutesParSemaine = AUTOMATISATIONS.reduce((s, a) => s + a.minutes * a.parSemaine, 0)
  const passages = AUTOMATISATIONS.reduce((s, a) => s + a.parSemaine, 0)
  const encaisse = tableau?.kpis.find((k) => k.cle === 'encaisse')?.valeur ?? null
  const aujourdhui = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  const basculer = (i: number) =>
    setTaches((liste) => liste.map((t, k) => (k === i && t.etat !== 'auto' ? { ...t, etat: t.etat === 'faite' ? 'a_faire' : 'faite' } : t)))

  return (
    <>
      <section className="carte kpis" aria-label="Chiffres du jour">
        <article className="kpi">
          <header className="kpi__tete">
            <span className="tuile">
              <ListChecks strokeWidth={1.7} />
            </span>
            <h2 className="etiquette">Tâches du jour</h2>
          </header>
          <p className="chiffre">
            {faites}/{taches.length}
          </p>
          <footer className="kpi__pied">
            <span>dont {automatiques} automatiques</span>
            <span className="tendance tendance--neutre">{Math.round((faites / taches.length) * 100)} %</span>
          </footer>
        </article>
        <article className="kpi">
          <header className="kpi__tete">
            <span className="tuile">
              <Workflow strokeWidth={1.7} />
            </span>
            <h2 className="etiquette">Automatisations</h2>
          </header>
          <p className="chiffre">{AUTOMATISATIONS.length} actives</p>
          <footer className="kpi__pied">
            <span>{passages} passages par semaine</span>
          </footer>
        </article>
        <article className="kpi">
          <header className="kpi__tete">
            <span className="tuile">
              <Timer strokeWidth={1.7} />
            </span>
            <h2 className="etiquette">Temps gagné</h2>
          </header>
          <p className="chiffre">{duree(minutesParSemaine)}</p>
          <footer className="kpi__pied">
            <span>chaque semaine</span>
          </footer>
        </article>
        <article className="kpi">
          <header className="kpi__tete">
            <span className="tuile">
              <Landmark strokeWidth={1.7} />
            </span>
            <h2 className="etiquette">Encaissé</h2>
          </header>
          <p className={`chiffre${encaisse !== null ? '' : ' valeur-absente'}`}>{encaisse !== null ? <Montant valeur={encaisse} /> : '—'}</p>
          <footer className="kpi__pied">
            <span>30 jours, depuis Pennylane</span>
          </footer>
        </article>
      </section>

      <div className="graphiques">
        <section className="carte journee" aria-label="Ta journée">
          <div className="carte__tete">
            <h2 className="etiquette">Ta journée</h2>
            <span className="journee__date">{aujourdhui}</span>
          </div>
          <BarrePoints valeur={faites / taches.length} lignes={3} anime={intro} libelle={`${faites} tâches sur ${taches.length}`} className="journee__barre" />
          <ul className="journee__liste">
            {taches.map((t, i) => (
              <li key={t.heure + t.titre} className={`tache tache--${t.etat}`}>
                <button
                  className="tache__case"
                  onClick={() => basculer(i)}
                  disabled={t.etat === 'auto'}
                  aria-pressed={t.etat !== 'a_faire'}
                  aria-label={t.etat === 'auto' ? 'Automatique' : t.etat === 'faite' ? 'Marquer à faire' : 'Marquer faite'}
                >
                  {t.etat === 'faite' ? <CircleCheck /> : t.etat === 'auto' ? <Zap /> : <Circle />}
                </button>
                <span className="tache__heure">{t.heure}</span>
                <span className="tache__titre">{t.titre}</span>
                <PuceOutil id={t.outil} />
              </li>
            ))}
          </ul>
        </section>

        <section className="carte outils" aria-label="Tes outils">
          <div className="carte__tete">
            <h2 className="etiquette">Tes outils</h2>
            <span className="journee__date">Pennylane branché</span>
          </div>
          <div className="outils__grille">
            {OUTILS.map((o) => {
              const Icone = o.icone
              const nbTaches = taches.filter((t) => t.outil === o.id).length
              const nbAuto = AUTOMATISATIONS.filter((a) => a.outil === o.id).length
              const estPennylane = o.id === 'pennylane'
              return (
                <article key={o.id} className={`outil${estPennylane ? ' outil--pennylane outil--oui' : ''}`}>
                  <div className="outil__tete">
                    <span className="tuile">
                      <Icone strokeWidth={1.7} />
                    </span>
                    {estPennylane ? (
                      <button className="bouton bouton--petit" onClick={ouvrirPennylane}>
                        Ouvrir
                        <ArrowRight />
                      </button>
                    ) : (
                      <span className="outil__compte" title={`${nbAuto} automatisation${nbAuto > 1 ? 's' : ''}`}>
                        {nbTaches} tâche{nbTaches > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="outil__nom">
                    {o.nom}
                    {estPennylane && <span className="pastille pastille--payee pastille--courte">branché</span>}
                  </p>
                  <p className="outil__role">{o.role}</p>
                </article>
              )
            })}
          </div>
        </section>
      </div>

      <section className="carte factures automatisations" aria-label="Automatisations">
        <div className="carte__tete">
          <h2 className="etiquette">Automatisations</h2>
        </div>
        <div className="factures__defilement">
          <table className="tableau">
            <colgroup>
              <col style={{ width: '29%' }} />
              <col style={{ width: '19%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '22%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>Automatisation</th>
                <th>Quand</th>
                <th>Outil</th>
                <th>Dernier passage</th>
                <th>Réussite, 30 jours</th>
              </tr>
            </thead>
            <tbody>
              {AUTOMATISATIONS.map((a) => (
                <tr key={a.nom}>
                  <td className="automatisation__nom">{a.nom}</td>
                  <td>{a.quand}</td>
                  <td>
                    <PuceOutil id={a.outil} />
                  </td>
                  <td>{a.derniere}</td>
                  <td>
                    <span className="echeance">
                      <BarrePoints
                        valeur={a.reussite}
                        lignes={4}
                        ton={a.reussite < 0.9 ? 'ambre' : 'vert'}
                        anime={intro}
                        libelle={`${Math.round(a.reussite * 100)} % de réussite`}
                      />
                      <span className="echeance__texte">{`${Math.round(a.reussite * 100)} %`}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
