"use client";

import { useMemo, useState } from "react";
import Avatar from "@/components/_ui/avatar";
import Button from "@/components/_ui/button";
import CountBadge from "@/components/_ui/count-badge";
import Field from "@/components/_ui/field";
import { ScrollArea } from "@/components/_ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/_ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/_ui/sheet";
import {
  ACTIVITY_OPTIONS,
  SORT_MENU_OPTIONS,
  STAGE_OPTIONS,
  ownerOptions,
} from "./filter-options";
import {
  FILTRES_DEFAUT,
  TOUS,
  filtrer,
  membre,
  nombreFiltres,
  type Tri,
} from "@/lib/cockpit";
import { cn } from "@/lib/utils";
import { useCockpit } from "@/stores/cockpit-store";
import FilterIcon from "@/public/assets/images/_common/filter.svg";
import XIcon from "@/public/assets/images/companies/detail/x.svg";

type MobileFiltersProps = {
  className?: string;
};

export default function MobileFilters({ className }: MobileFiltersProps) {
  const [open, setOpen] = useState(false);
  const crm = useCockpit((state) => state.crm);
  const vue = useCockpit((state) => state.vue);
  const filtres = useCockpit((state) => state.filtres);
  const setFiltres = useCockpit((state) => state.setFiltres);
  const resetFiltres = useCockpit((state) => state.resetFiltres);
  const equipe = crm?.equipe ?? [];

  const actifs = nombreFiltres(filtres);
  const resultats = useMemo(
    () => filtrer(crm?.entreprises ?? [], filtres, vue).length,
    [crm, filtres, vue],
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label={actifs > 0 ? `Filtres, ${actifs} actifs` : "Filtres"}
        className={cn("data-[active=true]:bg-muted", className)}
        data-active={actifs > 0}
      >
        <FilterIcon aria-hidden className="size-3" />
        Filtres
        {actifs > 0 && <CountBadge>{actifs}</CountBadge>}
      </Button>

      <SheetContent side="bottom">
        <SheetHeader className="px-4">
          <SheetTitle>Filtres</SheetTitle>
          <SheetDescription className="sr-only">
            Trier et filtrer le tableau des entreprises
          </SheetDescription>
          <SheetClose asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="-mr-1"
              aria-label="Fermer les filtres"
            >
              <XIcon aria-hidden className="text-foreground size-4" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <ScrollArea viewportClassName="max-h-[calc(85dvh-118px)]">
          <div className="flex flex-col gap-4 p-4">
            <Field label="Trier par" htmlFor="mobile-tri">
              <Select
                value={filtres.tri}
                onValueChange={(value) => setFiltres({ tri: value as Tri })}
              >
                <SelectTrigger id="mobile-tri">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_MENU_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Responsable" htmlFor="mobile-responsable">
              <Select
                value={filtres.responsable}
                onValueChange={(responsable) => setFiltres({ responsable })}
              >
                <SelectTrigger id="mobile-responsable">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ownerOptions(equipe).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.value === TOUS ? (
                        option.label
                      ) : (
                        <span className="flex items-center gap-2">
                          <Avatar
                            nom={option.value}
                            ton={membre(equipe, option.value).ton}
                          />
                          {option.label}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Étape" htmlFor="mobile-etape">
              <Select
                value={filtres.etape}
                onValueChange={(etape) => setFiltres({ etape })}
              >
                <SelectTrigger id="mobile-etape">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Dernier échange" htmlFor="mobile-fenetre">
              <Select
                value={String(filtres.fenetre)}
                onValueChange={(value) => setFiltres({ fenetre: Number(value) })}
              >
                <SelectTrigger id="mobile-fenetre">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </ScrollArea>

        <SheetFooter className="px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFiltres}
            disabled={actifs === 0 && filtres.tri === FILTRES_DEFAUT.tri}
            className="-ml-1.5"
          >
            Réinitialiser
          </Button>
          <SheetClose asChild>
            <Button variant="primary" size="sm">
              Voir {resultats} {resultats > 1 ? "entreprises" : "entreprise"}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
