// L'API locale de Cockpit, servie par Next.js (app/api/[...chemin]/route.ts et app/payer/[numero]/route.ts).
// Avec PENNYLANE_API_TOKEN dans .env, elle lit ton compte Pennylane. Sans, elle lit le faux Pennylane de la démo
// (faux-pennylane.ts), par le même client : Cockpit est branché dès l'ouverture dans les deux cas.
// Le jeton ne quitte jamais le serveur : la page ne reçoit que des chiffres déjà calculés.

import { ErreurCrm, magasinCrm, type MagasinCrm } from './crm'
import { sourceDemo, type SourceDemo } from './demo'
import { FAUX_PENNYLANE, fauxPennylane } from './faux-pennylane'
import { pagePaiement } from './page-paiement'
import { sourcePennylane } from './pennylane'
import { calculerTableau } from './tableau'
import type { CodeTva, NouvelleFacture, Source, Tableau } from './types'

const TVA: CodeTva[] = ['FR_200', 'FR_100', 'FR_55', 'exempt']

class ErreurHttp extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

type Etat = {
  source: Source
  demo: SourceDemo
  objectif: number
  cache: { quand: number; tableau: Tableau } | null
  crm: MagasinCrm
}

// Une seule instance pour tout le serveur, même quand Next.js recharge un module en développement.
function etat(): Etat {
  const g = globalThis as typeof globalThis & { __cockpit?: Etat }
  if (!g.__cockpit) {
    const jeton = process.env.PENNYLANE_API_TOKEN?.trim()
    const demo = sourceDemo()
    // Le lien de paiement de la démo reste la page simulée (/payer/…) : le PDF de Pennylane n'existe pas ici.
    const source: Source = jeton
      ? sourcePennylane(jeton, process.env.PENNYLANE_API_URL || undefined)
      : { ...sourcePennylane('demo', FAUX_PENNYLANE, fauxPennylane(demo)), mode: 'demo', lienPaiement: demo.lienPaiement }
    g.__cockpit = {
      source,
      demo,
      objectif: Number(process.env.COCKPIT_OBJECTIF_ANNUEL) || (jeton ? 0 : 360_000),
      cache: null,
      crm: magasinCrm(jeton ? 'pennylane' : 'demo'),
    }
    console.info(
      jeton
        ? '  Cockpit : branché sur ton compte Pennylane'
        : '  Cockpit : démo, branché sur le faux Pennylane (ajoute PENNYLANE_API_TOKEN dans .env pour tes vraies données)',
    )
  }
  return g.__cockpit
}

async function lireJson(req: Request): Promise<unknown> {
  const corps = await req.text()
  if (corps.length > 20_000) throw new ErreurHttp(413, 'Requête trop lourde')
  try {
    return corps ? JSON.parse(corps) : {}
  } catch {
    throw new ErreurHttp(400, 'JSON illisible')
  }
}

function valider(b: unknown): NouvelleFacture {
  const f = (b ?? {}) as Record<string, unknown>
  const clientId = Number(f.clientId)
  const libelle = String(f.libelle ?? '').trim()
  const montantHT = Math.round(Number(f.montantHT) * 100) / 100
  const echeanceJours = Number(f.echeanceJours ?? 30)
  if (!Number.isInteger(clientId)) throw new ErreurHttp(422, 'Choisis un client')
  if (!libelle || libelle.length > 120) throw new ErreurHttp(422, 'Le libellé doit faire entre 1 et 120 caractères')
  if (!(montantHT > 0 && montantHT < 10_000_000)) throw new ErreurHttp(422, 'Le montant HT doit être positif')
  if (!TVA.includes(f.tva as CodeTva)) throw new ErreurHttp(422, 'Taux de TVA inconnu')
  if (!Number.isInteger(echeanceJours) || echeanceJours < 0 || echeanceJours > 120) throw new ErreurHttp(422, 'Échéance entre 0 et 120 jours')
  return { clientId, libelle, montantHT, tva: f.tva as CodeTva, echeanceJours }
}

const echapper = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })

const html = (contenu: string) =>
  new Response(contenu, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })

async function tableau(e: Etat, frais: boolean) {
  if (frais || !e.cache || Date.now() - e.cache.quand > 30_000) e.cache = { quand: Date.now(), tableau: await calculerTableau(e.source, e.objectif) }
  return e.cache.tableau
}

