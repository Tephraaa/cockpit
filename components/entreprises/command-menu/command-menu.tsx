"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  Kbd,
} from "@/components/_ui/command";
import Tag from "@/components/_ui/tag";
import { CommandCompanyRow, CommandTableHeader } from "./command-table";
import { membre } from "@/lib/cockpit";
import { STATUTS } from "@/lib/factures";
import { euros, jourCourt } from "@/lib/format";
import { useCockpit } from "@/stores/cockpit-store";
import PlusIcon from "@/public/assets/images/_common/plus.svg";
import WalletIcon from "@/public/assets/images/companies/sidebar/wallet.svg";

const VIDE: never[] = [];

export default function CommandMenu() {
  const router = useRouter();
  const open = useCockpit((state) => state.searchOpen);
  const setOpen = useCockpit((state) => state.setSearchOpen);
  const crm = useCockpit((state) => state.crm);
  const factures = useCockpit((state) => state.tableau?.factures) ?? VIDE;
  const openDetail = useCockpit((state) => state.openDetail);
  const setNewCompanyOpen = useCockpit((state) => state.setNewCompanyOpen);
  const ouvrirFacture = useCockpit((state) => state.ouvrirFacture);
  const [query, setQuery] = useState("");
  const actionRan = useRef(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "k") return;
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) {
        return;
      }
      event.preventDefault();
      const { searchOpen, setSearchOpen } = useCockpit.getState();
      setSearchOpen(!searchOpen);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function run(action: () => void) {
    actionRan.current = true;
    setOpen(false);
    action();
  }

  const parPennylane = (id: number | null) =>
    crm?.entreprises.find((e) => e.pennylaneId === id);

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Rechercher"
      description="Cherche une entreprise, une personne, une étape ou une facture"
      className="max-w-[960px]"
      onCloseAutoFocus={(event) => {
        if (actionRan.current) event.preventDefault();
        actionRan.current = false;
        setQuery("");
      }}
    >
      <Command>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Entreprises, responsables, étapes, factures…"
          trailing={<Kbd>Échap</Kbd>}
        />
        <CommandTableHeader />
        <CommandList>
          <CommandEmpty>Aucun résultat pour « {query} »</CommandEmpty>
          <CommandGroup>
            {(crm?.entreprises ?? []).map((e) => (
              <CommandCompanyRow
                key={e.id}
                company={e}
                owner={membre(crm!.equipe, e.responsable)}
                onSelect={() => run(() => openDetail(e.id))}
              />
            ))}
          </CommandGroup>
          {query.trim().length > 0 && factures.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Factures">
                {factures.slice(0, 200).map((f) => (
                  <CommandItem
                    key={f.id}
                    value={`facture-${f.id}`}
                    keywords={[f.numero, f.client, STATUTS[f.statut].libelle]}
                    onSelect={() =>
                      run(() => {
                        const e = parPennylane(f.clientId);
                        if (e) openDetail(e.id);
                        else router.push("/factures");
                      })
                    }
                    className="h-11 justify-between"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="bg-muted flex size-6 shrink-0 items-center justify-center rounded-md shadow-[0px_0px_0px_1px_#232323]">
                        <WalletIcon aria-hidden className="text-soft size-3" />
                      </span>
                      <span className="tabular-nums">{f.numero || "Brouillon"}</span>
                      <span className="text-soft truncate">{f.client}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 tabular-nums">
                      <span className="caption-style text-subtle hidden sm:inline">
                        {jourCourt(f.date)}
                      </span>
                      {euros(f.montant, true)}
                      <Tag tone={STATUTS[f.statut].ton} size="sm">
                        {STATUTS[f.statut].libelle}
                      </Tag>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem
              value="nouvelle-entreprise"
              keywords={["Nouvelle entreprise", "Ajouter", "Créer", "Lead", "Prospect"]}
              onSelect={() => run(() => setNewCompanyOpen(true))}
            >
              <span className="bg-muted flex size-6 shrink-0 items-center justify-center rounded-md shadow-[0px_0px_0px_1px_#232323]">
                <PlusIcon aria-hidden className="text-soft size-3" />
              </span>
              Nouvelle entreprise
            </CommandItem>
            <CommandItem
              value="generer-facture"
              keywords={["Générer une facture", "Facturer", "Pennylane"]}
              onSelect={() => run(() => ouvrirFacture())}
            >
              <span className="bg-muted flex size-6 shrink-0 items-center justify-center rounded-md shadow-[0px_0px_0px_1px_#232323]">
                <WalletIcon aria-hidden className="text-soft size-3" />
              </span>
              Générer une facture
            </CommandItem>
          </CommandGroup>
        </CommandList>
        <CommandFooter>
          <span className="flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            Naviguer
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>↵</Kbd>
            Ouvrir
          </span>
        </CommandFooter>
      </Command>
    </CommandDialog>
  );
}
