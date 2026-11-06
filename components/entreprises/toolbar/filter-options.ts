import { ETAPES, type Membre } from "@/server/crm-types";
import { TOUS, TOUTES } from "@/lib/cockpit";

export const SORT_MENU_OPTIONS = [
  { value: "pipeline", label: "Pipeline" },
  { value: "chances", label: "Chances de signer" },
  { value: "echange", label: "Dernier échange" },
  { value: "affaires", label: "Affaires" },
  { value: "nom", label: "Nom" },
];

export function ownerOptions(equipe: Membre[]) {
  return [
    { value: TOUS, label: "Toute l'équipe" },
    ...equipe.map((m) => ({ value: m.nom, label: m.nom })),
  ];
}

export const STAGE_OPTIONS = [
  { value: TOUTES, label: "Toutes" },
  ...ETAPES.map((etape) => ({ value: etape, label: etape })),
];

export const ACTIVITY_OPTIONS = [
  { value: "7", label: "7 jours" },
  { value: "30", label: "30 jours" },
  { value: "90", label: "90 jours" },
  { value: "365", label: "12 mois" },
  { value: "0", label: "Tout" },
];