async function router(req: Request): Promise<Response> {
  const e = etat()
  const { source, demo, crm } = e
  const url = new URL(req.url)
  const chemin = url.pathname
  const methode = req.method

  if (methode === 'POST') {
    // Une page d'un autre site ne doit pas pouvoir créer de facture ni toucher au CRM à ta place.
    if (req.headers.get('sec-fetch-site') === 'cross-site') throw new ErreurHttp(403, 'Requête refusée')
    if (!String(req.headers.get('content-type')).startsWith('application/json')) throw new ErreurHttp(415, 'JSON attendu')
  }

  if (methode === 'GET' && chemin === '/api/tableau') {
    return json(200, await tableau(e, url.searchParams.has('frais') || source.mode === 'demo'))
  }

  if (methode === 'GET' && chemin === '/api/crm') {
    // Les clients Pennylane qui manquent au CRM y entrent avant la réponse : le CRM et Pennylane restent d'accord.
    const [clients, factures] = await Promise.all([source.clients(), source.factures()])
    return json(200, await crm.synchroniser(clients, factures))
  }

  if (methode === 'POST' && chemin === '/api/crm/entreprises') {
    return json(201, await crm.ajouter(await lireJson(req)))
  }

  const fiche = chemin.match(/^\/api\/crm\/entreprises\/([a-z0-9-]+)$/)
  if (methode === 'POST' && fiche) {
    return json(200, await crm.modifier(fiche[1], await lireJson(req)))
  }

  if (methode === 'POST' && chemin === '/api/factures') {
    const f = await source.creerBrouillon(valider(await lireJson(req)))
    e.cache = null
    return json(201, { id: f.id })
  }

  const action = chemin.match(/^\/api\/factures\/(\d+)\/(finaliser|envoyer|pdf|paiement)$/)
  if (action) {
    const id = Number(action[1])
    if (methode === 'POST' && action[2] === 'finaliser') {
      const f = await source.finaliser(id)
      e.cache = null
      return json(200, { id: f.id, numero: f.invoice_number })
    }
    if (methode === 'POST' && action[2] === 'envoyer') {
      await source.envoyer(id)
      const f = await source.facture(id)
      if (f.customer) await crm.factureEnvoyee(f.customer.id, f.invoice_number)
      return json(200, { ok: true })
    }
    if (methode === 'GET' && action[2] === 'pdf') {
      // Le lien du PDF expire vite chez Pennylane (30 min) : on le redemande à chaque clic.
      const f = await source.facture(id)
      if (!f.public_file_url) throw new ErreurHttp(404, "Cette facture n'a pas encore de PDF (brouillon ?)")
      return new Response(null, { status: 302, headers: { Location: new URL(f.public_file_url, url).href } })
    }
    if (methode === 'GET' && action[2] === 'paiement') {
      const lien = await source.lienPaiement(id)
      if (!lien) throw new ErreurHttp(404, "Pas de lien de paiement pour un brouillon : finalise d'abord la facture")
      return json(200, { url: lien, simule: source.mode === 'demo' })
    }
  }

  if (source.mode === 'demo' && methode === 'POST' && chemin === '/api/demo/reinitialiser') {
    demo.reinitialiser()
    await crm.reinitialiser()
    e.cache = null
    return json(200, { ok: true })
  }

  // La page de paiement simulée de la démo (/payer/F-2026-0053), et le clic « Payer » du client
  const paiement = chemin.match(/^\/payer\/([\w-]+)$/)
  if (source.mode === 'demo' && paiement) {
    const trouvee = demo.numero(decodeURIComponent(paiement[1]))
    if (!trouvee) throw new ErreurHttp(404, 'Facture introuvable')
    if (methode === 'POST') {
      const f = await demo.payer(trouvee.id)
      e.cache = null
      return json(200, { ok: true, numero: f.invoice_number })
    }
    if (methode === 'GET') {
      return html(pagePaiement(trouvee, (await demo.clients()).find((c) => c.id === trouvee.customer?.id)))
    }
  }

  const apercu = chemin.match(/^\/api\/demo\/factures\/(\d+)$/)
  if (source.mode === 'demo' && methode === 'GET' && apercu) {
    const f = await demo.facture(Number(apercu[1]))
    const client = (await demo.clients()).find((c) => c.id === f.customer?.id)
    const eur = (v: string) => Number(v).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
    return html(`<!doctype html><meta charset="utf-8"><title>${echapper(f.invoice_number || 'Brouillon')} · démo</title>
<style>body{font:15px/1.5 system-ui;max-width:640px;margin:48px auto;padding:0 20px;color:#f9fbff;background:#161616}h1{font-size:22px}
table{width:100%;border-collapse:collapse;margin:24px 0}td{padding:8px 0;border-bottom:1px solid #2a2a2a}td:last-child{text-align:right}
.demo{background:#33301a;border:1px solid #5a5228;color:#fde68a;padding:8px 12px;border-radius:8px;font-size:13px}</style>
<p class="demo">Facture fictive de la démo Cockpit : aucune donnée réelle.</p>
<h1>Facture ${echapper(f.invoice_number || '(brouillon)')}</h1>
<p><strong>Maison Orée</strong>, agence de communication, Lyon<br>Pour : ${echapper(client?.name ?? '')}, ${echapper(client?.billing_address?.city ?? '')}</p>
<p>Émise le ${echapper(f.date ?? '')} · à régler avant le ${echapper(f.deadline ?? '')}</p>
<table><tr><td>${echapper(f.label ?? '')}</td><td>${eur(f.currency_amount_before_tax)} HT</td></tr>
<tr><td>TVA</td><td>${eur(String(Number(f.amount) - Number(f.currency_amount_before_tax)))}</td></tr>
<tr><td><strong>Total TTC</strong></td><td><strong>${eur(f.amount)}</strong></td></tr></table>`)
  }

  throw new ErreurHttp(404, `Route inconnue : ${methode} ${chemin}`)
}

export async function traiter(req: Request): Promise<Response> {
  try {
    return await router(req)
  } catch (err) {
    const e = err as Error & { status?: number }
    const status = e instanceof ErreurHttp || e instanceof ErreurCrm ? e.status : (e.status ?? 502)
    if (status >= 500) console.error('[cockpit]', e.message)
    return json(status, { erreur: e.message })
  }
}
