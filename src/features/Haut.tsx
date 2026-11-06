import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Bell, Menu as IconeMenu, Plus, Search, Send } from 'lucide-react'
import type { LigneFacture } from '../../server/types'
import { usePopover } from '../components/usePopover'
import { euros, joursAvant } from '../lib/format'

type Props = {
  titre: string
  recherche: string
  chercher: (s: string) => void
  retards: LigneFacture[]
  relancer: (f: LigneFacture) => void
  relancerTout: (avancement: (fait: number) => void) => Promise<void>
  nouvelleFacture: () => void
  ouvrirMenu: () => void
  /** Sur une fiche client : revenir à la page d'avant. */
  retour?: () => void
}

export default function Haut({ titre, recherche, chercher, retards, relancer, relancerTout, nouvelleFacture, ouvrirMenu, retour }: Props) {
  const cloche = usePopover()
  const [envoi, setEnvoi] = useState<number | null>(null)
  const champ = useRef<HTMLInputElement>(null)

  // ⌘K ou Ctrl+K : aller droit à la recherche
  useEffect(() => {
    const raccourci = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        champ.current?.focus()
      }
    }
    window.addEventListener('keydown', raccourci)
    return () => window.removeEventListener('keydown', raccourci)
  }, [])

  return (
    <header className="haut">
      <button className="bouton-icone haut__menu" aria-label="Ouvrir le menu" onClick={ouvrirMenu}>
        <IconeMenu />
      </button>
      {retour && (
        <button className="bouton-icone haut__retour" aria-label="Retour" onClick={retour}>
          <ArrowLeft />
        </button>
      )}
      <h1 className="haut__titre">[{titre}]</h1>
        <div className="haut__droite">
          <label className="recherche">
            <Search strokeWidth={1.6} />
            <span className="sr-only">Rechercher une facture</span>
            <input ref={champ} value={recherche} onChange={(e) => chercher(e.target.value)} placeholder="Client, numéro…" />
            <kbd>⌘K</kbd>
          </label>
          <div className="deroulant" ref={cloche.ref}>
            <button className="bouton-icone" aria-label={`${retards.length} factures en retard`} aria-expanded={cloche.ouvert} onClick={cloche.basculer}>
              <Bell strokeWidth={1.5} />
              {retards.length > 0 && <span className="pastille-notif" />}
            </button>
            {cloche.ouvert && (
              <div className="menu menu--large" role="menu">
                <p className="menu__titre">{retards.length ? `${retards.length} factures en retard` : 'Aucune facture en retard'}</p>
                {retards.length > 1 && (
                  <button
                    className="bouton bouton--plein relancer-tout"
                    disabled={envoi !== null}
                    onClick={async () => {
                      setEnvoi(0)
                      await relancerTout(setEnvoi)
                      setEnvoi(null)
                    }}
                  >
                    <Send />
                    {envoi === null ? `Relancer les ${retards.length} factures en retard` : `Envoi en cours… ${envoi}/${retards.length}`}
                  </button>
              )}
              {retards.slice(0, 6).map((f) => (
                <div className="notif" key={f.id}>
                  <div>
                    <p className="notif__client">{f.client}</p>
                    <p className="notif__detail">
                      {f.numero} · {euros(f.restant)} · J+{Math.abs(joursAvant(f.echeance) ?? 0)}
                    </p>
                  </div>
                  <button className="bouton bouton--discret bouton--petit" onClick={() => relancer(f)}>
                    <Send />
                    Renvoyer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <span className="separateur" />
        <button className="bouton bouton--plein" onClick={nouvelleFacture}>
          <Plus strokeWidth={2.2} />
          <span>Générer une facture</span>
        </button>
      </div>
    </header>
  )
}
