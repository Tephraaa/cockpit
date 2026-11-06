import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Check, Copy, ExternalLink, Link2, X } from 'lucide-react'
import type { CodeTva, NouvelleFacture as Saisie, Tableau } from '../../server/types'
import BarrePoints from '../components/BarrePoints'
import { api } from '../lib/api'
import { eurosCentimes } from '../lib/format'
import { toast } from '../lib/toasts'

const TVA: { code: CodeTva; libelle: string; taux: number }[] = [
  { code: 'FR_200', libelle: '20 %', taux: 0.2 },
  { code: 'FR_100', libelle: '10 %', taux: 0.1 },
  { code: 'FR_55', libelle: '5,5 %', taux: 0.055 },
  { code: 'exempt', libelle: '0 %', taux: 0 },
]
const ECHEANCES = [15, 30, 45]

type Etat = 'attente' | 'en-cours' | 'faite' | 'erreur'
export type Emise = { id: number; numero: string; client: string; ttc: number }

/** La barre d'une étape : elle se remplit pendant l'appel à l'API, puis passe au plein. */
function Progression({ etat }: { etat: Etat }) {
  const [valeur, setValeur] = useState(0)
  useEffect(() => {
    if (etat !== 'en-cours') return setValeur(etat === 'faite' ? 1 : 0)
    setValeur(0.05)
    const t = window.setInterval(() => setValeur((v) => Math.min(0.92, v + (0.95 - v) * 0.12)), 80)
    return () => window.clearInterval(t)
  }, [etat])
  return <BarrePoints valeur={valeur} lignes={2} ton={etat === 'erreur' ? 'rouge' : 'vert'} anime={false} libelle="Progression" />
}

/** `clientId` : le client déjà choisi (depuis sa fiche) ; sinon, le premier de la liste. */
type Props = { tableau: Tableau; clientId?: number; fermer: () => void; emise: (f: Emise) => void }

