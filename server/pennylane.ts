// Source « Pennylane » : la Company API v2, appelée uniquement depuis le serveur (le jeton ne part
// jamais vers le navigateur). Doc : https://pennylane.readme.io/reference
// Droits du jeton : factures clients (lecture et écriture), clients (lecture), transactions (lecture).

import type { NouvelleFacture, PLCustomer, PLCustomerInvoice, PLTransaction, Source } from './types'

const BASE = 'https://app.pennylane.com/api/external/v2'

export class PennylaneError extends Error {
  constructor(
    public status: number,
    public chemin: string,
    detail: string,
  ) {
    super(`Pennylane a répondu ${status} sur ${chemin} : ${detail}`)
  }
}

type Page<T> = { items: T[]; has_more: boolean; next_cursor: string | null }

/** `faire` remplace fetch pour la démo : le faux Pennylane (faux-pennylane.ts) répond alors sans passer par le réseau. */
export function sourcePennylane(jeton: string, base = BASE, faire: typeof fetch = fetch): Source {
  async function appel<T>(methode: 'GET' | 'POST' | 'PUT', chemin: string, opts: { query?: Record<string, string>; body?: unknown } = {}) {
    const url = new URL(base.replace(/\/+$/, '') + chemin)
    for (const [k, v] of Object.entries(opts.query ?? {})) url.searchParams.set(k, v)
    const res = await faire(url, {
      method: methode,
      headers: {
        Authorization: `Bearer ${jeton}`,
        Accept: 'application/json',
        ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    })
    if (res.status === 204) return undefined as T
    const texte = await res.text()
    if (!res.ok) throw new PennylaneError(res.status, chemin, texte.slice(0, 300))
    return (texte ? JSON.parse(texte) : null) as T
  }

  /** Toutes les pages d'une liste (pagination par curseur). */
  async function tout<T>(chemin: string, query: Record<string, string> = {}) {
    const items: T[] = []
    let cursor: string | null = null
    for (let garde = 0; garde < 100; garde++) {
      const page: Page<T> = await appel<Page<T>>('GET', chemin, { query: { ...query, limit: '100', ...(cursor ? { cursor } : {}) } })
      items.push(...page.items)
      if (!page.has_more || !page.next_cursor) break
      cursor = page.next_cursor
    }
    return items
  }

  const aujourdhui = () => new Date().toISOString().slice(0, 10)
  const dansJours = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)

  return {
    mode: 'pennylane',

    async entreprise() {
      const me = await appel<{ company: { name: string } }>('GET', '/me')
      return me.company.name
    },

    clients: () => tout<PLCustomer>('/customers'),

    factures: () => tout<PLCustomerInvoice>('/customer_invoices', { sort: '-id' }),

    async encaissements(depuis) {
      const filtre = JSON.stringify([{ field: 'date', operator: 'gteq', value: depuis }])
      const tx = await tout<PLTransaction>('/transactions', { filter: filtre })
      return tx.filter((t) => Number(t.amount) > 0)
    },

    creerBrouillon: (f: NouvelleFacture) =>
      appel<PLCustomerInvoice>('POST', '/customer_invoices', {
        body: {
          date: aujourdhui(),
          deadline: dansJours(f.echeanceJours),
          customer_id: f.clientId,
          draft: true,
          currency: 'EUR',
          language: 'fr_FR',
          pdf_invoice_subject: f.libelle,
          invoice_lines: [
            { label: f.libelle, quantity: 1, raw_currency_unit_price: f.montantHT.toFixed(2), unit: 'piece', vat_rate: f.tva },
          ],
        },
      }),

    finaliser: (id) => appel<PLCustomerInvoice>('PUT', `/customer_invoices/${id}/finalize`),

    /** 409 tant que Pennylane n'a pas fini de générer le PDF : on réessaie quelques fois. */
    async envoyer(id) {
      for (let essai = 0; ; essai++) {
        try {
          return await appel<void>('POST', `/customer_invoices/${id}/send_by_email`, { body: {} })
        } catch (e) {
          if (!(e instanceof PennylaneError) || e.status !== 409 || essai >= 5) throw e
          await new Promise((r) => setTimeout(r, 1500 * (essai + 1)))
        }
      }
    },

    facture: (id) => appel<PLCustomerInvoice>('GET', `/customer_invoices/${id}`),

    // Le lien du PDF expire au bout de 30 minutes : on le redemande à chaque fois.
    lienPaiement: async (id) => (await appel<PLCustomerInvoice>('GET', `/customer_invoices/${id}`)).public_file_url,
  }
}
