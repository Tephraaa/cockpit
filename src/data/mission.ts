// Ce que fait ton entreprise, à quel moment et avec quel outil : la vue « Mission control » se remplit
// avec ce fichier. Le prompt du guide le réécrit avec tes réponses ; ici, c'est la journée de Maison Orée.
// Seul Pennylane est vraiment branché (par l'API, voir server/) : le reste décrit ton organisation.

import type { LucideIcon } from 'lucide-react'
import { CalendarDays, FolderOpen, Landmark, Mail, Megaphone, ReceiptEuro } from 'lucide-react'

export type Outil = { id: string; nom: string; role: string; icone: LucideIcon }

export type Tache = {
  heure: string
  titre: string
  outil: Outil['id']
  /** faite : cochée aujourd'hui ; auto : une automatisation s'en charge ; a_faire : reste à faire. */
  etat: 'faite' | 'auto' | 'a_faire'
}

export type Automatisation = {
  nom: string
  quand: string
  outil: Outil['id']
  /** Minutes gagnées à chaque passage, pour le calcul du temps gagné. */
  minutes: number
  /** Passages par semaine. */
  parSemaine: number
  /** Taux de réussite sur les 30 derniers jours, de 0 à 1. */
  reussite: number
  derniere: string
}

export const OUTILS: Outil[] = [
  { id: 'mails', nom: 'Mails', role: 'Devis et échanges clients', icone: Mail },
  { id: 'agenda', nom: 'Agenda', role: 'Rendez-vous et tournages', icone: CalendarDays },
  { id: 'drive', nom: 'Drive', role: 'Fichiers des clients', icone: FolderOpen },
  { id: 'reseaux', nom: 'Réseaux sociaux', role: 'Posts des clients', icone: Megaphone },
  { id: 'banque', nom: 'Banque', role: 'Comptes et virements', icone: Landmark },
  { id: 'pennylane', nom: 'Pennylane', role: 'Factures et liens de paiement', icone: ReceiptEuro },
]

export const TACHES: Tache[] = [
  { heure: '08:30', titre: 'Trier les mails et les demandes de devis', outil: 'mails', etat: 'faite' },
  { heure: '09:30', titre: 'Relancer les factures en retard', outil: 'pennylane', etat: 'auto' },
  { heure: '10:30', titre: 'Valider les maquettes de Studio Plissé', outil: 'drive', etat: 'faite' },
  { heure: '11:30', titre: "Publier la campagne de l'Hôtel des Canuts Bleus", outil: 'reseaux', etat: 'auto' },
  { heure: '14:00', titre: 'Tournage chez Rouages Cycles', outil: 'agenda', etat: 'a_faire' },
  { heure: '16:00', titre: 'Facturer le site de Boulangeries Vautrin', outil: 'pennylane', etat: 'a_faire' },
  { heure: '17:00', titre: 'Rapprocher les virements reçus', outil: 'banque', etat: 'auto' },
]

export const AUTOMATISATIONS: Automatisation[] = [
  { nom: 'Relance des factures en retard', quand: 'Chaque matin, 9 h 30', outil: 'pennylane', minutes: 12, parSemaine: 5, reussite: 1, derniere: "aujourd'hui, 9:30" },
  { nom: 'Rapprochement des virements reçus', quand: 'Chaque matin, 7 h', outil: 'banque', minutes: 15, parSemaine: 5, reussite: 0.96, derniere: "aujourd'hui, 7:00" },
  { nom: 'Publication des posts planifiés', quand: 'Selon le planning', outil: 'reseaux', minutes: 10, parSemaine: 9, reussite: 0.94, derniere: "aujourd'hui, 11:30" },
  { nom: 'Récap de la semaine aux clients', quand: 'Chaque vendredi, 17 h 30', outil: 'mails', minutes: 60, parSemaine: 1, reussite: 1, derniere: 'vendredi, 17:30' },
  { nom: 'Rappel des rendez-vous', quand: 'La veille, 18 h', outil: 'agenda', minutes: 5, parSemaine: 6, reussite: 0.88, derniere: 'hier, 18:00' },
]
