import {
  ETAPES,
  type Entreprise,
  type Etape,
  type Membre,
  type Segment,
  type Ton,
} from "@/server/crm-types";
import { joursDepuis } from "@/lib/format";

export const SEGMENT_TONS: Record<Segment, Ton> = {
  "Grand compte": "blue",
  PME: "moss",
  TPE: "yellow",
  Indépendant: "purple",
};

export const ETAPE_TONS: Record<Etape, Ton> = {
  Nouveau: "teal",
  Contacté: "neutral",
  "Rendez-vous": "orange",
  "Devis envoyé": "amber",
  Gagné: "green",
  Client: "green",
  Perdu: "red",
};

const ETIQUETTE_TONS: Record<string, Ton> = {
  Récurrent: "purple",
  Upsell: "purple",
  Recommandation: "blue",
  LinkedIn: "blue",
  Salon: "orange",
  Instagram: "red",
  "Site web": "neutral",
};

export const ETAPES_PIPELINE: Etape[] = [
  "Nouveau",
  "Contacté",
  "Rendez-vous",
  "Devis envoyé",
  "Gagné",
];

export const ETAPE_POINTS: Record<Etape, string> = {
  Nouveau: "bg-(--tag-teal-text)",
  Contacté: "bg-chip",
  "Rendez-vous": "bg-(--tag-orange-text)",
  "Devis envoyé": "bg-(--tag-amber-text)",
  Gagné: "bg-success",
  Client: "bg-success",
  Perdu: "bg-danger",
};

export type Etiquette = { libelle: string; ton: Ton };

export function etiquettes(e: Entreprise): Etiquette[] {
  return [
    { libelle: e.segment, ton: SEGMENT_TONS[e.segment] },
    { libelle: e.etape, ton: ETAPE_TONS[e.etape] },
    ...e.etiquettes.map((libelle) => ({
      libelle,
      ton: ETIQUETTE_TONS[libelle] ?? ("neutral" as Ton),
    })),
  ];
}

const BUDGET_CARACTERES = 22;

export function partagerEtiquettes(liste: Etiquette[]) {
  let pris = 0;
  const visibles: Etiquette[] = [];
  for (const e of liste) {
    if (visibles.length === 2 || pris + e.libelle.length > BUDGET_CARACTERES)
      break;
    visibles.push(e);
    pris += e.libelle.length;
  }
  if (visibles.length === 0 && liste.length > 0) visibles.push(liste[0]);
  return { visibles, cachees: liste.length - visibles.length };
}

export type Tri = "pipeline" | "nom" | "echange" | "affaires" | "chances";
export type Vue = "toutes" | "prospects" | "clients";

export const TOUS = "tous";
export const TOUTES = "toutes";

export type FiltresCrm = {
  tri: Tri;
  responsable: string;
  etape: string;
  fenetre: number;
};

export const FILTRES_DEFAUT: FiltresCrm = {
  tri: "pipeline",
  responsable: TOUS,
  etape: TOUTES,
  fenetre: 90,
};

export function nombreFiltres({ responsable, etape, fenetre }: FiltresCrm) {
  return [
    responsable !== FILTRES_DEFAUT.responsable,
    etape !== FILTRES_DEFAUT.etape,
    fenetre !== FILTRES_DEFAUT.fenetre,
  ].filter(Boolean).length;
}

export function estProspect(e: Entreprise) {
  return e.etape !== "Client";
}

export function filtrer(
  entreprises: Entreprise[],
  { tri, responsable, etape, fenetre }: FiltresCrm,
  vue: Vue = "toutes",
): Entreprise[] {
  const liste = entreprises.filter((e) => {
    if (vue === "prospects" && !estProspect(e)) return false;
    if (vue === "clients" && estProspect(e)) return false;
    if (responsable !== TOUS && e.responsable !== responsable) return false;
    if (etape !== TOUTES && e.etape !== etape) return false;
    return fenetre === 0 || joursDepuis(e.dernierEchange.date) <= fenetre;
  });
  return liste.sort((a, b) => {
    switch (tri) {
      case "nom":
        return a.nom.localeCompare(b.nom, "fr");
      case "echange":
        return b.dernierEchange.date.localeCompare(a.dernierEchange.date);
      case "affaires":
        return b.affaires - a.affaires;
      case "chances":
        return b.chances - a.chances;
      default:
        return b.pipeline - a.pipeline;
    }
  });
}

export function lignesCsv(entreprises: Entreprise[]) {
  return [
    [
      "Entreprise",
      "Segment",
      "Étape",
      "Étiquettes",
      "Responsable",
      "Ville",
      "Contact",
      "E-mail",
      "Affaires",
      "Pipeline (€ HT)",
      "Chances de signer (%)",
      "Dernier échange",
      "Date du dernier échange",
      "Suite",
    ],
    ...entreprises.map((e) => [
      e.nom,
      e.segment,
      e.etape,
      e.etiquettes.join("; "),
      e.responsable,
      e.ville ?? "",
      e.contact?.nom ?? "",
      e.contact?.email ?? "",
      e.affaires,
      e.pipeline,
      e.chances,
      e.dernierEchange.libelle,
      e.dernierEchange.date,
      e.suite,
    ]),
  ];
}

export function avancement(e: Entreprise) {
  const rang = ETAPES.indexOf(e.etape);
  if (e.etape === "Perdu") return { decouverte: 0, proposition: 0, signature: 0 };
  const decouverte = rang >= 2 ? 100 : rang === 1 ? 60 : 20;
  const proposition = rang >= 4 ? 100 : rang === 3 ? 70 : rang === 2 ? 35 : 0;
  const signature = rang >= 4 ? 100 : rang === 3 ? e.chances : 0;
  return { decouverte, proposition, signature };
}

export function activite(e: Entreprise) {
  const total = e.tendance.reduce((s, v) => s + v, 0);
  return {
    total,
    emails: Math.round(total * 0.45),
    rendezVous: Math.round(total * 0.12),
    appels: Math.round(total * 0.28),
  };
}

export function membre(equipe: Membre[], nom: string): Membre {
  return (
    equipe.find((m) => m.nom === nom) ?? {
      nom,
      role: "",
      email: "",
      telephone: "",
      ton: "neutral",
    }
  );
}
