import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Copy, Download, ExternalLink, FileText, ListFilter, MoreHorizontal, Search, Send, Stamp } from 'lucide-react'
import type { LigneFacture, StatutFacture } from '../../server/types'
import BarrePoints, { type Ton } from '../components/BarrePoints'
import { usePopover } from '../components/usePopover'
import { bruit } from '../lib/intro'
import { dateCourte, euros, eurosCentimes, initiales, joursAvant } from '../lib/format'

export const STATUTS: { id: StatutFacture; libelle: string }[] = [
  { id: 'a_venir', libelle: 'À venir' },
  { id: 'en_retard', libelle: 'En retard' },
  { id: 'partielle', libelle: 'Partielle' },
  { id: 'payee', libelle: 'Payée' },
  { id: 'brouillon', libelle: 'Brouillon' },
]
const LIBELLE = Object.fromEntries(STATUTS.map((s) => [s.id, s.libelle])) as Record<StatutFacture, string>

/** La jauge d'échéance : où en est la facture entre son émission et la date limite de paiement. */
function echeance(f: LigneFacture): { valeur: number; ton: Ton; texte: string; retard?: boolean } {
  const reste = joursAvant(f.echeance)
  switch (f.statut) {
    case 'payee':
      return { valeur: 1, ton: 'vert', texte: 'réglée' }
    case 'brouillon':
      return { valeur: 0, ton: 'gris', texte: 'à finaliser' }
    case 'partielle': {
      const part = f.montant ? 1 - f.restant / f.montant : 0
      return { valeur: part, ton: 'ambre', texte: `${Math.round(part * 100)} % réglé` }
    }
    case 'en_retard':
      return { valeur: 1, ton: 'rouge', texte: `J+${Math.abs(reste ?? 0)}`, retard: true }
    default: {
      const total = f.date && f.echeance ? Math.max(1, (new Date(f.echeance).getTime() - new Date(f.date).getTime()) / 86_400_000) : 30
      const ecoule = Math.min(1, Math.max(0.04, 1 - (reste ?? 0) / total))
      return { valeur: ecoule, ton: 'vert', texte: reste === 0 ? "aujourd'hui" : `dans ${reste} j` }
    }
  }
}

type Tri = { cle: 'date' | 'montant' | 'echeance'; sens: 1 | -1 }

/** Le menu « ••• » d'une ligne. Il s'affiche par-dessus la page (portail) : le tableau défile et le couperait. */
type LienPaiement = (f: LigneFacture, action: 'ouvrir' | 'copier') => void

function Actions({ f, relancer, finaliser, lienPaiement }: { f: LigneFacture; relancer: (f: LigneFacture) => void; finaliser: (f: LigneFacture) => void; lienPaiement: LienPaiement }) {
  const [place, setPlace] = useState<CSSProperties | null>(null)
  const bouton = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!place) return
    const fermer = (e: Event) => {
      if (e.type === 'keydown' && (e as KeyboardEvent).key !== 'Escape') return
      if (e.type === 'mousedown' && (menu.current?.contains(e.target as Node) || bouton.current?.contains(e.target as Node))) return
      setPlace(null)
    }
    document.addEventListener('mousedown', fermer)
    document.addEventListener('keydown', fermer)
    window.addEventListener('scroll', fermer, true)
    window.addEventListener('resize', fermer)
    return () => {
      document.removeEventListener('mousedown', fermer)
      document.removeEventListener('keydown', fermer)
      window.removeEventListener('scroll', fermer, true)
      window.removeEventListener('resize', fermer)
    }
  }, [place])

  const ouvrir = () => {
    if (place) return setPlace(null)
    const r = bouton.current!.getBoundingClientRect()
    const versLeHaut = r.bottom + 110 > window.innerHeight
    setPlace({
      position: 'fixed',
      right: window.innerWidth - r.right,
      ...(versLeHaut ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }),
    })
  }
  const agir = (action: () => void) => () => {
    setPlace(null)
    action()
  }

  return (
    <div className="actions">
      <button ref={bouton} className="bouton-icone" aria-label={`Actions pour ${f.numero || 'le brouillon'}`} aria-expanded={!!place} onClick={ouvrir}>
        <MoreHorizontal />
      </button>
      {place &&
        createPortal(
          <div ref={menu} className="menu menu--flottant" style={place} role="menu">
            {f.statut === 'brouillon' ? (
              <button className="menu__item" role="menuitem" onClick={agir(() => finaliser(f))}>
                <Stamp />
                Finaliser la facture
              </button>
            ) : (
              <a className="menu__item" role="menuitem" href={`/api/factures/${f.id}/pdf`} target="_blank" rel="noreferrer" onClick={() => setPlace(null)}>
                <FileText />
                Ouvrir le PDF
              </a>
            )}
            {['a_venir', 'en_retard', 'partielle'].includes(f.statut) && (
              <>
                <button className="menu__item" role="menuitem" onClick={agir(() => lienPaiement(f, 'ouvrir'))}>
                  <ExternalLink />
                  Ouvrir le lien de paiement
                </button>
                <button className="menu__item" role="menuitem" onClick={agir(() => lienPaiement(f, 'copier'))}>
                  <Copy />
                  Copier le lien de paiement
                </button>
                <button className="menu__item" role="menuitem" onClick={agir(() => relancer(f))}>
                  <Send />
                  Renvoyer par e-mail
                </button>
              </>
            )}
          </div>,
          document.body,
        )}
    </div>
  )
}

