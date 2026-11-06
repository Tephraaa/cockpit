// Calcule tout ce qu'affiche la page à partir des factures, des clients et des encaissements.
// Même calcul pour la démo et pour Pennylane : seule la source change.

import { NOMS_REGIONS, regionDe } from './regions.ts'
import type { ClientResume, Kpi, LigneFacture, PLCustomerInvoice, Serie, Source, StatutFacture, Tableau } from './types.ts'

const JOUR = 86_400_000
const num = (v: string | null | undefined) => (v ? Number(v) : 0)

/** Date locale AAAA-MM-JJ, `n` jours avant aujourd'hui. */
function ilYa(n: number) {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

const STATUTS: Partial<Record<string, StatutFacture>> = {
  paid: 'payee',
  partially_paid: 'partielle',
  upcoming: 'a_venir',
  late: 'en_retard',
  draft: 'brouillon',
}

/** Montant HT qui compte dans le chiffre d'affaires. Une facture annulée est compensée par son avoir. */
function caHT(f: PLCustomerInvoice) {
  if (f.draft || f.status === 'draft') return 0
  const ht = num(f.currency_amount_before_tax)
  if (f.status === 'credit_note') return -Math.abs(ht)
  return ['paid', 'partially_paid', 'upcoming', 'late', 'cancelled', 'partially_cancelled'].includes(f.status) ? ht : 0
}

const somme = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const entre = (d: string | null, debut: string, fin: string) => !!d && d >= debut && d <= fin
const variation = (actuel: number, avant: number) => (avant > 0 ? ((actuel - avant) / avant) * 100 : null)

function serie(factures: PLCustomerInvoice[], periode: Serie['periode']): Serie {
  const [n, largeur] = periode === '12m' ? [12, 30] : [13, 14]
  const mois = new Intl.DateTimeFormat('fr-FR', { month: 'short' })
  const jourMois = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
  const points = Array.from({ length: n }, (_, i) => {
    const fin = ilYa((n - 1 - i) * largeur)
    const debut = ilYa((n - 1 - i) * largeur + largeur - 1)
    const milieu = new Date(new Date(fin + 'T12:00:00').getTime() - (largeur / 2) * JOUR)
    return {
      debut,
      fin,
      montant: somme(factures.filter((f) => entre(f.date, debut, fin)).map(caHT)),
      etiquette: periode === '12m' ? mois.format(milieu) : jourMois.format(new Date(fin + 'T12:00:00')),
    }
  })
  const total = somme(points.map((p) => p.montant))
  let evolution: number | null = null
  if (periode === '6m') {
    const fin = ilYa(n * largeur)
    const debut = ilYa(2 * n * largeur - 1)
    evolution = variation(total, somme(factures.filter((f) => entre(f.date, debut, fin)).map(caHT)))
  }
  return { periode, total, variation: evolution, points }
}

export async function calculerTableau(source: Source, objectifAnnuel: number): Promise<Tableau> {
  const avertissements: string[] = []
  const [entreprise, clients, factures] = await Promise.all([source.entreprise(), source.clients(), source.factures()])
  const encaissements = await source.encaissements(ilYa(59)).catch((e: Error) => {
    avertissements.push(`Encaissements indisponibles : ${e.message}. Le jeton a-t-il accès aux transactions ?`)
    return null
  })

  const aujourdhui = ilYa(0)
  const j29 = ilYa(29)
  const j30 = ilYa(30)
  const j59 = ilYa(59)
  const j359 = ilYa(359)
  const nomClient = new Map(clients.map((c) => [c.id, c.name]))

  // ---------- Chiffres clés ----------
  const ca = somme(factures.filter((f) => entre(f.date, j29, aujourdhui)).map(caHT))
  const caAvant = somme(factures.filter((f) => entre(f.date, j59, j30)).map(caHT))
  const entrees = (debut: string, fin: string) =>
    somme((encaissements ?? []).filter((t) => t.customer && entre(t.date, debut, fin)).map((t) => num(t.amount)))
  const ouvertes = factures.filter((f) => ['upcoming', 'late', 'partially_paid'].includes(f.status) && !f.draft)
  const retard = ouvertes.filter((f) => f.status === 'late' || (!!f.deadline && f.deadline < aujourdhui))
  const tresVieilles = retard.filter((f) => f.deadline && f.deadline < ilYa(30)).length
  const kpis: Kpi[] = [
    {
      cle: 'ca',
      libelle: "Chiffre d'affaires",
      valeur: ca,
      legende: 'HT, 30 derniers jours',
      tendance: variation(ca, caAvant) === null ? null : { pourcent: variation(ca, caAvant)! },
    },
    {
      cle: 'encaisse',
      libelle: 'Encaissé',
      valeur: encaissements ? entrees(j29, aujourdhui) : null,
      legende: 'sur le compte, 30 jours',
      tendance: encaissements && variation(entrees(j29, aujourdhui), entrees(j59, j30)) !== null
        ? { pourcent: variation(entrees(j29, aujourdhui), entrees(j59, j30))! }
        : null,
    },
    {
      cle: 'a_encaisser',
      libelle: 'À encaisser',
      valeur: somme(ouvertes.map((f) => num(f.remaining_amount_with_tax))),
      legende: `${ouvertes.length} facture${ouvertes.length > 1 ? 's' : ''} TTC`,
      tendance: { texte: `${new Set(ouvertes.map((f) => f.customer?.id)).size} clients`, ton: 'neutre' },
    },
    {
      cle: 'retard',
      libelle: 'En retard',
      valeur: somme(retard.map((f) => num(f.remaining_amount_with_tax))),
      legende: `${retard.length} facture${retard.length > 1 ? 's' : ''} TTC`,
      tendance: tresVieilles ? { texte: `${tresVieilles} à +30 j`, ton: 'alerte' } : null,
    },
  ]

  // ---------- Régions et clients actifs (12 mois) ----------
  const annee = factures.filter((f) => entre(f.date, j359, aujourdhui) && caHT(f) !== 0)
  const parRegion = new Map<string, { clients: Set<number>; montant: number }>()
  const premiereFacture = new Map<number, string>()
  for (const f of factures) {
    if (!f.customer || caHT(f) <= 0 || !f.date) continue
    const avant = premiereFacture.get(f.customer.id)
    if (!avant || f.date < avant) premiereFacture.set(f.customer.id, f.date)
  }
  const adresse = new Map(clients.map((c) => [c.id, c.billing_address]))
  for (const f of annee) {
    const region = f.customer ? regionDe(adresse.get(f.customer.id)) : null
    if (!region) continue
    const r = parRegion.get(region) ?? { clients: new Set<number>(), montant: 0 }
    r.clients.add(f.customer!.id)
    r.montant += caHT(f)
    parRegion.set(region, r)
  }
  const regions = Object.entries(NOMS_REGIONS)
    .map(([code, nom]) => ({ code, nom, clients: parRegion.get(code)?.clients.size ?? 0, montant: parRegion.get(code)?.montant ?? 0 }))
    .sort((a, b) => b.montant - a.montant)
  const actifs = new Set(annee.map((f) => f.customer?.id).filter(Boolean))
  const j89 = ilYa(89)
  const nouveaux = [...actifs].filter((id) => (premiereFacture.get(id!) ?? '') >= j89).length

  // ---------- Objectif de l'année civile ----------
  // Sans objectif réglé, Cockpit vise +10 % sur les 12 derniers mois, arrondi à la dizaine de milliers.
  const maintenant = new Date()
  const douzeMois = somme(annee.map(caHT))
  const finAnnee = new Date(maintenant.getFullYear(), 11, 31)
  const objectif = {
    annee: maintenant.getFullYear(),
    montant: somme(factures.filter((f) => entre(f.date, `${maintenant.getFullYear()}-01-01`, aujourdhui)).map(caHT)),
    cible: objectifAnnuel || Math.max(10_000, Math.ceil((douzeMois * 1.1) / 10_000) * 10_000),
    auto: !objectifAnnuel,
    joursRestants: Math.round((finAnnee.getTime() - maintenant.getTime()) / JOUR),
  }

  // ---------- Tableau des factures ----------
  const lignes: LigneFacture[] = factures
    .filter((f) => STATUTS[f.status] || f.draft)
    .map((f) => ({
      id: f.id,
      numero: f.invoice_number,
      client: (f.customer && nomClient.get(f.customer.id)) ?? 'Client inconnu',
      clientId: f.customer?.id ?? null,
      statut: f.draft ? 'brouillon' : STATUTS[f.status]!,
      montant: num(f.amount),
      restant: f.status === 'paid' ? 0 : num(f.remaining_amount_with_tax),
      date: f.date,
      echeance: f.deadline,
    }))
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || b.id - a.id)

  // ---------- Fiches clients : ce que chacun t'a rapporté ----------
  const regle = (f: PLCustomerInvoice) =>
    f.status === 'paid' ? num(f.amount) : f.status === 'partially_paid' ? num(f.amount) - num(f.remaining_amount_with_tax) : 0
  const fiches: ClientResume[] = clients.map((c) => {
    const siennes = factures.filter((f) => f.customer?.id === c.id)
    const dates = siennes.filter((f) => caHT(f) !== 0 && f.date).map((f) => f.date!).sort()
    const ouvertesC = ouvertes.filter((f) => f.customer?.id === c.id)
    const retardC = retard.filter((f) => f.customer?.id === c.id)
    const a = c.billing_address
    const region = regionDe(a)
    return {
      id: c.id,
      nom: c.name,
      email: c.emails[0] ?? null,
      adresse: a ? `${a.address}, ${a.postal_code} ${a.city}` : null,
      ville: a?.city ?? null,
      region: region ? NOMS_REGIONS[region] : null,
      depuis: dates[0] ?? null,
      derniereFacture: dates[dates.length - 1] ?? null,
      caTotal: somme(siennes.map(caHT)),
      ca12: somme(siennes.filter((f) => entre(f.date, j359, aujourdhui)).map(caHT)),
      regle: somme(siennes.map(regle)),
      aEncaisser: somme(ouvertesC.map((f) => num(f.remaining_amount_with_tax))),
      enRetard: somme(retardC.map((f) => num(f.remaining_amount_with_tax))),
      nbFactures: dates.length,
      nbOuvertes: ouvertesC.length,
      nbRetard: retardC.length,
      series: [serie(siennes, '12m'), serie(siennes, '6m')],
    }
  })

  return {
    mode: source.mode,
    entreprise,
    maj: new Date().toISOString(),
    kpis,
    series: [serie(factures, '12m'), serie(factures, '6m')],
    regions,
    clientsActifs: actifs.size,
    nouveauxClients: nouveaux,
    objectif,
    factures: lignes,
    clients: fiches.sort((a, b) => a.nom.localeCompare(b.nom, 'fr')),
    avertissements,
  }
}
