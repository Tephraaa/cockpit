// Le CRM de Cockpit : tes entreprises (prospects et clients), leur étape, ce qu'elles peuvent te rapporter et tes
// chances de signer. Pennylane ne connaît pas les prospects : le CRM vit donc ici, dans un fichier JSON sur ton
// ordinateur (.cockpit/crm.json, ou .cockpit/crm-demo.json pour la démo), et ce que tu ajoutes reste après un rechargement.
// Chaque client Pennylane devient une entreprise du CRM, reliée par `pennylaneId` : sa fiche montre ses factures.

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { crmDemo } from './crm-demo'
import type { PLCustomer, PLCustomerInvoice } from './types'

import { ETAPES, SEGMENTS, type Contact, type Crm, type Entreprise } from './crm-types'

export * from './crm-types'

class ErreurCrm extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

const aujourdhui = () => new Date().toLocaleDateString('sv-SE')

export function slug(texte: string) {
  return (
    texte
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'entreprise'
  )
}

function texte(v: unknown, nom: string, max: number, vide = true): string {
  const s = String(v ?? '').trim()
  if (!vide && !s) throw new ErreurCrm(422, `${nom} est obligatoire`)
  if (s.length > max) throw new ErreurCrm(422, `${nom} : ${max} caractères au plus`)
  return s
}

function entier(v: unknown, nom: string, min: number, max: number): number {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n) || n < min || n > max) throw new ErreurCrm(422, `${nom} doit être entre ${min} et ${max}`)
  return n
}

function choix<T extends string>(v: unknown, liste: readonly T[], nom: string): T {
  if (!liste.includes(v as T)) throw new ErreurCrm(422, `${nom} inconnu : ${String(v)}`)
  return v as T
}

function contactDe(v: unknown): Contact | null {
  if (!v || typeof v !== 'object') return null
  const c = v as Record<string, unknown>
  const contact = {
    nom: texte(c.nom, 'Le nom du contact', 80),
    email: texte(c.email, "L'e-mail du contact", 120),
    telephone: texte(c.telephone, 'Le téléphone du contact', 30),
  }
  if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) throw new ErreurCrm(422, "L'e-mail du contact n'est pas valide")
  return contact.nom || contact.email || contact.telephone ? contact : null
}

function etiquettesDe(v: unknown): string[] {
  if (!Array.isArray(v)) throw new ErreurCrm(422, 'Les étiquettes doivent être une liste')
  return [...new Set(v.map((e) => texte(e, 'Une étiquette', 24)).filter(Boolean))].slice(0, 6)
}

/** L'activité d'un client, tirée de ses factures : une barre par semaine sur les 14 dernières, de 1 à 14. */
function tendanceFactures(factures: PLCustomerInvoice[]): number[] {
  const semaine = 7 * 86_400_000
  const maintenant = Date.now()
  const sommes = Array.from({ length: 14 }, () => 0)
  for (const f of factures) {
    if (!f.date || f.draft) continue
    const age = Math.floor((maintenant - new Date(f.date + 'T12:00:00').getTime()) / semaine)
    if (age >= 0 && age < 14) sommes[13 - age] += Number(f.currency_amount_before_tax) || 0
  }
  const max = Math.max(...sommes)
  return sommes.map((s) => (max ? Math.max(2, Math.round((s / max) * 14)) : 2))
}