type Props = {
  factures: LigneFacture[] | null
  recherche: string
  chercher: (s: string) => void
  intro: boolean
  nouvelle: number | null
  relancer: (f: LigneFacture) => void
  finaliser: (f: LigneFacture) => void
  lienPaiement: LienPaiement
  /** Le nom du client ouvre sa fiche. */
  ouvrirClient?: (id: number) => void
}

export default function Factures({ factures, recherche, chercher, intro, nouvelle, relancer, finaliser, lienPaiement, ouvrirClient }: Props) {
  const [filtres, setFiltres] = useState<Set<StatutFacture>>(() => new Set(STATUTS.map((s) => s.id)))
  const [tri, setTri] = useState<Tri>({ cle: 'date', sens: -1 })
  const [limite, setLimite] = useState(30)
  const filtre = usePopover()

  const lignes = useMemo(() => {
    const q = recherche.trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
    const valeur = (f: LigneFacture) => (tri.cle === 'montant' ? f.montant : tri.cle === 'echeance' ? (f.echeance ?? '') : (f.date ?? ''))
    return (factures ?? [])
      .filter((f) => filtres.has(f.statut))
      .filter((f) => !q || `${f.client} ${f.numero}`.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').includes(q))
      .sort((a, b) => {
        const [x, y] = [valeur(a), valeur(b)]
        return (x < y ? -1 : x > y ? 1 : b.id - a.id) * tri.sens
      })
  }, [factures, filtres, recherche, tri])

  const exporter = () => {
    const entete = ['Numéro', 'Client', 'Statut', 'Montant TTC', 'Reste à payer', 'Émise le', 'Échéance']
    const corps = lignes.map((f) => [f.numero || 'brouillon', f.client, LIBELLE[f.statut], f.montant.toFixed(2).replace('.', ','), f.restant.toFixed(2).replace('.', ','), f.date ?? '', f.echeance ?? ''])
    // Une cellule qui commence par = + - ou @ serait lue comme une formule par le tableur : on la neutralise.
    const cellule = (c: string) => `"${(/^[=+\-@]/.test(c) ? `'${c}` : c).replace(/"/g, '""')}"`
    const csv = [entete, ...corps].map((l) => l.map((c) => cellule(String(c))).join(';')).join('\r\n')
    const lien = document.createElement('a')
    lien.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    lien.download = `factures-${new Date().toISOString().slice(0, 10)}.csv`
    lien.click()
    URL.revokeObjectURL(lien.href)
  }

  const entete = (cle: Tri['cle'], texte: string) => (
    <button className={tri.cle === cle && tri.sens === 1 ? 'est-inverse' : ''} onClick={() => setTri((t) => ({ cle, sens: t.cle === cle ? (-t.sens as 1 | -1) : -1 }))}>
      {texte}
      <ChevronDown style={{ opacity: tri.cle === cle ? 1 : 0.45 }} />
    </button>
  )

  return (
    <section className="carte factures" aria-label="Factures">
      <div className="carte__tete factures__tete">
        <h2 className="etiquette">Factures</h2>
        <label className="recherche">
          <Search strokeWidth={1.6} />
          <span className="sr-only">Rechercher une facture</span>
          <input value={recherche} onChange={(e) => chercher(e.target.value)} placeholder="Rechercher" />
        </label>
        <div className="deroulant" ref={filtre.ref}>
          <button className="bouton" aria-expanded={filtre.ouvert} onClick={filtre.basculer}>
            <ListFilter />
            Filtrer{filtres.size < STATUTS.length ? ` (${filtres.size})` : ''}
          </button>
          {filtre.ouvert && (
            <div className="menu" role="menu">
              <p className="menu__titre">Statut</p>
              {STATUTS.map((s) => {
                const coche = filtres.has(s.id)
                return (
                  <button
                    key={s.id}
                    className="menu__item"
                    role="menuitemcheckbox"
                    aria-checked={coche}
                    onClick={() =>
                      setFiltres((avant) => {
                        const suite = new Set(avant)
                        if (coche) suite.delete(s.id)
                        else suite.add(s.id)
                        return suite
                      })
                    }
                  >
                    <span className={`pastille-mini pastille-mini--${s.id}`} />
                    {s.libelle}
                    <span className={`case${coche ? ' est-cochee' : ''}`}>{coche && <Check strokeWidth={3} />}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <button className="bouton" onClick={exporter} disabled={!lignes.length}>
          <Download />
          Exporter
        </button>
      </div>

      <div className="factures__defilement">
        <table className="tableau">
          <colgroup>
            <col style={{ width: '23%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '26%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '4%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Client</th>
              <th>Numéro</th>
              <th>Statut</th>
              <th>{entete('echeance', 'Échéance')}</th>
              <th className="cellule-droite">{entete('montant', 'Montant TTC')}</th>
              <th className="cellule-droite">{entete('date', 'Émise')}</th>
              <th>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {lignes.slice(0, limite).map((f) => {
              const e = echeance(f)
              const estNouvelle = f.id === nouvelle
              return (
                <tr key={f.id} className={estNouvelle ? 'est-nouvelle' : ''}>
                  <td>
                    <span className="client">
                      <span className="avatar" style={{ '--teinte': Math.round(bruit(f.clientId ?? 0, 3) * 360) } as CSSProperties}>
                        {initiales(f.client)}
                      </span>
                      {ouvrirClient && f.clientId !== null ? (
                        <button className="lien-client" onClick={() => ouvrirClient(f.clientId!)}>
                          {f.client}
                        </button>
                      ) : (
                        <span>{f.client}</span>
                      )}
                    </span>
                  </td>
                  <td className={f.numero ? '' : 'numero--vide'}>{f.numero || 'brouillon'}</td>
                  <td>
                    <span className={`pastille pastille--${f.statut}`}>{LIBELLE[f.statut]}</span>
                  </td>
                  <td>
                    <span className="echeance">
                      <BarrePoints key={estNouvelle ? 'nouvelle' : 'ligne'} valeur={e.valeur} lignes={4} ton={e.ton} anime={intro || estNouvelle} libelle={e.texte} />
                      <span className={`echeance__texte${e.retard ? ' echeance__texte--retard' : ''}`}>{e.texte}</span>
                    </span>
                  </td>
                  <td className="cellule-droite" title={eurosCentimes(f.montant)}>
                    {euros(f.montant)}
                  </td>
                  <td className="cellule-droite">{dateCourte(f.date)}</td>
                  <td>
                    <Actions f={f} relancer={relancer} finaliser={finaliser} lienPaiement={lienPaiement} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {lignes.length > limite && (
          <button className="bouton bouton--discret bouton--petit plus" onClick={() => setLimite((l) => l + 30)}>
            Afficher {Math.min(30, lignes.length - limite)} factures de plus
          </button>
        )}
        {factures && !lignes.length && <p className="vide">Aucune facture ne correspond.</p>}
        {!factures && <p className="vide">Lecture des factures…</p>}
      </div>
    </section>
  )
}
