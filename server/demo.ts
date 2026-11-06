// Source « démo » : Maison Orée, une agence de communication fictive installée à Lyon (données dans
// demo-donnees.ts). Mêmes formes de données que l'API Pennylane, gardées en mémoire. La démo simule aussi
// ce que l'API ne fait pas elle-même : la page où le client paie la facture.

import { CLIENTS, ENCAISSEMENTS, FACTURES } from './demo-donnees'
import type { CodeTva, NouvelleFacture, PLCustomer, PLCustomerInvoice, PLTransaction, Source } from './types'

const TAUX: Record<CodeTva, number> = { FR_200: 0.2, FR_100: 0.1, FR_55: 0.055, exempt: 0 }

/** Date locale AAAA-MM-JJ, `n` jours avant aujourd'hui (négatif : dans le futur). */
const jour = (n: number) => {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}
const plus = (iso: string, n: number) => {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
const euros = (n: number) => n.toFixed(2)
const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms))

type Etat = { clients: PLCustomer[]; factures: PLCustomerInvoice[]; transactions: PLTransaction[]; compteurs: Map<string, number> }

function fabriquer(): Etat {
  const clients: PLCustomer[] = CLIENTS.map((c, i) => ({
    id: 1001 + i,
    name: c.nom,
    emails: [c.email],
    billing_address: { address: c.adresse, postal_code: c.cp, city: c.ville, country_alpha2: 'FR' },
  }))
  const aujourdhui = jour(0)
  // Numérotation continue par année civile, dans l'ordre des dates : F-2026-0001, F-2026-0002…
  const compteurs = new Map<string, number>()
  const factures: PLCustomerInvoice[] = FACTURES.map((f, i) => {
    const date = jour(f.emise)
    const deadline = plus(date, f.delai)
    const ttc = f.ht * 1.2
    let numero = ''
    if (!f.brouillon) {
      const annee = date.slice(0, 4)
      compteurs.set(annee, (compteurs.get(annee) ?? 0) + 1)
      numero = `F-${annee}-${String(compteurs.get(annee)).padStart(4, '0')}`
    }
    const payee = f.payee !== null && f.payee >= 0
    const id = 4001 + i
    return {
      id,
      label: f.libelle,
      invoice_number: numero,
      amount: euros(ttc),
      currency_amount_before_tax: euros(f.ht),
      date,
      deadline,
      paid: payee,
      status: f.brouillon ? 'draft' : payee ? 'paid' : deadline < aujourdhui ? 'late' : 'upcoming',
      draft: f.brouillon,
      remaining_amount_with_tax: euros(payee ? 0 : ttc),
      public_file_url: f.brouillon ? null : `/api/demo/factures/${id}`,
      customer: { id: clients[f.client].id, url: '' },
    }
  })
  const transactions: PLTransaction[] = ENCAISSEMENTS.map((e, i) => ({
    id: 9001 + i,
    date: jour(e.jours),
    amount: euros(e.montant),
    customer: { id: clients[e.client].id, url: '' },
  }))
  return { clients, factures: factures.reverse(), transactions, compteurs }
}

export type SourceDemo = Source & {
  reinitialiser(): void
  payer(id: number): Promise<PLCustomerInvoice>
  numero(numero: string): PLCustomerInvoice | null
}

export function sourceDemo(): SourceDemo {
  let etat = fabriquer()
  const trouver = (id: number) => {
    const f = etat.factures.find((x) => x.id === id)
    if (!f) throw Object.assign(new Error(`Facture ${id} introuvable dans la démo`), { status: 404 })
    return f
  }

  return {
    mode: 'demo',
    reinitialiser: () => void (etat = fabriquer()),
    entreprise: async () => 'Maison Orée',
    clients: async () => etat.clients,
    factures: async () => etat.factures,
    encaissements: async (depuis) => etat.transactions.filter((t) => t.date >= depuis),

    // Les délais imitent le temps de réponse de l'API, pour que les étapes se voient à l'écran.
    async creerBrouillon(f: NouvelleFacture) {
      await attendre(550)
      const client = etat.clients.find((c) => c.id === f.clientId)
      if (!client) throw Object.assign(new Error('Client inconnu'), { status: 422 })
      const ttc = f.montantHT * (1 + TAUX[f.tva])
      const facture: PLCustomerInvoice = {
        id: Math.max(...etat.factures.map((x) => x.id)) + 1,
        label: f.libelle,
        invoice_number: '',
        amount: euros(ttc),
        currency_amount_before_tax: euros(f.montantHT),
        date: jour(0),
        deadline: plus(jour(0), f.echeanceJours),
        paid: false,
        status: 'draft',
        draft: true,
        remaining_amount_with_tax: euros(ttc),
        public_file_url: null,
        customer: { id: client.id, url: '' },
      }
      etat.factures.unshift(facture)
      return facture
    },

    async finaliser(id) {
      await attendre(700)
      const f = trouver(id)
      if (f.draft) {
        const annee = (f.date ?? jour(0)).slice(0, 4)
        etat.compteurs.set(annee, (etat.compteurs.get(annee) ?? 0) + 1)
        f.invoice_number = `F-${annee}-${String(etat.compteurs.get(annee)).padStart(4, '0')}`
        f.draft = false
        f.status = 'upcoming'
        f.public_file_url = `/api/demo/factures/${id}`
      }
      return f
    },

    async envoyer(id) {
      await attendre(850)
      if (trouver(id).draft) throw Object.assign(new Error('Un brouillon ne peut pas être envoyé : finalise-le d’abord'), { status: 409 })
    },

    facture: async (id) => trouver(id),

    async lienPaiement(id) {
      const f = trouver(id)
      return f.draft ? null : `/payer/${f.invoice_number}`
    },

    numero: (numero: string) => etat.factures.find((x) => x.invoice_number === numero) ?? null,

    /** Ce que ferait le client sur la page de paiement : la facture passe à « payée », l'argent arrive sur le compte. */
    async payer(id) {
      await attendre(900)
      const f = trouver(id)
      if (f.draft) throw Object.assign(new Error('Ce brouillon ne peut pas encore être payé'), { status: 409 })
      if (!f.paid) {
        etat.transactions.push({ id: 9001 + etat.transactions.length, date: jour(0), amount: f.remaining_amount_with_tax ?? f.amount, customer: f.customer })
        f.paid = true
        f.status = 'paid'
        f.remaining_amount_with_tax = euros(0)
      }
      return f
    },
  }
}
