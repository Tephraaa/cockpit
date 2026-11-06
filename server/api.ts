// L'API locale de Cockpit, branchée dans le serveur de Vite (npm run dev et npm start).
// Avec PENNYLANE_API_TOKEN, elle lit ton compte Pennylane. Sans, elle lit le faux Pennylane de la démo
// (faux-pennylane.ts), par le même client : le tableau de bord est branché dès l'ouverture dans les deux cas.

import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { sourceDemo } from './demo.ts'
import { FAUX_PENNYLANE, fauxPennylane } from './faux-pennylane.ts'
import { pagePaiement } from './page-paiement.ts'
import { sourcePennylane } from './pennylane.ts'
import { calculerTableau } from './tableau.ts'
import type { CodeTva, NouvelleFacture, Source, Tableau } from './types.ts'

const TVA: CodeTva[] = ['FR_200', 'FR_100', 'FR_55', 'exempt']

class ErreurHttp extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

function lireJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let corps = ''
    req.on('data', (c) => {
      corps += c
      if (corps.length > 20_000) reject(new ErreurHttp(413, 'Requête trop lourde'))
    })
    req.on('end', () => {
      try {
        resolve(corps ? JSON.parse(corps) : {})
      } catch {
        reject(new ErreurHttp(400, 'JSON illisible'))
      }
    })
  })
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

