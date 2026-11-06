"use client";

import type { MouseEvent } from "react";
import Avatar from "@/components/_ui/avatar";
import Button from "@/components/_ui/button";
import { Checkbox } from "@/components/_ui/checkbox";
import Tag from "@/components/_ui/tag";
import { TableCell, TableRow } from "@/components/_ui/table";
import SegmentBar from "@/components/_common/segment-bar";
import Sparkline from "@/components/_common/sparkline";
import { etiquettes, partagerEtiquettes } from "@/lib/cockpit";
import { jourCourt, nombre } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Entreprise, Membre } from "@/server/crm-types";
import {
  TABLE_CELL_CLASS,
  TABLE_ROW_CLASS,
  columnClass,
  type TableColumnKey,
} from "./table-columns";
import CalendarIcon from "@/public/assets/images/_common/calendar.svg";
import DotsIcon from "@/public/assets/images/companies/table/dots-horizontal.svg";

type CompanyRowProps = {
  company: Entreprise;
  index?: number;
  owner: Membre;
  selected: boolean;
  active: boolean;
  selectable?: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onOpenOwner: () => void;
};

function cellClass(key: TableColumnKey) {
  return cn(TABLE_CELL_CLASS, columnClass(key));
}

function stop(event: MouseEvent) {
  event.stopPropagation();
}

export default function CompanyRow({
  company,
  index = 0,
  owner,
  selected,
  active,
  selectable = true,
  onToggle,
  onOpen,
  onOpenOwner,
}: CompanyRowProps) {
  const { visibles, cachees } = partagerEtiquettes(etiquettes(company));

  return (
    <TableRow
      role="row"
      onClick={onOpen}
      data-active={active || selected}
      className={cn(
        TABLE_ROW_CLASS,
        "hover:bg-card/60 data-[active=true]:border-card data-[active=true]:bg-card cursor-pointer",
      )}
    >
      <TableCell role="cell" className={cellClass("name")}>
        <span className="flex items-center gap-5">
          {selectable && (
            <Checkbox
              checked={selected}
              onCheckedChange={onToggle}
              onClick={stop}
              aria-label={`Sélectionner ${company.nom}`}
            />
          )}
          <span className="max-w-[200px] truncate" title={company.nom}>
            {company.nom}
          </span>
        </span>
      </TableCell>
      <TableCell role="cell" className={cellClass("segment")}>
        <span className="flex items-center gap-[3px]">
          {visibles.map((tag) => (
            <Tag key={tag.libelle} tone={tag.ton}>
              {tag.libelle}
            </Tag>
          ))}
          {cachees > 0 && (
            <Tag tone="neutral" size="sm">
              +{cachees}
            </Tag>
          )}
        </span>
      </TableCell>
      <TableCell role="cell" className={cellClass("owner")} onClick={stop}>
        <Button
          variant="ghost"
          size="none"
          onClick={onOpenOwner}
          aria-label={`Ouvrir le profil de ${owner.nom}`}
          className="text-foreground -mx-1.5 gap-1.5 px-1.5 py-1 font-normal"
        >
          <Avatar nom={owner.nom} ton={owner.ton} />
          {owner.nom}
        </Button>
      </TableCell>
      <TableCell role="cell" className={cellClass("openDeals")}>
        {company.affaires}
      </TableCell>
      <TableCell role="cell" className={cellClass("pipelineValue")}>
        <span className="flex items-center gap-1">
          {nombre(company.pipeline)}
          <span className="text-muted-foreground">€</span>
        </span>
      </TableCell>
      <TableCell role="cell" className={cellClass("winProbability")}>
        <span className="flex items-center gap-2">
          <SegmentBar
            percent={company.chances}
            className="w-[74px]"
            anime={{ delai: 150 + index * 45, pas: 16 }}
          />
          <span className="w-[4ch] text-right">{company.chances} %</span>
        </span>
      </TableCell>
      <TableCell role="cell" className={cellClass("trend")}>
        <Sparkline
          values={company.tendance}
          anime={{ delai: 150 + index * 45, pas: 20 }}
        />
      </TableCell>
      <TableCell role="cell" className={cellClass("lastInteraction")}>
        <span className="flex items-center gap-1">
          <CalendarIcon
            aria-hidden
            className="text-foreground size-3.5 shrink-0"
          />
          <span className="tabular-nums">
            {jourCourt(company.dernierEchange.date)}
          </span>
          <span aria-hidden className="mx-[3px] h-2 w-px bg-white/15" />
          {company.dernierEchange.libelle}
        </span>
      </TableCell>
      <TableCell role="cell" className={cellClass("action")} onClick={stop}>
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn("text-foreground", active && "bg-white/6")}
          aria-label={`Ouvrir la fiche de ${company.nom}`}
          onClick={onOpen}
        >
          <DotsIcon aria-hidden className="size-3" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
