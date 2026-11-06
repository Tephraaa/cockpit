"use client";

import Button from "@/components/_ui/button";
import Tag from "@/components/_ui/tag";
import DetailSection from "./detail-section";
import { STATUTS } from "@/lib/factures";
import { euros, jourCourt } from "@/lib/format";
import type { Entreprise } from "@/server/crm-types";
import { useCockpit } from "@/stores/cockpit-store";
import WalletIcon from "@/public/assets/images/companies/sidebar/wallet.svg";

export default function PennylaneSection({ company }: { company: Entreprise }) {
  const tableau = useCockpit((state) => state.tableau);
  const ouvrirFacture = useCockpit((state) => state.ouvrirFacture);

  const client = tableau?.clients.find((c) => c.id === company.pennylaneId);
  const factures = (tableau?.factures ?? [])
    .filter((f) => f.clientId === company.pennylaneId)
    .slice(0, 5);

  if (!company.pennylaneId || !client) {
    return (
      <DetailSection title="Pennylane">
        <p className="text-soft">
          {company.etape === "Gagné"
            ? `${company.nom} a signé : crée-la comme client dans Pennylane, et sa fiche affichera ses factures ici.`
            : "Pas encore client dans Pennylane. Dès qu'elle y sera, ses factures apparaîtront ici."}
        </p>
      </DetailSection>
    );
  }

  const stats = [
    { label: "Facturé, 12 mois", value: euros(client.ca12), detail: "HT" },
    { label: "Réglé", value: euros(client.regle), detail: "TTC" },
    { label: "À encaisser", value: euros(client.aEncaisser), detail: "TTC" },
    {
      label: "En retard",
      value: euros(client.enRetard),
      detail: client.nbRetard ? `${client.nbRetard} facture${client.nbRetard > 1 ? "s" : ""}` : "aucune",
    },
  ];

  return (
    <DetailSection
      title="Pennylane"
      action={
        <Button variant="primary" size="sm" onClick={() => ouvrirFacture(client.id)}>
          <WalletIcon aria-hidden className="size-3" />
          Générer une facture
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col gap-3 rounded-lg border border-line-strong p-[11px]"
          >
            <span className="caption-style text-soft">{s.label}</span>
            <span className="flex flex-col gap-1">
              <span className="lead-style block tabular-nums">{s.value}</span>
              <span className="caption-style text-subtle block">{s.detail}</span>
            </span>
          </div>
        ))}
      </div>
      {factures.length > 0 && (
        <ul className="flex flex-col">
          {factures.map((f) => (
            <li
              key={f.id}
              className="border-line-strong flex items-center justify-between gap-3 border-b py-2.5 last:border-b-0"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="tabular-nums">{f.numero || "Brouillon"}</span>
                <span className="caption-style text-subtle">{jourCourt(f.date)}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="tabular-nums">{euros(f.montant, true)}</span>
                <Tag tone={STATUTS[f.statut].ton} size="sm">
                  {STATUTS[f.statut].libelle}
                </Tag>
              </span>
            </li>
          ))}
        </ul>
      )}
    </DetailSection>
  );
}