export function apiCockpit(env: Record<string, string>): Plugin {
  const jeton = env.PENNYLANE_API_TOKEN?.trim()
  const demo = sourceDemo()
  // Le lien de paiement de la démo reste la page simulée (/payer/…) : le PDF de Pennylane n'existe pas ici.
  const source: Source = jeton
    ? sourcePennylane(jeton, env.PENNYLANE_API_URL || undefined)
    : { ...sourcePennylane('demo', FAUX_PENNYLANE, fauxPennylane(demo)), mode: 'demo', lienPaiement: demo.lienPaiement }
  const objectif = Number(env.COCKPIT_OBJECTIF_ANNUEL) || (jeton ? 0 : 360_000)
  let cache: { quand: number; tableau: Tableau } | null = null

  async function router(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url ?? '/', 'http://localhost')
    const chemin = url.pathname
    const json = (status: number, data: unknown) => {
      res.statusCode = status
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      res.end(JSON.stringify(data))
    }

    if (req.method === 'POST') {
      // Une page d'un autre site ne doit pas pouvoir créer de facture à ta place.
      if (req.headers['sec-fetch-site'] === 'cross-site') throw new ErreurHttp(403, 'Requête refusée')
      if (!String(req.headers['content-type']).startsWith('application/json')) throw new ErreurHttp(415, 'JSON attendu')
    }

    if (req.method === 'GET' && chemin === '/api/tableau') {
      const frais = url.searchParams.has('frais') || source.mode === 'demo'
      if (frais || !cache || Date.now() - cache.quand > 30_000) cache = { quand: Date.now(), tableau: await calculerTableau(source, objectif) }
      return json(200, cache.tableau)
    }

    if (req.method === 'POST' && chemin === '/api/factures') {
      const f = await source.creerBrouillon(valider(await lireJson(req)))
      cache = null
      return json(201, { id: f.id })
    }

    const action = chemin.match(/^\/api\/factures\/(\d+)\/(finaliser|envoyer|pdf|paiement)$/)
    if (action) {
      const id = Number(action[1])
      if (req.method === 'POST' && action[2] === 'finaliser') {
        const f = await source.finaliser(id)
        cache = null
        return json(200, { id: f.id, numero: f.invoice_number })
      }
      if (req.method === 'POST' && action[2] === 'envoyer') {
        await source.envoyer(id)
        return json(200, { ok: true })
      }
      if (req.method === 'GET' && action[2] === 'pdf') {
        // Le lien du PDF expire vite chez Pennylane (30 min) : on le redemande à chaque clic.
        const f = await source.facture(id)
        if (!f.public_file_url) throw new ErreurHttp(404, "Cette facture n'a pas encore de PDF (brouillon ?)")
        res.statusCode = 302
        res.setHeader('Location', f.public_file_url)
        return res.end()
      }
      if (req.method === 'GET' && action[2] === 'paiement') {
        const url = await source.lienPaiement(id)
        if (!url) throw new ErreurHttp(404, "Pas de lien de paiement pour un brouillon : finalise d'abord la facture")
        return json(200, { url, simule: source.mode === 'demo' })
      }
    }

    if (source.mode === 'demo' && req.method === 'POST' && chemin === '/api/demo/reinitialiser') {
      demo.reinitialiser()
      return json(200, { ok: true })
    }

    // La page de paiement simulée de la démo (/payer/F-2026-0053), et le clic « Payer » du client
    const paiement = chemin.match(/^\/payer\/([\w-]+)$/)
    if (source.mode === 'demo' && paiement) {
      const trouvee = demo.numero(decodeURIComponent(paiement[1]))
      if (!trouvee) throw new ErreurHttp(404, 'Facture introuvable')
      if (req.method === 'POST') {
        const f = await demo.payer(trouvee.id)
        return json(200, { ok: true, numero: f.invoice_number })
      }
      if (req.method === 'GET') {
        const f = trouvee
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        return res.end(pagePaiement(f, (await demo.clients()).find((c) => c.id === f.customer?.id)))
      }
    }

    const apercu = chemin.match(/^\/api\/demo\/factures\/(\d+)$/)
    if (source.mode === 'demo' && req.method === 'GET' && apercu) {
      const f = await demo.facture(Number(apercu[1]))
      const client = (await demo.clients()).find((c) => c.id === f.customer?.id)
      const eur = (v: string) => Number(v).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      return res.end(`<!doctype html><meta charset="utf-8"><title>${echapper(f.invoice_number || 'Brouillon')} · démo</title>
<style>body{font:15px/1.5 system-ui;max-width:640px;margin:48px auto;padding:0 20px;color:#1f2421}h1{font-size:22px}
table{width:100%;border-collapse:collapse;margin:24px 0}td{padding:8px 0;border-bottom:1px solid #dce2de}td:last-child{text-align:right}
.demo{background:#fff6dc;border:1px solid #e0b36a;padding:8px 12px;border-radius:8px;font-size:13px}</style>
<p class="demo">Facture fictive de la démo Cockpit : aucune donnée réelle.</p>
<h1>Facture ${echapper(f.invoice_number || '(brouillon)')}</h1>
<p><strong>Maison Orée</strong>, agence de communication, Lyon<br>Pour : ${echapper(client?.name ?? '')}, ${echapper(client?.billing_address?.city ?? '')}</p>
<p>Émise le ${echapper(f.date ?? '')} · à régler avant le ${echapper(f.deadline ?? '')}</p>
<table><tr><td>${echapper(f.label ?? '')}</td><td>${eur(f.currency_amount_before_tax)} HT</td></tr>
<tr><td>TVA</td><td>${eur(String(Number(f.amount) - Number(f.currency_amount_before_tax)))}</td></tr>
<tr><td><strong>Total TTC</strong></td><td><strong>${eur(f.amount)}</strong></td></tr></table>`)
    }

    throw new ErreurHttp(404, `Route inconnue : ${req.method} ${chemin}`)
  }

  const middleware = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url?.startsWith('/api/') && !req.url?.startsWith('/payer/')) return next()
    router(req, res).catch((e: Error & { status?: number }) => {
      const status = e instanceof ErreurHttp ? e.status : (e.status ?? 502)
      if (status >= 500) console.error('[cockpit]', e.message)
      res.statusCode = status
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ erreur: e.message }))
    })
  }

  return {
    name: 'cockpit-api',
    configureServer(server) {
      server.middlewares.use(middleware)
      server.config.logger.info(
        jeton
          ? '  Cockpit : branché sur ton compte Pennylane'
          : '  Cockpit : démo, branché sur le faux Pennylane (ajoute PENNYLANE_API_TOKEN dans .env pour tes vraies données)',
      )
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}
