import type { CSSProperties } from 'react'
import type { StatutFacture } from '../../server/types'
import BarrePoints, { type Ton } from '../components/BarrePoints'
import { ETAPES, LEADS, type EtapeLead } from '../data/leads'
import { bruit } from '../lib/intro'
import { euros, initiales } from '../lib/format'

// Les étapes reprennent les couleurs des statuts de facture : gris à traiter, bleu en cours, ambre en attente du client.
const COULEUR: Record<EtapeLead, StatutFacture> = {
  nouveau: 'brouillon',
  contacte: 'a_venir',
  rdv: 'a_venir',
  devis: 'partielle',
  gagne: 'payee',
  perdu: 'en_retard',
}
const TON: Record<EtapeLead, Ton> = { nouveau: 'vert', contacte: 'vert', rdv: 'vert', devis: 'ambre', gagne: 'vert', perdu: 'gris' }

const ilYa = (jours: number) => (jours === 0 ? "aujourd'hui" : jours === 1 ? 'hier' : `il y a ${jours} j`)

/** Les prospects en cours, de l'étape « nouveau » à la signature (données de src/data/leads.ts). */
export default function Leads({ intro }: { intro: boolean }) {
  const enCours = LEADS.filter((l) => l.etape !== 'gagne' && l.etape !== 'perdu')
  const enJeu = enCours.reduce((s, l) => s + l.montant, 0)
  return (
    <section className="carte factures leads" aria-label="Leads">
      <div className="carte__tete">
        <h2 className="etiquette">Leads</h2>
        <span className="journee__date">
          {enCours.length} en cours · {euros(enJeu)} HT en jeu
        </span>
      </div>
      <div className="factures__defilement">
        <table className="tableau">
          <colgroup>
            <col style={{ width: '27%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '25%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Prospect</th>
              <th>Source</th>
              <th>Étape</th>
              <th>Avancement</th>
              <th className="cellule-droite">Montant HT</th>
              <th className="cellule-droite">Dernier échange</th>
            </tr>
          </thead>
          <tbody>
            {LEADS.map((l, i) => (
              <tr key={l.entreprise} className={l.etape === 'perdu' ? 'est-en-attente' : ''}>
                <td>
                  <span className="client">
                    <span className="avatar" style={{ '--teinte': Math.round(bruit(i + 40, 3) * 360) } as CSSProperties}>
                      {initiales(l.entreprise)}
                    </span>
                    <span title={`${l.contact}, ${l.ville}`}>
                      {l.entreprise} <span className="lead__ville">· {l.ville}</span>
                    </span>
                  </span>
                </td>
                <td>{l.source}</td>
                <td>
                  <span className={`pastille pastille--${COULEUR[l.etape]}`}>{ETAPES[l.etape].libelle}</span>
                </td>
                <td>
                  <span className="echeance">
                    <BarrePoints valeur={ETAPES[l.etape].avancement} lignes={4} ton={TON[l.etape]} anime={intro} libelle={l.suite} />
                    <span className="echeance__texte">{l.suite}</span>
                  </span>
                </td>
                <td className="cellule-droite">{euros(l.montant)}</td>
                <td className="cellule-droite">{ilYa(l.dernierEchange)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
