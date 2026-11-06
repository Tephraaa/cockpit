// Les types et les listes du CRM, sans rien qui dépende de Node : la page peut les importer.

export const SEGMENTS = ['Grand compte', 'PME', 'TPE', 'Indépendant'] as const
export const ETAPES = ['Nouveau', 'Contacté', 'Rendez-vous', 'Devis envoyé', 'Gagné', 'Client', 'Perdu'] as const
export const TONS = ['blue', 'purple', 'green', 'moss', 'red', 'orange', 'amber', 'teal', 'yellow', 'neutral'] as const

export type Segment = (typeof SEGMENTS)[number]
export type Etape = (typeof ETAPES)[number]
export type Ton = (typeof TONS)[number]

export interface Membre {
  nom: string
  role: string
  email: string
  telephone: string
  ton: Ton
}

export interface Contact {
  nom: string
  email: string
  telephone: string
}

export interface Entreprise {
  id: string
  nom: string
  segment: Segment
  etape: Etape
  /** Étiquettes libres affichées après le segment et l'étape : « Récurrent », « Salon », « Upsell »… */
  etiquettes: string[]
  /** Le membre de l'équipe qui suit l'entreprise (son nom, voir `equipe`). */
  responsable: string
  contact: Contact | null
  ville: string | null
  /** Affaires en cours avec cette entreprise. */
  affaires: number
  /** Ce que ces affaires peuvent te rapporter, en euros HT. */
  pipeline: number
  /** Tes chances de signer, de 0 à 100. */
  chances: number
  /** L'activité des 14 dernières semaines, de 1 à 14 (les barres du tableau). */
  tendance: number[]
  dernierEchange: { date: string; libelle: string }
  /** Ce qu'il reste à faire, en quelques mots. */
  suite: string
  notes: string
  /** Le client Pennylane relié, s'il y en a un. */
  pennylaneId: number | null
  creeLe: string
}

export interface Crm {
  /** Ton nom dans `equipe` : c'est toi en haut à droite. */
  moi: string
  equipe: Membre[]
  entreprises: Entreprise[]
}
