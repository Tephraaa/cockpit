import type { CSSProperties } from 'react'
import type { ClientResume } from '../../server/types'
import BarrePoints from '../components/BarrePoints'
import { bruit } from '../lib/intro'
import { dateCourte, euros, initiales } from '../lib/format'

type Props = { clients: ClientResume[] | null; ouvrir: (id: number) => void; intro: boolean }

/** Tous les clients, du plus gros chiffre d'affaires sur 12 mois au plus petit. Un clic ouvre sa fiche. */
export default function Clients({ clients, ouvrir, intro }: Props) {
  const liste = [...(clients ?? [])].sort((a, b) => b.ca12 - a.ca12)
  const max = Math.max(1, ...liste.map((c) => c.ca12))
  const total = liste.reduce((s, c) => s + c.ca12, 0)
  return (
    <section className="carte factures page-pleine" aria-label="Clients">
      <div className="carte__tete">
        <h2 className="etiquette">Clients</h2>
        <span className="journee__date">
          {liste.length} clients · {euros(total)} HT sur 12 mois
        </span>
      </div>
      <div className="factures__defilement">
        <table className="tableau">
          <colgroup>
            <col style={{ width: '27%' }} />
            <col style={{ width: '17%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '9%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Client</th>
              <th>Région</th>
              <th>Chiffre d'affaires HT, 12 mois</th>
              <th className="cellule-droite">À encaisser</th>
              <th className="cellule-droite">En retard</th>
              <th className="cellule-droite">Factures</th>
              <th className="cellule-droite">Dernière</th>
            </tr>
          </thead>
          <tbody>
            {liste.map((c) => (
              <tr key={c.id} className="ligne-cliquable" onClick={() => ouvrir(c.id)}>
                <td>
                  <span className="client">
                    <span className="avatar" style={{ '--teinte': Math.round(bruit(c.id, 3) * 360) } as CSSProperties}>
                      {initiales(c.nom)}
                    </span>
                    <button className="lien-client" onClick={(e) => (e.stopPropagation(), ouvrir(c.id))}>
                      {c.nom}
                    </button>
                    <span className="lead__ville">· {c.ville}</span>
                  </span>
                </td>
                <td>{c.region ?? '—'}</td>
                <td>
                  <span className="echeance">
                    <BarrePoints valeur={c.ca12 / max} lignes={4} anime={intro} libelle={euros(c.ca12)} />
                    <span className="echeance__texte">{euros(c.ca12)}</span>
                  </span>
                </td>
                <td className="cellule-droite">{c.aEncaisser ? euros(c.aEncaisser) : '—'}</td>
                <td className={`cellule-droite${c.enRetard ? ' montant--retard' : ''}`}>{c.enRetard ? euros(c.enRetard) : '—'}</td>
                <td className="cellule-droite">{c.nbFactures}</td>
                <td className="cellule-droite">{dateCourte(c.derniereFacture)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!clients && <p className="vide">Lecture des clients…</p>}
      </div>
    </section>
  )
}
