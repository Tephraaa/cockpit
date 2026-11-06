"use client";

import { useMemo } from "react";
import Button from "@/components/_ui/button";
import CountBadge from "@/components/_ui/count-badge";
import { ScrollArea } from "@/components/_ui/scroll-area";
import PageHeader from "@/components/_common/page-header";
import CompaniesTable from "@/components/entreprises/table/companies-table";
import Kpis from "./kpis";
import ChiffreAffaires from "./chiffre-affaires";
import CarteFrance from "./carte-france";
import { estProspect } from "@/lib/cockpit";
import { useCockpit } from "@/stores/cockpit-store";
import PlusIcon from "@/public/assets/images/_common/plus.svg";

export default function TableauDeBord() {
  const tableau = useCockpit((state) => state.tableau);
  const crm = useCockpit((state) => state.crm);
  const erreur = useCockpit((state) => state.erreur);
  const setNewCompanyOpen = useCockpit((state) => state.setNewCompanyOpen);

  const leads = useMemo(
    () =>
      (crm?.entreprises ?? [])
        .filter((e) => estProspect(e) && e.etape !== "Perdu")
        .sort((a, b) => b.pipeline - a.pipeline),
    [crm],
  );

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      <PageHeader title="Tableau de bord" />
      <ScrollArea className="border-border min-h-0 flex-1 border-t">
        {erreur && !tableau && (
          <p className="caption-style text-danger border-border border-b px-4 py-3">
            Cockpit n&apos;arrive pas à lire tes données : {erreur}
          </p>
        )}
        <Kpis kpis={tableau?.kpis ?? null} serie={tableau?.series.find((s) => s.periode === "12m")} />
        <div className="grid gap-px border-t border-border bg-background p-px xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <ChiffreAffaires series={tableau?.series ?? null} />
          <CarteFrance
            regions={tableau?.regions ?? null}
            clientsActifs={tableau?.clientsActifs ?? 0}
            nouveaux={tableau?.nouveauxClients ?? 0}
          />
        </div>
        <div className="border-border flex flex-wrap items-center justify-between gap-2 border-t px-4 py-4">
          <div className="flex items-center gap-2">
            <h2>Leads</h2>
            {crm && <CountBadge>{leads.length}</CountBadge>}
            <span className="caption-style text-subtle hidden sm:inline">
              tes prospects en cours, du premier contact à la signature
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="sm" href="/entreprises">
              Voir le CRM
            </Button>
            <Button variant="primary" size="sm" onClick={() => setNewCompanyOpen(true)}>
              <PlusIcon aria-hidden className="size-3" />
              Nouveau lead
            </Button>
          </div>
        </div>
        <CompaniesTable
          entreprises={leads}
          selectable={false}
          scroll={false}
          empty={crm ? "Aucun prospect en cours : ajoute ton premier lead." : "Chargement du CRM…"}
        />
      </ScrollArea>
    </section>
  );
}