export function magasinCrm(mode: 'demo' | 'pennylane') {
  const dossier = path.join(process.cwd(), '.cockpit')
  const fichier = path.join(dossier, mode === 'demo' ? 'crm-demo.json' : 'crm.json')
  let memoire: Crm | null = null
  let ecriture: Promise<void> = Promise.resolve()

  async function ecrire(crm: Crm) {
    memoire = crm
    // Les écritures passent l'une après l'autre, et le fichier est remplacé d'un coup : jamais de JSON coupé en deux.
    ecriture = ecriture.then(async () => {
      await fs.mkdir(dossier, { recursive: true })
      const tmp = `${fichier}.${process.pid}.tmp`
      await fs.writeFile(tmp, JSON.stringify(crm, null, 2) + '\n', 'utf8')
      await fs.rename(tmp, fichier)
    })
    await ecriture
  }

  async function lire(): Promise<Crm> {
    if (memoire) return memoire
    try {
      memoire = JSON.parse(await fs.readFile(fichier, 'utf8')) as Crm
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw new ErreurCrm(500, `${fichier} est illisible : ${(e as Error).message}`)
      await ecrire(mode === 'demo' ? crmDemo() : { moi: 'Moi', equipe: [{ nom: 'Moi', role: 'Dirigeant', email: '', telephone: '', ton: 'purple' }], entreprises: [] })
    }
    return memoire!
  }

  const trouver = (crm: Crm, id: string) => {
    const e = crm.entreprises.find((x) => x.id === id)
    if (!e) throw new ErreurCrm(404, `Entreprise introuvable : ${id}`)
    return e
  }

  function valider(b: unknown, base: Entreprise | null, crm: Crm): Entreprise {
    const d = (b ?? {}) as Record<string, unknown>
    const a = (cle: string) => cle in d
    const nom = a('nom') || !base ? texte(d.nom, "Le nom de l'entreprise", 80, false) : base.nom
    const responsable = a('responsable') || !base ? texte(d.responsable ?? crm.moi, 'Le responsable', 80, false) : base.responsable
    if (!crm.equipe.some((m) => m.nom === responsable)) throw new ErreurCrm(422, `${responsable} ne fait pas partie de l'équipe`)
    const etape = a('etape') || !base ? choix(d.etape ?? 'Nouveau', ETAPES, "L'étape") : base.etape
    return {
      id: base?.id ?? '',
      nom,
      segment: a('segment') || !base ? choix(d.segment ?? 'PME', SEGMENTS, 'Le segment') : base.segment,
      etape,
      etiquettes: a('etiquettes') ? etiquettesDe(d.etiquettes) : (base?.etiquettes ?? []),
      responsable,
      contact: a('contact') ? contactDe(d.contact) : (base?.contact ?? null),
      ville: a('ville') ? texte(d.ville, 'La ville', 60) || null : (base?.ville ?? null),
      affaires: a('affaires') ? entier(d.affaires, 'Le nombre d’affaires', 0, 99) : (base?.affaires ?? 1),
      pipeline: a('pipeline') ? entier(d.pipeline, 'Le montant du pipeline', 0, 100_000_000) : (base?.pipeline ?? 0),
      chances: a('chances') ? entier(d.chances, 'Les chances de signer', 0, 100) : (base?.chances ?? (etape === 'Gagné' || etape === 'Client' ? 100 : 10)),
      tendance: base?.tendance ?? [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 4],
      dernierEchange: a('dernierEchange')
        ? (() => {
            const x = (d.dernierEchange ?? {}) as Record<string, unknown>
            const date = texte(x.date, 'La date du dernier échange', 10, false)
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ErreurCrm(422, 'La date du dernier échange doit être au format AAAA-MM-JJ')
            return { date, libelle: texte(x.libelle, 'Le dernier échange', 40) || 'Échange' }
          })()
        : (base?.dernierEchange ?? { date: aujourdhui(), libelle: 'Création' }),
      suite: a('suite') ? texte(d.suite, 'La suite', 80) : (base?.suite ?? ''),
      notes: a('notes') ? texte(d.notes, 'Les notes', 2000) : (base?.notes ?? ''),
      pennylaneId: base?.pennylaneId ?? null,
      creeLe: base?.creeLe ?? aujourdhui(),
    }
  }

  return {
    lire,

    /** Chaque client Pennylane qui n'est pas encore dans le CRM y entre, à l'étape « Client ». */
    async synchroniser(clients: PLCustomer[], factures: PLCustomerInvoice[]) {
      const crm = await lire()
      const relies = new Set(crm.entreprises.map((e) => e.pennylaneId).filter((id) => id !== null))
      const nouveaux = clients.filter((c) => !relies.has(c.id))
      if (!nouveaux.length) return crm
      const pris = new Set(crm.entreprises.map((e) => e.id))
      for (const c of nouveaux) {
        const siennes = factures.filter((f) => f.customer?.id === c.id && !f.draft && f.date)
        const derniere = siennes.map((f) => f.date!).sort().at(-1)
        let id = slug(c.name)
        if (pris.has(id)) id = `${id}-${c.id}`
        pris.add(id)
        crm.entreprises.push({
          id,
          nom: c.name,
          segment: 'PME',
          etape: 'Client',
          etiquettes: [],
          responsable: crm.moi,
          contact: c.emails[0] ? { nom: '', email: c.emails[0], telephone: '' } : null,
          ville: c.billing_address?.city || null,
          affaires: 0,
          pipeline: 0,
          chances: 100,
          tendance: tendanceFactures(siennes),
          dernierEchange: { date: derniere ?? aujourdhui(), libelle: derniere ? 'Facture' : 'Import Pennylane' },
          suite: '',
          notes: '',
          pennylaneId: c.id,
          creeLe: aujourdhui(),
        })
      }
      await ecrire(crm)
      return crm
    },

    async ajouter(b: unknown): Promise<Entreprise> {
      const crm = await lire()
      const e = valider(b, null, crm)
      let id = slug(e.nom)
      for (let n = 2; crm.entreprises.some((x) => x.id === id); n++) id = `${slug(e.nom)}-${n}`
      e.id = id
      crm.entreprises.unshift(e)
      await ecrire(crm)
      return e
    },

    async modifier(id: string, b: unknown): Promise<Entreprise> {
      const crm = await lire()
      const base = trouver(crm, id)
      const e = valider(b, base, crm)
      Object.assign(base, e)
      await ecrire(crm)
      return base
    },

    /** Après l'envoi d'une facture : le dernier échange devient cette facture, et une affaire gagnée devient un client. */
    async factureEnvoyee(pennylaneId: number, numero: string) {
      const crm = await lire()
      const e = crm.entreprises.find((x) => x.pennylaneId === pennylaneId)
      if (!e) return
      e.dernierEchange = { date: aujourdhui(), libelle: `Facture ${numero}`.slice(0, 40) }
      if (e.etape === 'Gagné') e.etape = 'Client'
      await ecrire(crm)
    },

    async reinitialiser() {
      if (mode !== 'demo') throw new ErreurCrm(403, 'Seule la démo se réinitialise')
      await ecrire(crmDemo())
    },
  }
}

export type MagasinCrm = ReturnType<typeof magasinCrm>
export { ErreurCrm }