export default function NouvelleFacture({ tableau, clientId, fermer, emise }: Props) {
  const [f, setF] = useState<Saisie>({
    clientId: clientId ?? tableau.clients[0]?.id ?? 0,
    libelle: 'Accompagnement mensuel',
    montantHT: 1200,
    tva: 'FR_200',
    echeanceJours: 30,
  })
  const [etapes, setEtapes] = useState<Etat[] | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [numero, setNumero] = useState('')
  const [lien, setLien] = useState<{ url: string; simule: boolean } | null>(null)
  const idFacture = useRef<number | null>(null)
  const premierChamp = useRef<HTMLSelectElement>(null)
  const client = tableau.clients.find((c) => c.id === f.clientId)
  const ttc = f.montantHT * (1 + TVA.find((t) => t.code === f.tva)!.taux)
  const occupe = !!etapes && !erreur && etapes[2] !== 'faite'

  // Une fois la facture envoyée, fermer la fenêtre revient à « Terminer » : le tableau de bord se met à jour.
  const quitter = () => (etapes?.[2] === 'faite' ? emise({ id: idFacture.current!, numero, client: client?.nom ?? '', ttc }) : fermer())
  useEffect(() => premierChamp.current?.focus(), [])
  useEffect(() => {
    const echap = (e: KeyboardEvent) => e.key === 'Escape' && !occupe && quitter()
    window.addEventListener('keydown', echap)
    return () => window.removeEventListener('keydown', echap)
  })

  async function lancer(depuis = 0) {
    setErreur(null)
    const suivi: Etat[] = [0, 1, 2].map((i) => (i < depuis ? 'faite' : 'attente'))
    const marquer = (i: number, e: Etat) => {
      suivi[i] = e
      setEtapes([...suivi])
    }
    let i = depuis
    let num = numero
    try {
      if (i === 0) {
        marquer(0, 'en-cours')
        idFacture.current = (await api.creerBrouillon(f)).id
        marquer(0, 'faite')
        i = 1
      }
      if (i === 1) {
        marquer(1, 'en-cours')
        num = (await api.finaliser(idFacture.current!)).numero
        setNumero(num)
        marquer(1, 'faite')
        i = 2
      }
      marquer(2, 'en-cours')
      await api.envoyer(idFacture.current!)
      marquer(2, 'faite')
      setLien(await api.lienPaiement(idFacture.current!).catch(() => null))
    } catch (e) {
      marquer(i, 'erreur')
      setErreur((e as Error).message)
    }
  }

  const terminer = () => emise({ id: idFacture.current!, numero, client: client?.nom ?? '', ttc })
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(lien!.url)
      toast({ ton: 'info', titre: 'Lien copié', texte: 'Tu peux le coller dans un message à ton client.' })
    } catch {
      toast({ ton: 'erreur', titre: 'Copie impossible', texte: lien!.url })
    }
  }
  const ouvrir = () => {
    window.open(lien!.url, '_blank', 'noopener')
    terminer()
  }

  const ETAPES = [
    { titre: 'Brouillon créé dans Pennylane', detail: 'POST /customer_invoices' },
    { titre: numero ? `Facture ${numero} finalisée` : 'Facture finalisée', detail: 'PUT /customer_invoices/{id}/finalize' },
    { titre: client?.email ? `Envoyée à ${client.email}` : 'Envoyée par e-mail', detail: 'POST /customer_invoices/{id}/send_by_email' },
  ]

  return (
    <div className="voile" onMouseDown={(e) => e.target === e.currentTarget && !occupe && quitter()}>
      <div className="fenetre" role="dialog" aria-modal="true" aria-labelledby="titre-facture">
        <div className="fenetre__tete">
          <div style={{ flex: 1 }}>
            <h2 className="fenetre__titre" id="titre-facture">
              Nouvelle facture
            </h2>
            <p className="fenetre__sous-titre">
              Créée, numérotée et envoyée à ton client par l'API Pennylane{tableau.mode === 'demo' ? ' (ici, la démo : rien ne part vraiment)' : ''}.
            </p>
          </div>
          <button className="bouton-icone" onClick={quitter} disabled={occupe} aria-label="Fermer">
            <X />
          </button>
        </div>

        {!etapes ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              lancer()
            }}
          >
            <div className="fenetre__corps">
              <label className="champ">
                <span>Client</span>
                <select ref={premierChamp} value={f.clientId} onChange={(e) => setF({ ...f, clientId: Number(e.target.value) })}>
                  {tableau.clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom}
                    </option>
                  ))}
                </select>
              </label>
              <label className="champ">
                <span>Prestation</span>
                <input value={f.libelle} maxLength={120} required onChange={(e) => setF({ ...f, libelle: e.target.value })} />
              </label>
              <div className="champs-duo">
                <label className="champ">
                  <span>Montant HT (€)</span>
                  <input type="number" min={1} step={0.01} required value={f.montantHT || ''} onChange={(e) => setF({ ...f, montantHT: Number(e.target.value) })} />
                </label>
                <div className="champ">
                  <span>À payer sous</span>
                  <div className="segments" role="radiogroup" aria-label="Délai de paiement">
                    {ECHEANCES.map((j) => (
                      <button type="button" key={j} role="radio" aria-checked={f.echeanceJours === j} className={f.echeanceJours === j ? 'est-choisi' : ''} onClick={() => setF({ ...f, echeanceJours: j })}>
                        {j} j
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="champ">
                <span>TVA</span>
                <div className="segments" role="radiogroup" aria-label="Taux de TVA">
                  {TVA.map((t) => (
                    <button type="button" key={t.code} role="radio" aria-checked={f.tva === t.code} className={f.tva === t.code ? 'est-choisi' : ''} onClick={() => setF({ ...f, tva: t.code })}>
                      {t.libelle}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="fenetre__pied">
              <p className="total">
                <span className="chiffre">{eurosCentimes(ttc)}</span>
                <span>TTC</span>
              </p>
              <button className="bouton bouton--plein" type="submit" disabled={!f.montantHT || !f.libelle.trim() || !client}>
                Créer et envoyer
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="etapes" aria-live="polite">
              {ETAPES.map((e, i) => (
                <div key={i} className={`etape est-${etapes[i]}`}>
                  <span className="etape__icone">
                    {etapes[i] === 'faite' ? <Check strokeWidth={3} /> : etapes[i] === 'erreur' ? <AlertTriangle /> : <span>{i + 1}</span>}
                  </span>
                  <p className="etape__titre">{e.titre}</p>
                  <Progression etat={etapes[i]} />
                  <p className="etape__detail">{e.detail}</p>
                </div>
              ))}
              {erreur && <p className="erreur-texte">{erreur}</p>}
              {lien && (
                <div className="lien-paiement">
                  <p className="lien-paiement__titre">
                    <Link2 aria-hidden="true" />
                    Lien de paiement
                  </p>
                  <code className="lien-paiement__url">{lien.url.replace(/^https?:\/\//, '')}</code>
                  {!lien.simule && (
                    <p className="lien-paiement__note">
                      C'est le PDF de la facture : il porte le bouton « Payer maintenant » si le paiement en ligne est activé dans Pennylane.
                    </p>
                  )}
                  <div className="lien-paiement__actions">
                    <button className="bouton bouton--discret bouton--petit" onClick={copier}>
                      <Copy />
                      Copier
                    </button>
                    <button className="bouton bouton--plein bouton--petit" onClick={ouvrir}>
                      <ExternalLink />
                      {lien.simule ? 'Ouvrir le lien de paiement' : 'Ouvrir la facture'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="fenetre__pied">
              <p className="total">
                <span className="chiffre">{eurosCentimes(ttc)}</span>
                <span>TTC · {client?.nom}</span>
              </p>
              {erreur ? (
                <button className="bouton" onClick={() => lancer(etapes.indexOf('erreur'))}>
                  Réessayer
                </button>
              ) : etapes[2] === 'faite' ? (
                <button className="bouton" onClick={terminer}>
                  Terminer
                </button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
