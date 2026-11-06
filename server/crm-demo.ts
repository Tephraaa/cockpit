// Le CRM de la démo : l'équipe de Maison Orée, ses 12 clients (les mêmes que dans le faux Pennylane, reliés par
// leur id) et ses 8 prospects. Toutes les entreprises et les personnes sont inventées ; les e-mails sont en .example
// et les numéros dans les plages que l'ARCEP réserve à la fiction. Les dates sont comptées en jours avant aujourd'hui.

import type { Crm, Entreprise, Etape, Membre, Segment } from './crm-types'
import { CLIENTS } from './demo-donnees'

const ilYa = (jours: number) => new Date(Date.now() - jours * 86_400_000).toLocaleDateString('sv-SE')

const EQUIPE: Membre[] = [
  { nom: 'Camille Aubert', role: 'Gérante', email: 'camille@maison-oree.example', telephone: '04 65 71 20 01', ton: 'purple' },
  { nom: 'Hugo Lefèvre', role: 'Chef de projet', email: 'hugo@maison-oree.example', telephone: '04 65 71 20 02', ton: 'blue' },
  { nom: 'Inès Morel', role: 'Commerciale', email: 'ines@maison-oree.example', telephone: '04 65 71 20 03', ton: 'green' },
  { nom: 'Théo Garnier', role: 'Directeur artistique', email: 'theo@maison-oree.example', telephone: '04 65 71 20 04', ton: 'orange' },
  { nom: 'Manon Leroy', role: 'Social media manager', email: 'manon@maison-oree.example', telephone: '04 65 71 20 05', ton: 'teal' },
]

const TENDANCES = [
  [4, 4, 10, 3, 2, 4, 7, 4, 11, 4, 11, 7, 4, 14],
  [4, 4, 5, 5, 2, 7, 11, 7, 5, 7, 5, 3, 7, 14],
  [4, 4, 10, 5, 2, 7, 11, 7, 11, 7, 11, 7, 7, 14],
  [4, 4, 5, 12, 5, 7, 11, 3, 11, 3, 11, 3, 7, 14],
]

type Ligne = {
  nom: string
  segment: Segment
  etape: Etape
  etiquettes: string[]
  responsable: string
  affaires: number
  pipeline: number
  chances: number
  jours: number
  echange: string
  suite: string
  ville: string
  contact?: { nom: string; email: string; telephone: string }
  client?: number
}

const CLIENTS_CRM: Ligne[] = [
  { client: 0, nom: '', segment: 'PME', etape: 'Client', etiquettes: ['Récurrent'], responsable: 'Hugo Lefèvre', affaires: 1, pipeline: 4800, chances: 70, jours: 3, echange: 'Point mensuel', suite: 'Proposer la carte de printemps', ville: '' },
  { client: 1, nom: '', segment: 'PME', etape: 'Client', etiquettes: ['Récurrent', 'Upsell'], responsable: 'Camille Aubert', affaires: 2, pipeline: 12500, chances: 64, jours: 5, echange: 'Point budget', suite: 'Envoyer le devis du rapport annuel', ville: '' },
  { client: 2, nom: '', segment: 'PME', etape: 'Client', etiquettes: ['Upsell'], responsable: 'Inès Morel', affaires: 1, pipeline: 6200, chances: 82, jours: 1, echange: 'Présentation', suite: 'Présenter la campagne demain', ville: '' },
  { client: 3, nom: '', segment: 'TPE', etape: 'Client', etiquettes: [], responsable: 'Hugo Lefèvre', affaires: 1, pipeline: 1900, chances: 35, jours: 11, echange: 'Appel', suite: 'Relancer pour la refonte du site', ville: '' },
  { client: 4, nom: '', segment: 'TPE', etape: 'Client', etiquettes: ['Récurrent'], responsable: 'Théo Garnier', affaires: 1, pipeline: 3400, chances: 88, jours: 0, echange: 'Maquettes', suite: 'Valider les maquettes ce matin', ville: '' },
  { client: 5, nom: '', segment: 'TPE', etape: 'Client', etiquettes: [], responsable: 'Manon Leroy', affaires: 1, pipeline: 2600, chances: 45, jours: 6, echange: 'Brief vidéo', suite: 'Brief vidéo mercredi', ville: '' },
  { client: 6, nom: '', segment: 'PME', etape: 'Client', etiquettes: ['Récurrent'], responsable: 'Manon Leroy', affaires: 2, pipeline: 9800, chances: 73, jours: 1, echange: 'Tournage', suite: 'Monter la campagne', ville: '' },
  { client: 7, nom: '', segment: 'TPE', etape: 'Client', etiquettes: [], responsable: 'Théo Garnier', affaires: 1, pipeline: 4100, chances: 58, jours: 0, echange: 'Tournage', suite: 'Tournage en atelier, 14 h', ville: '' },
  { client: 8, nom: '', segment: 'TPE', etape: 'Client', etiquettes: [], responsable: 'Inès Morel', affaires: 1, pipeline: 1500, chances: 30, jours: 21, echange: 'Relance', suite: 'Proposer la vitrine de Noël', ville: '' },
  { client: 9, nom: '', segment: 'PME', etape: 'Client', etiquettes: ['Upsell'], responsable: 'Hugo Lefèvre', affaires: 1, pipeline: 7400, chances: 66, jours: 9, echange: 'Livraison', suite: 'Livrer le site jeudi', ville: '' },
  { client: 10, nom: '', segment: 'PME', etape: 'Client', etiquettes: ['Récurrent'], responsable: 'Camille Aubert', affaires: 2, pipeline: 11200, chances: 77, jours: 2, echange: 'Tournage', suite: 'Tournage à la distillerie', ville: '' },
  { client: 11, nom: '', segment: 'TPE', etape: 'Client', etiquettes: [], responsable: 'Manon Leroy', affaires: 1, pipeline: 2900, chances: 40, jours: 14, echange: 'Affiche', suite: "Affiche du festival d'été", ville: '' },
]

