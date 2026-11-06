// Le faux Pennylane de la démo : il répond comme la Company API v2 (mêmes chemins, mêmes champs, listes
// paginées { items, has_more, next_cursor }), à partir des données de Maison Orée gardées en mémoire par demo.ts.
// Cockpit le lit avec le même client que le vrai Pennylane (pennylane.ts) : c'est la logique du premier dashboard,
// qui parlait déjà à un faux Pennylane en local. Rien ne passe par le réseau : les appels restent dans le serveur.

import type { SourceDemo } from './demo.ts'
import type { CodeTva, NouvelleFacture } from './types.ts'

/** L'adresse que le client croit appeler. Elle n'est jamais demandée au réseau. */
export const FAUX_PENNYLANE = 'http://faux-pennylane.local/api/external/v2'

const TVA: CodeTva[] = ['FR_200', 'FR_100', 'FR_55', 'exempt']

const erreur = (status: number, message: string) => Object.assign(new Error(message), { status })

/** Le corps d'un POST /customer_invoices, tel que l'envoie pennylane.ts, ramené à une facture de Cockpit. */
function versNouvelle(corps: Record<string, unknown>): NouvelleFacture {
  const ligne = ((corps.invoice_lines as Record<string, unknown>[] | undefined) ?? [])[0]
  if (!ligne) throw erreur(422, 'invoice_lines est vide')
  const tva = ligne.vat_rate as CodeTva
  if (!TVA.includes(tva)) throw erreur(422, `vat_rate inconnu : ${String(ligne.vat_rate)}`)
  const jours = (iso: unknown) => new Date(`${String(iso)}T12:00:00`).getTime()
  return {
    clientId: Number(corps.customer_id),
    libelle: String(ligne.label ?? ''),
    montantHT: Number(ligne.raw_currency_unit_price) * Number(ligne.quantity ?? 1),
    tva,
    echeanceJours: Math.max(0, Math.round((jours(corps.deadline) - jours(corps.date)) / 86_400_000)) || 30,
  }
}

/** Le filtre `[{ field: "date", operator: "gteq", value }]` de GET /transactions. */
function depuisFiltre(url: URL) {
  try {
    const filtre = JSON.parse(url.searchParams.get('filter') ?? '[]') as { field: string; operator: string; value: string }[]
    return filtre.find((f) => f.field === 'date' && f.operator === 'gteq')?.value ?? '0000-01-01'
  } catch {
    throw erreur(400, 'filter illisible')
  }
}

export function fauxPennylane(demo: SourceDemo): typeof fetch {
  const page = <T>(items: T[]) => ({ items, has_more: false, next_cursor: null })
  const reponse = (status: number, data?: unknown) =>
    new Response(data === undefined ? null : JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

  return async (entree, init) => {
    const url = new URL(entree instanceof Request ? entree.url : String(entree))
    const chemin = url.pathname.replace(/^\/api\/external\/v2/, '')
    const methode = (init?.method ?? 'GET').toUpperCase()
    const corps = typeof init?.body === 'string' && init.body ? (JSON.parse(init.body) as Record<string, unknown>) : {}
    try {
      if (methode === 'GET' && chemin === '/me') return reponse(200, { company: { name: await demo.entreprise() } })
      if (methode === 'GET' && chemin === '/customers') return reponse(200, page(await demo.clients()))
      if (methode === 'GET' && chemin === '/customer_invoices') return reponse(200, page([...(await demo.factures())].sort((a, b) => b.id - a.id)))
      if (methode === 'POST' && chemin === '/customer_invoices') return reponse(201, await demo.creerBrouillon(versNouvelle(corps)))
      if (methode === 'GET' && chemin === '/transactions') return reponse(200, page(await demo.encaissements(depuisFiltre(url))))

      const facture = chemin.match(/^\/customer_invoices\/(\d+)(\/finalize|\/send_by_email)?$/)
      if (facture) {
        const id = Number(facture[1])
        if (methode === 'GET' && !facture[2]) return reponse(200, await demo.facture(id))
        if (methode === 'PUT' && facture[2] === '/finalize') return reponse(200, await demo.finaliser(id))
        if (methode === 'POST' && facture[2] === '/send_by_email') return (await demo.envoyer(id), reponse(204))
      }
      return reponse(404, { error: `Route inconnue du faux Pennylane : ${methode} ${chemin}` })
    } catch (e) {
      return reponse((e as { status?: number }).status ?? 500, { error: (e as Error).message })
    }
  }
}
