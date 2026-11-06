import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { LigneFacture, Tableau } from '../server/types'
import Toasts from './components/Toasts'
import Agenda from './features/Agenda'
import Clients from './features/Clients'
import Courbe from './features/Courbe'
import Factures from './features/Factures'
import FicheClient from './features/FicheClient'
import Haut from './features/Haut'
import Kpis from './features/Kpis'
import Leads from './features/Leads'
import MenuLateral, { LIENS, type PageId } from './features/MenuLateral'
import MissionControl from './features/MissionControl'
import NouvelleFacture, { type Emise } from './features/NouvelleFacture'
import Regions from './features/Regions'
import Taches from './features/Taches'
import { api } from './lib/api'
import { euros, joursAvant } from './lib/format'
import { useIntro } from './lib/intro'
import { useTheme } from './lib/theme'
import { toast } from './lib/toasts'

export default function App() {
  const [tableau, setTableau] = useState<Tableau | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [page, setPage] = useState<PageId>('accueil')
  /** La fiche client ouverte par-dessus la page (un clic sur un nom de client). */
  const [fiche, setFiche] = useState<number | null>(null)
  const [recherche, setRecherche] = useState('')
  const [fenetre, setFenetre] = useState(false)
  const [clientFacture, setClientFacture] = useState<number | null>(null)
  const [nouvelle, setNouvelle] = useState<number | null>(null)
  const [menuOuvert, setMenuOuvert] = useState(false)
  const [theme, setTheme] = useTheme()
  const intro = useIntro(!!tableau, fiche === null ? page : `client-${fiche}`)

  const precedent = useRef<Tableau | null>(null)
  const flasher = useCallback((id: number) => {
    setNouvelle(id)
    window.setTimeout(() => setNouvelle((n) => (n === id ? null : n)), 2200)
  }, [])

  const charger = useCallback(
    async (frais = false) => {
      try {
        const t = await api.tableau(frais)
        // Une facture qui vient de passer à « payée » : on le dit, et sa ligne s'allume.
        const avant = new Map((precedent.current?.factures ?? []).map((f) => [f.id, f.statut]))
        const payees = precedent.current ? t.factures.filter((f) => f.statut === 'payee' && avant.has(f.id) && avant.get(f.id) !== 'payee') : []
        precedent.current = t
        setTableau(t)
        setErreur(null)
        payees.forEach((f) => toast({ ton: 'succes', titre: 'Paiement reçu', texte: `${euros(f.montant)} de ${f.client}, facture ${f.numero}.` }))
        if (payees[0]) flasher(payees[0].id)
        return t
      } catch (e) {
        setErreur((e as Error).message)
        return null
      }
    },
    [flasher],
  )

  // Quand on revient sur l'onglet (après avoir payé dans un autre, par exemple), les chiffres se mettent à jour.
  useEffect(() => {
    let dernier = 0
    const rafraichir = () => {
      if (document.visibilityState !== 'visible' || Date.now() - dernier < 1500) return
      dernier = Date.now()
      charger()
    }
    window.addEventListener('focus', rafraichir)
    document.addEventListener('visibilitychange', rafraichir)
    return () => {
      window.removeEventListener('focus', rafraichir)
      document.removeEventListener('visibilitychange', rafraichir)
    }
  }, [charger])

  useEffect(() => {
    charger().then((t) => t?.avertissements.forEach((a) => toast({ ton: 'erreur', titre: 'Donnée manquante', texte: a })))
  }, [charger])

  const client = fiche === null ? null : (tableau?.clients.find((c) => c.id === fiche) ?? null)
  const libelle = client ? client.nom : LIENS.find((l) => l.id === page)!.libelle
  const ouvrirClient = (id: number) => {
    setFiche(id)
    setMenuOuvert(false)
  }
  const facturer = (clientId: number | null) => {
    if (!tableau) return
    setClientFacture(clientId)
    setFenetre(true)
  }
  useEffect(() => {
    document.title = `${libelle} · Cockpit`
  }, [libelle])

  const retards = useMemo(
    () =>
      (tableau?.factures ?? [])
        .filter((f) => f.statut === 'en_retard' || (f.statut === 'partielle' && (joursAvant(f.echeance) ?? 0) < 0))
        .sort((a, b) => (a.echeance ?? '').localeCompare(b.echeance ?? '')),
    [tableau],
  )

  const relancer = async (f: LigneFacture) => {
    try {
      await api.envoyer(f.id)
      toast({ ton: 'succes', titre: `Facture ${f.numero} renvoyée`, texte: `${f.client} la reçoit à nouveau par e-mail.` })
    } catch (e) {
      toast({ ton: 'erreur', titre: 'Envoi impossible', texte: (e as Error).message })
    }
  }

  const finaliser = async (f: LigneFacture) => {
    try {
      const { numero } = await api.finaliser(f.id)
      await charger(true)
      toast({ ton: 'succes', titre: `Facture ${numero} finalisée`, texte: `${f.client} : elle est prête à être envoyée.` })
    } catch (e) {
      toast({ ton: 'erreur', titre: 'Finalisation impossible', texte: (e as Error).message })
    }
  }

  const emise = async (e: Emise) => {
    setFenetre(false)
    // La nouvelle facture s'allume dans un tableau de factures : celui de la fiche client, sinon celui de Pennylane.
    if (fiche === null) setPage('pennylane')
    await charger(true)
    flasher(e.id)
    toast({ ton: 'succes', titre: `Facture ${e.numero} envoyée`, texte: `${euros(e.ttc)} TTC à ${e.client}, avec son lien de paiement.` })
  }

  const lienPaiement = async (f: LigneFacture, action: 'ouvrir' | 'copier') => {
    try {
      const { url } = await api.lienPaiement(f.id)
      if (action === 'ouvrir') window.open(url, '_blank', 'noopener')
      else {
        await navigator.clipboard.writeText(url)
        toast({ ton: 'info', titre: 'Lien de paiement copié', texte: `Facture ${f.numero}, ${f.client}.` })
      }
    } catch (e) {
      toast({ ton: 'erreur', titre: 'Lien indisponible', texte: (e as Error).message })
    }
  }

  const relancerTout = async (avancement: (fait: number) => void) => {
    let envoyees = 0
    for (const f of retards) {
      try {
        await api.envoyer(f.id)
        envoyees++
      } catch {
        // on continue avec les suivantes ; le bilan dit combien sont parties
      }
      avancement(envoyees)
    }
    toast({
      ton: envoyees === retards.length ? 'succes' : 'erreur',
      titre: `${envoyees} relance${envoyees > 1 ? 's' : ''} envoyée${envoyees > 1 ? 's' : ''}`,
      texte: envoyees === retards.length ? 'Chaque client reçoit sa facture et son lien de paiement.' : `${retards.length - envoyees} envoi(s) en échec : réessaie plus tard.`,
    })
  }

  const reinitialiser = async () => {
    setPage('accueil')
    setFiche(null)
    await api.reinitialiserDemo()
    await charger(true)
    toast({ ton: 'info', titre: 'Démo réinitialisée', texte: 'Maison Orée repart de ses factures de départ.' })
  }

  return (
    <div className={`coque${menuOuvert ? ' menu-ouvert' : ''}`}>
      <MenuLateral
        page={page}
        allerA={(p) => {
          setPage(p)
          setFiche(null)
          setMenuOuvert(false)
        }}
        tableau={tableau}
        intro={intro}
        theme={theme}
        changerTheme={setTheme}
        actualiser={() => charger(true)}
        reinitialiser={reinitialiser}
      />
      <div className="rideau" onClick={() => setMenuOuvert(false)} aria-hidden="true" />
      <div className="espace">
        <Haut
          titre={libelle}
          recherche={recherche}
          chercher={(s) => {
            setRecherche(s)
            if (s) {
              setFiche(null)
              setPage('pennylane')
            }
          }}
          retards={retards}
          relancer={relancer}
          relancerTout={relancerTout}
          nouvelleFacture={() => facturer(fiche)}
          ouvrirMenu={() => setMenuOuvert(true)}
          retour={fiche !== null ? () => setFiche(null) : undefined}
        />
        <main className="contenu">
          {erreur && !tableau ? (
            <section className="carte bientot" style={{ gridRow: '1 / -1' }}>
              <p className="chiffre">Pennylane ne répond pas</p>
              <p>{erreur}</p>
              <button className="bouton" onClick={() => charger(true)}>
                Réessayer
              </button>
            </section>
          ) : client ? (
            <FicheClient
              key={client.id}
              client={client}
              caAnnuel={tableau?.series.find((s) => s.periode === '12m')?.total ?? 0}
              factures={tableau?.factures ?? null}
              intro={intro}
              nouvelle={nouvelle}
              relancer={relancer}
              finaliser={finaliser}
              lienPaiement={lienPaiement}
              facturer={() => facturer(client.id)}
            />
          ) : page === 'accueil' || page === 'pennylane' ? (
            <>
              <Kpis kpis={tableau?.kpis ?? null} />
              <div className="graphiques">
                <Courbe series={tableau?.series ?? null} intro={intro} />
                <Regions regions={tableau?.regions ?? null} clientsActifs={tableau?.clientsActifs ?? 0} nouveaux={tableau?.nouveauxClients ?? 0} intro={intro} />
              </div>
              {page === 'accueil' ? (
                <Leads intro={intro} />
              ) : (
                <Factures
                  factures={tableau?.factures ?? null}
                  recherche={recherche}
                  chercher={setRecherche}
                  intro={intro}
                  nouvelle={nouvelle}
                  relancer={relancer}
                  finaliser={finaliser}
                  lienPaiement={lienPaiement}
                  ouvrirClient={ouvrirClient}
                />
              )}
            </>
          ) : page === 'mission' ? (
            <MissionControl tableau={tableau} ouvrirPennylane={() => setPage('pennylane')} intro={intro} />
          ) : page === 'clients' ? (
            <Clients clients={tableau?.clients ?? null} ouvrir={ouvrirClient} intro={intro} />
          ) : page === 'taches' ? (
            <Taches />
          ) : page === 'agenda' ? (
            <Agenda />
          ) : (
            <section className="carte bientot" style={{ gridRow: '1 / -1' }} key={page}>
              <p className="chiffre">[{libelle}]</p>
              <p>Cette page n'est pas encore construite. Le code de Cockpit est ouvert : demande-la à ton agent IA, il saura où la brancher.</p>
            </section>
          )}
        </main>
      </div>
      {fenetre && tableau && <NouvelleFacture tableau={tableau} clientId={clientFacture ?? undefined} fermer={() => setFenetre(false)} emise={emise} />}
      <Toasts />
    </div>
  )
}
