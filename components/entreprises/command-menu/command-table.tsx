"use client";

import { useCommandState } from "cmdk";
import Avatar from "@/components/_ui/avatar";
import { CommandItem } from "@/components/_ui/command";
import Tag from "@/components/_ui/tag";
import SegmentBar from "@/components/_common/segment-bar";
import { etiquettes, partagerEtiquettes } from "@/lib/cockpit";
import { jourCourt, nombre } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Entreprise, Membre } from "@/server/crm-types";
import CalendarIcon from "@/public/assets/images/_common/calendar.svg";

export const COMMAND_TABLE_GRID =
  "grid grid-cols-[minmax(0,1fr)_96px] gap-x-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,1fr)_96px] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.5fr)_minmax(0,1.1fr)_96px_120px_minmax(0,1fr)]";

const HEADERS = [
  { label: "Entreprise", className: "" },
  { label: "Segment et étape", className: "hidden md:block" },
  { label: "Responsable", className: "hidden md:block" },
  { label: "Pipeline", className: "text-right" },
  { label: "Chances", className: "hidden text-right lg:block" },
  { label: "Dernier échange", className: "hidden lg:block" },
];

export function CommandTableHeader() {
  const count = useCommandState((state) => state.filtered.count);

  if (count === 0) return null;

  return (
    <div
      aria-hidden
      className={cn(
        COMMAND_TABLE_GRID,
        "caption-style border-line-strong text-subtle h-9 items-center border-b px-4",
      )}
    >
      {HEADERS.map((header) => (
        <span key={header.label} className={cn("truncate", header.className)}>
          {header.label}
        </span>
      ))}
    </div>
  );
}

type CommandCompanyRowProps = {
  company: Entreprise;
  owner: Membre;
  onSelect: () => void;
};

export function CommandCompanyRow({
  company,
  owner,
  onSelect,
}: CommandCompanyRowProps) {
  const liste = etiquettes(company);
  const { visibles, cachees } = partagerEtiquettes(liste);

  return (
    <CommandItem
      value={company.id}
      keywords={[
        company.nom,
        company.responsable,
        company.ville ?? "",
        company.contact?.nom ?? "",
        ...liste.map((t) => t.libelle),
      ]}
      onSelect={onSelect}
      className={cn(COMMAND_TABLE_GRID, "text-foreground h-11 gap-x-4")}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span className="bg-muted flex size-6 shrink-0 items-center justify-center rounded-md shadow-[0px_0px_0px_1px_#232323]">
          <span className="caption-style text-soft">{company.nom.slice(0, 1)}</span>
        </span>
        <span className="truncate">{company.nom}</span>
      </span>

      <span className="hidden min-w-0 items-center gap-[3px] overflow-hidden md:flex">
        {visibles.map((tag) => (
          <Tag key={tag.libelle} tone={tag.ton} size="sm">
            {tag.libelle}
          </Tag>
        ))}
        {cachees > 0 && (
          <Tag tone="neutral" size="sm">
            +{cachees}
          </Tag>
        )}
      </span>

      <span className="text-soft hidden min-w-0 items-center gap-1.5 md:flex">
        <Avatar nom={owner.nom} ton={owner.ton} />
        <span className="truncate">{owner.nom}</span>
      </span>

      <span className="flex items-center justify-end gap-1 tabular-nums">
        {nombre(company.pipeline)}
        <span className="text-muted-foreground">€</span>
      </span>

      <span className="hidden items-center justify-end gap-2 tabular-nums lg:flex">
        <SegmentBar percent={company.chances} className="w-[60px]" />
        <span className="w-[4ch] text-right">{company.chances} %</span>
      </span>

      <span className="text-soft hidden min-w-0 items-center gap-1 lg:flex">
        <CalendarIcon aria-hidden className="size-3.5 shrink-0" />
        <span className="shrink-0 tabular-nums">
          {jourCourt(company.dernierEchange.date)}
        </span>
        <span aria-hidden className="mx-[3px] h-2 w-px shrink-0 bg-white/15" />
        <span className="truncate">{company.dernierEchange.libelle}</span>
      </span>
    </CommandItem>
  );
}