const PROSPECTS: Ligne[] = [
  { nom: 'Brûlerie Ombelle', segment: 'TPE', etape: 'Nouveau', etiquettes: ['Instagram'], responsable: 'Inès Morel', affaires: 1, pipeline: 2400, chances: 12, jours: 0, echange: 'Premier message', suite: 'À rappeler', ville: 'Lyon', contact: { nom: 'Léa Fournier', email: 'lea@brulerie-ombelle.example', telephone: '06 39 98 41 10' } },
  { nom: 'Cime Rouge Escalade', segment: 'PME', etape: 'Devis envoyé', etiquettes: ['Salon'], responsable: 'Inès Morel', affaires: 1, pipeline: 9500, chances: 74, jours: 4, echange: 'Devis', suite: 'Relancer le devis', ville: 'Grenoble', contact: { nom: 'Maxime Roche', email: 'maxime@cime-rouge.example', telephone: '06 39 98 41 11' } },
  { nom: 'Notaires Vasseur Pradier', segment: 'PME', etape: 'Rendez-vous', etiquettes: ['Recommandation'], responsable: 'Camille Aubert', affaires: 1, pipeline: 6800, chances: 52, jours: 1, echange: 'Premier appel', suite: 'Rendez-vous demain, 10 h', ville: 'Lyon', contact: { nom: 'Hugo Pradier', email: 'h.pradier@vasseur-pradier.example', telephone: '06 39 98 41 12' } },
  { nom: 'Atelier Fil Indigo', segment: 'Indépendant', etape: 'Contacté', etiquettes: ['Site web'], responsable: 'Hugo Lefèvre', affaires: 1, pipeline: 3200, chances: 28, jours: 2, echange: 'Appel découverte', suite: 'Envoyer le brief', ville: 'Villeurbanne', contact: { nom: 'Sarah Benamou', email: 'sarah@fil-indigo.example', telephone: '06 39 98 41 13' } },
  { nom: 'Domaine des Aubes Claires', segment: 'PME', etape: 'Rendez-vous', etiquettes: ['Salon'], responsable: 'Théo Garnier', affaires: 1, pipeline: 7300, chances: 57, jours: 2, echange: 'Visite', suite: 'Dégustation lundi', ville: 'Mâcon', contact: { nom: 'Antoine Vial', email: 'antoine@aubes-claires.example', telephone: '06 39 98 41 14' } },
  { nom: 'Yoga Arbre Lent', segment: 'Indépendant', etape: 'Devis envoyé', etiquettes: ['Instagram'], responsable: 'Manon Leroy', affaires: 1, pipeline: 1900, chances: 81, jours: 3, echange: 'Devis ouvert', suite: 'Devis ouvert hier : rappeler', ville: 'Lyon', contact: { nom: 'Chloé Marin', email: 'chloe@arbre-lent.example', telephone: '06 39 98 41 15' } },
  { nom: 'Fromagerie Tissot-Ballard', segment: 'TPE', etape: 'Gagné', etiquettes: ['Recommandation'], responsable: 'Camille Aubert', affaires: 1, pipeline: 4600, chances: 100, jours: 6, echange: 'Signature', suite: 'À facturer', ville: 'Annecy', contact: { nom: 'Élise Tissot', email: 'elise@tissot-ballard.example', telephone: '06 39 98 41 16' } },
  { nom: 'Garage Pétale Vélos', segment: 'TPE', etape: 'Perdu', etiquettes: ['LinkedIn'], responsable: 'Hugo Lefèvre', affaires: 0, pipeline: 5200, chances: 0, jours: 12, echange: 'Réponse', suite: 'Budget gelé : relancer en mars', ville: 'Lyon', contact: { nom: 'Nicolas Faure', email: 'nicolas@petale-velos.example', telephone: '06 39 98 41 17' } },
]

const slugDemo = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export function crmDemo(): Crm {
  const entreprises: Entreprise[] = [...CLIENTS_CRM, ...PROSPECTS].map((l, i) => {
    const client = l.client !== undefined ? CLIENTS[l.client] : null
    const nom = client?.nom ?? l.nom
    return {
      id: slugDemo(nom),
      nom,
      segment: l.segment,
      etape: l.etape,
      etiquettes: l.etiquettes,
      responsable: l.responsable,
      contact: client ? { nom: client.contact, email: client.email, telephone: `04 65 71 ${String(30 + i).padStart(2, '0')} 00` } : (l.contact ?? null),
      ville: client?.ville ?? l.ville,
      affaires: l.affaires,
      pipeline: l.pipeline,
      chances: l.chances,
      tendance: TENDANCES[i % TENDANCES.length],
      dernierEchange: { date: ilYa(l.jours), libelle: l.echange },
      suite: l.suite,
      notes: '',
      pennylaneId: l.client !== undefined ? 1001 + l.client : null,
      creeLe: ilYa(client ? 400 - i * 20 : 30 - i),
    }
  })
  return { moi: 'Camille Aubert', equipe: EQUIPE, entreprises }
}
