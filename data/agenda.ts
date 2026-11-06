// L'agenda et les tâches de la semaine : les pages « Agenda » et « Tâches » se remplissent avec ce fichier.
// Comme mission.ts, c'est la semaine de Maison Orée, inventée ; le prompt du guide le relie à ton vrai agenda.
// `j` compte en jours ouvrés depuis aujourd'hui : 0 = aujourd'hui, -1 = le jour ouvré d'avant, 1 = le suivant.
// Les tâches d'aujourd'hui sont celles de « Ta journée » (mission.ts), pour que les pages se répondent.

import { TACHES, type Tache } from './mission'

export type TypeRdv = 'client' | 'tournage' | 'appel' | 'interne'
export type Couleur = 'bleu' | 'ambre' | 'vert' | 'gris'

export const TYPES_RDV: Record<TypeRdv, { libelle: string; couleur: Couleur }> = {
  client: { libelle: 'Rendez-vous client', couleur: 'bleu' },
  tournage: { libelle: 'Tournage', couleur: 'ambre' },
  appel: { libelle: 'Appel', couleur: 'vert' },
  interne: { libelle: 'Équipe', couleur: 'gris' },
}

export type Rdv = { j: number; debut: string; fin: string; titre: string; avec?: string; type: TypeRdv }

export const RDV: Rdv[] = [
  { j: -2, debut: '09:00', fin: '09:30', titre: "Point d'équipe", type: 'interne' },
  { j: -2, debut: '10:00', fin: '11:30', titre: 'Atelier de marque', avec: "Brasserie de l'Ourlet", type: 'client' },
  { j: -2, debut: '14:00', fin: '14:45', titre: 'Appel découverte', avec: 'Brûlerie Ombelle', type: 'appel' },
  { j: -2, debut: '16:00', fin: '17:00', titre: 'Revue des maquettes', avec: 'Studio Plissé', type: 'client' },
  { j: -1, debut: '09:30', fin: '12:30', titre: 'Tournage de la campagne', avec: 'Hôtel des Canuts Bleus', type: 'tournage' },
  { j: -1, debut: '14:00', fin: '14:30', titre: 'Premier appel', avec: 'Notaires Vasseur Pradier', type: 'appel' },
  { j: -1, debut: '15:30', fin: '16:30', titre: 'Point budget, en visio', avec: 'Delorme Mercier Avocats', type: 'client' },
  { j: 0, debut: '09:00', fin: '09:30', titre: "Point d'équipe", type: 'interne' },
  { j: 0, debut: '10:30', fin: '11:00', titre: 'Validation des maquettes', avec: 'Studio Plissé', type: 'client' },
  { j: 0, debut: '14:00', fin: '16:00', titre: 'Tournage en atelier', avec: 'Rouages Cycles', type: 'tournage' },
  { j: 0, debut: '16:30', fin: '17:00', titre: 'Relance du devis', avec: 'Cime Rouge Escalade', type: 'appel' },
  { j: 1, debut: '09:30', fin: '10:00', titre: 'Présentation de la campagne', avec: 'Boulangeries Vautrin', type: 'client' },
  { j: 1, debut: '10:00', fin: '11:00', titre: 'Premier rendez-vous', avec: 'Notaires Vasseur Pradier', type: 'client' },
  { j: 1, debut: '14:00', fin: '17:00', titre: 'Tournage à la distillerie', avec: 'Distillerie Arvel', type: 'tournage' },
  { j: 2, debut: '09:00', fin: '10:00', titre: 'Planning de la semaine prochaine', type: 'interne' },
  { j: 2, debut: '11:00', fin: '12:00', titre: 'Brief vidéo', avec: 'Ferme collective du Haut-Pilat', type: 'client' },
  { j: 2, debut: '15:00', fin: '16:00', titre: 'Livraison du site', avec: 'Kiosque Mobilités', type: 'client' },
]

export type TacheSemaine = Tache & { j: number }

export const TACHES_SEMAINE: TacheSemaine[] = [
  { j: -2, heure: '09:00', titre: 'Envoyer le devis à Cime Rouge Escalade', outil: 'mails', etat: 'faite' },
  { j: -2, heure: '11:00', titre: 'Préparer le planning des tournages', outil: 'agenda', etat: 'faite' },
  { j: -2, heure: '17:00', titre: 'Rapprocher les virements reçus', outil: 'banque', etat: 'auto' },
  { j: -1, heure: '09:30', titre: 'Relancer les factures en retard', outil: 'pennylane', etat: 'auto' },
  { j: -1, heure: '15:00', titre: 'Rappeler Yoga Arbre Lent pour son devis', outil: 'mails', etat: 'a_faire' },
  { j: -1, heure: '17:00', titre: "Classer les rushs de l'Hôtel des Canuts Bleus", outil: 'drive', etat: 'faite' },
  ...TACHES.map((t) => ({ ...t, j: 0 })),
  { j: 1, heure: '09:00', titre: 'Préparer la présentation de Boulangeries Vautrin', outil: 'drive', etat: 'a_faire' },
  { j: 1, heure: '11:30', titre: 'Publier les stories de Studio Plissé', outil: 'reseaux', etat: 'auto' },
  { j: 1, heure: '17:00', titre: "Facturer le tournage de l'Hôtel des Canuts Bleus", outil: 'pennylane', etat: 'a_faire' },
  { j: 2, heure: '10:00', titre: 'Monter la vidéo de Rouages Cycles', outil: 'drive', etat: 'a_faire' },
  { j: 2, heure: '16:30', titre: 'Envoyer le devis à Domaine des Aubes Claires', outil: 'mails', etat: 'a_faire' },
  { j: 2, heure: '17:30', titre: 'Récap de la semaine aux clients', outil: 'mails', etat: 'auto' },
]

/** Le jour ouvré situé `j` jours ouvrés après aujourd'hui (un samedi ou un dimanche, on part du lundi suivant). */
export function jourOuvre(j: number, depuis = new Date()): Date {
  const d = new Date(depuis)
  d.setHours(12, 0, 0, 0)
  const ouvre = () => d.getDay() !== 0 && d.getDay() !== 6
  while (!ouvre()) d.setDate(d.getDate() + 1)
  for (let reste = Math.abs(j); reste > 0; ) {
    d.setDate(d.getDate() + Math.sign(j))
    if (ouvre()) reste--
  }
  return d
}
