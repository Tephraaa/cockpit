// Types partagés entre le serveur et la page. Les objets « PL… » reprennent les noms de champs
// de la Company API v2 de Pennylane ; le reste décrit ce que la page reçoit, déjà calculé.

export type Ref = { id: number; url: string }

/** Statuts d'une facture client dans l'API (sous-ensemble utile au tableau de bord). */
export type PLInvoiceStatus =
  | 'draft'
  | 'upcoming'
  | 'late'
  | 'paid'
  | 'partially_paid'
  | 'cancelled'
  | 'partially_cancelled'
  | 'credit_note'
  | 'archived'
  | 'incomplete'
  | (string & {})

export interface PLCustomerInvoice {
  id: number
  label: string | null
  invoice_number: string
  amount: string
  currency_amount_before_tax: string
  date: string | null
  deadline: string | null
  paid: boolean
  status: PLInvoiceStatus
  draft: boolean
  remaining_amount_with_tax: string | null
  public_file_url: string | null
  customer: Ref | null
}

export interface PLCustomer {
  id: number
  name: string
  emails: string[]
  billing_address: { address: string; postal_code: string; city: string; country_alpha2: string } | null
}

export interface PLTransaction {
  id: number
  date: string
  amount: string
  customer: Ref | null
}

/** Ce que le serveur sait faire, que les données viennent de Pennylane ou de la démo. */
export interface Source {
  mode: 'demo' | 'pennylane'
  entreprise(): Promise<string>
  clients(): Promise<PLCustomer[]>
  factures(): Promise<PLCustomerInvoice[]>
  /** Entrées d'argent du compte bancaire depuis `depuis` (AAAA-MM-JJ). */
  encaissements(depuis: string): Promise<PLTransaction[]>
  creerBrouillon(f: NouvelleFacture): Promise<PLCustomerInvoice>
  finaliser(id: number): Promise<PLCustomerInvoice>
  envoyer(id: number): Promise<void>
  facture(id: number): Promise<PLCustomerInvoice>
  /**
   * Le lien que le client ouvre pour payer. Avec Pennylane, c'est le PDF de la facture : il porte le bouton
   * « Payer maintenant » quand le paiement en ligne est activé dans Pennylane (l'API ne renvoie pas d'autre lien).
   * Dans la démo, c'est une page de paiement simulée.
   */
  lienPaiement(id: number): Promise<string | null>
}

export type CodeTva = 'FR_200' | 'FR_100' | 'FR_55' | 'exempt'

export interface NouvelleFacture {
  clientId: number
  libelle: string
  montantHT: number
  tva: CodeTva
  echeanceJours: number
}

// ---------- Ce que reçoit la page ----------

export type StatutFacture = 'payee' | 'partielle' | 'a_venir' | 'en_retard' | 'brouillon'

export interface Kpi {
  cle: 'ca' | 'encaisse' | 'a_encaisser' | 'retard'
  libelle: string
  valeur: number | null
  legende: string
  /** Variation en % (CA, encaissé) ou mention courte (« 3 clients »). */
  tendance: { pourcent: number } | { texte: string; ton: 'neutre' | 'alerte' } | null
}

export interface Serie {
  periode: '12m' | '6m'
  total: number
  variation: number | null
  points: { debut: string; fin: string; montant: number; etiquette: string }[]
}

export interface Region {
  code: string
  nom: string
  clients: number
  montant: number
}

export interface LigneFacture {
  id: number
  numero: string
  client: string
  clientId: number | null
  statut: StatutFacture
  montant: number
  restant: number
  date: string | null
  echeance: string | null
}

/** Un client et ce qu'il t'a rapporté : de quoi remplir sa fiche et la page Clients. */
export interface ClientResume {
  id: number
  nom: string
  email: string | null
  /** Adresse de facturation, sur une ligne. */
  adresse: string | null
  ville: string | null
  region: string | null
  /** Date de sa première facture (hors brouillons), puis de la dernière. */
  depuis: string | null
  derniereFacture: string | null
  /** HT : toutes ses factures, puis les 12 derniers mois. */
  caTotal: number
  ca12: number
  /** TTC : déjà réglé, reste à encaisser, dont en retard. */
  regle: number
  aEncaisser: number
  enRetard: number
  nbFactures: number
  nbOuvertes: number
  nbRetard: number
  series: Serie[]
}

export interface Tableau {
  mode: Source['mode']
  entreprise: string
  maj: string
  kpis: Kpi[]
  series: Serie[]
  regions: Region[]
  clientsActifs: number
  nouveauxClients: number
  objectif: { annee: number; montant: number; cible: number; auto: boolean; joursRestants: number }
  factures: LigneFacture[]
  clients: ClientResume[]
  avertissements: string[]
}
