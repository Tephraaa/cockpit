// Tes prospects, du premier contact à la signature : le tableau « Leads » de l'accueil se remplit avec ce fichier.
// Comme mission.ts, il décrit ton organisation (Pennylane ne connaît pas les prospects). Le prompt du guide le relie
// à ton CRM ou à ton formulaire de contact ; ici, ce sont les prospects de Maison Orée, tous inventés.

export type EtapeLead = 'nouveau' | 'contacte' | 'rdv' | 'devis' | 'gagne' | 'perdu'

export type Lead = {
  entreprise: string
  contact: string
  ville: string
  source: 'Site web' | 'Recommandation' | 'Instagram' | 'LinkedIn' | 'Salon'
  etape: EtapeLead
  /** Montant HT espéré, en euros. */
  montant: number
  /** Jours depuis le dernier échange. */
  dernierEchange: number
  /** Ce qu'il reste à faire, en quelques mots. */
  suite: string
}

export const ETAPES: Record<EtapeLead, { libelle: string; avancement: number }> = {
  nouveau: { libelle: 'Nouveau', avancement: 0.1 },
  contacte: { libelle: 'Contacté', avancement: 0.3 },
  rdv: { libelle: 'Rendez-vous', avancement: 0.55 },
  devis: { libelle: 'Devis envoyé', avancement: 0.8 },
  gagne: { libelle: 'Gagné', avancement: 1 },
  perdu: { libelle: 'Perdu', avancement: 1 },
}

export const LEADS: Lead[] = [
  { entreprise: 'Brûlerie Ombelle', contact: 'Léa Fournier', ville: 'Lyon', source: 'Instagram', etape: 'nouveau', montant: 2400, dernierEchange: 0, suite: 'à rappeler' },
  { entreprise: 'Cime Rouge Escalade', contact: 'Maxime Roche', ville: 'Grenoble', source: 'Salon', etape: 'devis', montant: 9500, dernierEchange: 4, suite: 'relancer le devis' },
  { entreprise: 'Notaires Vasseur Pradier', contact: 'Hugo Pradier', ville: 'Lyon', source: 'Recommandation', etape: 'rdv', montant: 6800, dernierEchange: 1, suite: 'rdv demain, 10 h' },
  { entreprise: 'Atelier Fil Indigo', contact: 'Sarah Benamou', ville: 'Villeurbanne', source: 'Site web', etape: 'contacte', montant: 3200, dernierEchange: 2, suite: 'envoyer le brief' },
  { entreprise: 'Domaine des Aubes Claires', contact: 'Antoine Vial', ville: 'Mâcon', source: 'Salon', etape: 'rdv', montant: 7300, dernierEchange: 2, suite: 'dégustation lundi' },
  { entreprise: 'Yoga Arbre Lent', contact: 'Chloé Marin', ville: 'Lyon', source: 'Instagram', etape: 'devis', montant: 1900, dernierEchange: 3, suite: 'devis ouvert hier' },
  { entreprise: 'Fromagerie Tissot-Ballard', contact: 'Élise Tissot', ville: 'Annecy', source: 'Recommandation', etape: 'gagne', montant: 4600, dernierEchange: 6, suite: 'à facturer' },
  { entreprise: 'Garage Pétale Vélos', contact: 'Nicolas Faure', ville: 'Lyon', source: 'LinkedIn', etape: 'perdu', montant: 5200, dernierEchange: 12, suite: 'budget gelé' },
]
