"use client";

import { Checkbox } from "@/components/_ui/checkbox";
import { ScrollArea } from "@/components/_ui/scroll-area";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/_ui/table";
import CompanyRow from "./company-row";
import TableFooter from "./table-footer";
import {
  TABLE_CELL_CLASS,
  TABLE_COLUMNS,
  TABLE_GRID_CLASS,
  TABLE_ROW_CLASS,
} from "./table-columns";
import { membre } from "@/lib/cockpit";
import { cn } from "@/lib/utils";
import type { Entreprise } from "@/server/crm-types";
import { useCockpit } from "@/stores/cockpit-store";

const VIDE: never[] = [];

type CompaniesTableProps = {
  entreprises: Entreprise[];
  selectable?: boolean;
  footer?: boolean;
  scroll?: boolean;
  empty?: string;
  className?: string;
};

export default function CompaniesTable({
  entreprises,
  selectable = true,
  footer = true,
  scroll = true,
  empty = "Aucune entreprise ne correspond à ces filtres.",
  className,
}: CompaniesTableProps) {
  const equipe = useCockpit((state) => state.crm?.equipe) ?? VIDE;
  const selectedIds = useCockpit((state) => state.selectedIds);
  const detailId = useCockpit((state) => state.detailId);
  const detailOpen = useCockpit((state) => state.detailOpen);
  const toggleSelected = useCockpit((state) => state.toggleSelected);
  const setSelected = useCockpit((state) => state.setSelected);
  const openDetail = useCockpit((state) => state.openDetail);
  const openProfile = useCockpit((state) => state.openProfile);

  const selectedVisible = entreprises.filter((e) => selectedIds.includes(e.id));
  const allSelected =
    entreprises.length > 0 && selectedVisible.length === entreprises.length;
  const someSelected = selectedVisible.length > 0 && !allSelected;

  function toggleAll() {
    setSelected(allSelected ? [] : entreprises.map((e) => e.id));
  }

  const table = (
    <Table role="table" className={cn(TABLE_GRID_CLASS, "w-full")}>
      <TableHeader role="rowgroup" className="contents">
        <TableRow role="row" className={TABLE_ROW_CLASS}>
          {TABLE_COLUMNS.map((column) => (
            <TableHead
              key={column.key}
              role="columnheader"
              className={cn(TABLE_CELL_CLASS, column.className)}
            >
              {column.key === "name" && selectable ? (
                <span className="flex items-center gap-5">
                  <Checkbox
                    checked={
                      allSelected ? true : someSelected ? "indeterminate" : false
                    }
                    onCheckedChange={toggleAll}
                    aria-label="Tout sélectionner"
                  />
                  {column.label}
                </span>
              ) : (
                column.label
              )}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody role="rowgroup" className="contents">
        {entreprises.map((e, i) => (
          <CompanyRow
            key={e.id}
            index={i}
            company={e}
            owner={membre(equipe, e.responsable)}
            selectable={selectable}
            selected={selectedIds.includes(e.id)}
            active={detailOpen && detailId === e.id}
            onToggle={() => toggleSelected(e.id)}
            onOpen={() => openDetail(e.id)}
            onOpenOwner={() => openProfile(e.responsable)}
          />
        ))}
        {entreprises.length === 0 && (
          <TableRow role="row" className={TABLE_ROW_CLASS}>
            <td
              role="cell"
              className="caption-style text-muted-foreground col-span-full flex h-[120px] items-center justify-center"
            >
              {empty}
            </td>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div
      className={cn(
        "border-border flex min-h-0 flex-col border-t",
        scroll && "flex-1",
        className,
      )}
    >
      {scroll ? (
        <ScrollArea orientation="both" className="min-h-0 flex-1">
          {table}
        </ScrollArea>
      ) : (
        <ScrollArea orientation="horizontal">{table}</ScrollArea>
      )}
      {footer && <TableFooter entreprises={entreprises} />}
    </div>
  );
}
