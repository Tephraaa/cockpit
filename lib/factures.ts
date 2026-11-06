import type { Ton } from "@/server/crm-types";
import type { LigneFacture, StatutFacture } from "@/server/types";
import { joursAvant } from "@/lib/format";

export const STATUTS: Record<StatutFacture, { libelle: string; ton: Ton }> = {
  payee: { libelle: "Payée", ton: "green" },
  partielle: { libelle: "Partielle", ton: "amber" },
  a_venir: { libelle: "À venir", ton: "yellow" },
  en_retard: { libelle: "En retard", ton: "red" },
  brouillon: { libelle: "Brouillon", ton: "neutral" },
};

export function enRetard(f: LigneFacture) {
  return (
    f.statut === "en_retard" ||
    (f.statut === "partielle" && (joursAvant(f.echeance) ?? 0) < 0)
  );
}

export function lignesCsvFactures(factures: LigneFacture[]) {
  return [
    ["Numéro", "Client", "Statut", "Émise le", "Échéance", "Montant TTC (€)", "Reste dû (€)"],
    ...factures.map((f) => [
      f.numero || "Brouillon",
      f.client,
      STATUTS[f.statut].libelle,
      f.date ?? "",
      f.echeance ?? "",
      f.montant.toFixed(2),
      f.restant.toFixed(2),
    ]),
  ];
}
