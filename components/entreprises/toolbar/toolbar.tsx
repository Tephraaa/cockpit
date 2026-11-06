"use client";

import Button from "@/components/_ui/button";
import FilterMenu from "@/components/_common/filter-menu";
import MobileFilters from "./mobile-filters";
import {
  ACTIVITY_OPTIONS,
  SORT_MENU_OPTIONS,
  STAGE_OPTIONS,
  ownerOptions,
} from "./filter-options";
import { filtrer, lignesCsv, type Tri } from "@/lib/cockpit";
import { downloadCsv } from "@/lib/csv";
import { aujourdhui } from "@/lib/format";
import { useCockpit } from "@/stores/cockpit-store";
import ShareIcon from "@/public/assets/images/companies/toolbar/share.svg";
import PlusIcon from "@/public/assets/images/_common/plus.svg";

const VIDE: never[] = [];

export default function CompaniesToolbar() {
  const filtres = useCockpit((state) => state.filtres);
  const setFiltres = useCockpit((state) => state.setFiltres);
  const equipe = useCockpit((state) => state.crm?.equipe) ?? VIDE;
  const setNewCompanyOpen = useCockpit((state) => state.setNewCompanyOpen);

  function exporter() {
    const { crm, vue } = useCockpit.getState();
    const visibles = filtrer(crm?.entreprises ?? [], filtres, vue);
    downloadCsv(`entreprises-${aujourdhui()}.csv`, lignesCsv(visibles));
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-4 py-4">
      <MobileFilters className="sm:hidden" />

      <div className="hidden min-w-0 flex-wrap gap-2 sm:flex">
        <FilterMenu
          label="Trier par"
          value={filtres.tri}
          options={SORT_MENU_OPTIONS}
          onChange={(value) => setFiltres({ tri: value as Tri })}
        />
        <FilterMenu
          label="Responsable"
          value={filtres.responsable}
          options={ownerOptions(equipe)}
          onChange={(responsable) => setFiltres({ responsable })}
        />
        <FilterMenu
          label="Étape"
          value={filtres.etape}
          options={STAGE_OPTIONS}
          onChange={(etape) => setFiltres({ etape })}
        />
        <FilterMenu
          label="Dernier échange"
          value={String(filtres.fenetre)}
          options={ACTIVITY_OPTIONS}
          onChange={(value) => setFiltres({ fenetre: Number(value) })}
        />
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button variant="secondary" size="sm" onClick={exporter}>
          <ShareIcon aria-hidden className="size-3" />
          Exporter
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setNewCompanyOpen(true)}
        >
          <PlusIcon aria-hidden className="size-3" />
          Nouvelle entreprise
        </Button>
      </div>
    </div>
  );
}
