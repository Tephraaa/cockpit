import { useState, type CSSProperties } from 'react'
import { Plus } from 'lucide-react'
import type { ClientResume, Kpi, LigneFacture } from '../../server/types'
import BarrePoints from '../components/BarrePoints'
import { bruit } from '../lib/intro'
import { dateLongue, euros, initiales } from '../lib/format'
import Courbe from './Courbe'
import Factures from './Factures'
import Kpis from './Kpis'

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`

type Props = {
  client: ClientResume
  /** Le chiffre d'affaires HT de tous les clients sur 12 mois, pour la part de celui-ci. */
  caAnnuel: number
  factures: LigneFacture[] | null
  intro: boolean
  nouvelle: number | null
  relancer: (f: LigneFacture) => void
  finaliser: (f: LigneFacture) => void
  lienPaiement: (f: LigneFacture, action: 'ouvrir' | 'copier') => void
  facturer: () => void
}

/** La fiche d'un client : ce qu'il t'a rapporté, ce qu'il doit encore, sa courbe et ses factures. */
export default function FicheClient({ client: c, caAnnuel, factures, intro, nouvelle, relancer, finaliser, lienPaiement, facturer }: Props) {
  const [recherche, setRecherche] = useState('')
  const part = caAnnuel > 0 ? c.ca12 / caAnnuel : 0
  const kpis: Kpi[] = [
    { cle: 'ca', libelle: "Chiffre d'affaires", valeur: c.caTotal, legende: 'HT, toutes ses factures', tendance: { texte: pluriel(c.nbFactures, 'facture'), ton: 'neutre' } },
    { cle: 'encaisse', libelle: 'Réglé', valeur: c.regle, legende: 'TTC, déjà payé', tendance: null },
    { cle: 'a_encaisser', libelle: 'À encaisser', valeur: c.aEncaisser, legende: `${pluriel(c.nbOuvertes, 'facture')} TTC`, tendance: null },
    {
      cle: 'retard',
      libelle: 'En retard',
      valeur: c.enRetard,
      legende: `${pluriel(c.nbRetard, 'facture')} TTC`,
      tendance: c.nbRetard ? { texte: 'à relancer', ton: 'alerte' } : null,
    },
  ]

  return (
    <>
      <Kpis kpis={kpis} />
      <div className="graphiques">
        <Courbe series={c.series} intro={intro} titre="Ce qu'il t'a rapporté, HT" />
        <section className="carte fiche" aria-label="Fiche client">
          <div className="carte__tete">
            <h2 className="etiquette">Fiche client</h2>
            <span className="journee__date">{c.region ?? 'hors carte'}</span>
          </div>
          <div className="fiche__identite">
            <span className="avatar" style={{ '--teinte': Math.round(bruit(c.id, 3) * 360) } as CSSProperties}>
              {initiales(c.nom)}
            </span>
            <div>
              <p className="fiche__nom">{c.nom}</p>
              <p className="fiche__lieu">{c.ville ?? 'Ville inconnue'}</p>
            </div>
          </div>
          <dl className="fiche__infos">
            <div>
              <dt>Adresse</dt>
              <dd>{c.adresse ?? '—'}</dd>
            </div>
            <div>
              <dt>E-mail</dt>
              <dd>{c.email ?? '—'}</dd>
            </div>
            <div>
              <dt>Client depuis</dt>
              <dd>{dateLongue(c.depuis)}</dd>
            </div>
            <div>
              <dt>Dernière facture</dt>
              <dd>{dateLongue(c.derniereFacture)}</dd>
            </div>
          </dl>
          <div className="fiche__part">
            <p className="etiquette">
              {euros(c.ca12)} HT sur 12 mois, {Math.round(part * 100)} % de ton chiffre d'affaires
            </p>
            <BarrePoints valeur={part} lignes={3} anime={intro} libelle={`${Math.round(part * 100)} % du chiffre d'affaires`} />
          </div>
          <button className="bouton bouton--plein fiche__bouton" onClick={facturer}>
            <Plus strokeWidth={2.2} />
            Générer une facture
          </button>
        </section>
      </div>
      <Factures
        factures={factures?.filter((f) => f.clientId === c.id) ?? null}
        recherche={recherche}
        chercher={setRecherche}
        intro={intro}
        nouvelle={nouvelle}
        relancer={relancer}
        finaliser={finaliser}
        lienPaiement={lienPaiement}
      />
    </>
  )
}
