"use client";

import type { ReactNode } from "react";
import Avatar from "@/components/_ui/avatar";
import Button from "@/components/_ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/_ui/tabs";
import Notifications from "@/components/_common/notifications";
import { membre } from "@/lib/cockpit";
import { useCockpit } from "@/stores/cockpit-store";
import MenuIcon from "@/public/assets/images/_common/menu.svg";
import ActiveDot from "@/public/assets/images/companies/header/active-dot.svg";
import SearchIcon from "@/public/assets/images/_common/search.svg";

type Onglet = { value: string; label: string };

type PageHeaderProps = {
  title: string;
  pill?: ReactNode;
  tabs?: Onglet[];
  tab?: string;
  onTab?: (value: string) => void;
};

export function StatutPennylane() {
  const mode = useCockpit((state) => state.tableau?.mode);
  const erreur = useCockpit((state) => state.erreur);
  return (
    <span
      className="caption-style bg-muted inline-flex shrink-0 items-center gap-0.5 rounded-full border border-[#363636] py-[3px] pr-[5px] pl-[3px]"
      title={
        erreur
          ? erreur
          : mode === "demo"
            ? "Branché sur le faux Pennylane de la démo"
            : "Branché sur ton compte Pennylane"
      }
    >
      {erreur ? (
        <span aria-hidden className="flex size-3 items-center justify-center">
          <span className="bg-danger size-1.5 rounded-full" />
        </span>
      ) : (
        <ActiveDot aria-hidden className="size-3" />
      )}
      {erreur ? "Hors ligne" : mode === "pennylane" ? "Pennylane" : "Démo"}
    </span>
  );
}

export default function PageHeader({
  title,
  pill,
  tabs,
  tab,
  onTab,
}: PageHeaderProps) {
  const crm = useCockpit((state) => state.crm);
  const setSidebarOpen = useCockpit((state) => state.setSidebarOpen);
  const setSearchOpen = useCockpit((state) => state.setSearchOpen);
  const openProfile = useCockpit((state) => state.openProfile);
  const moi = crm ? membre(crm.equipe, crm.moi) : null;

  return (
    <header className="shrink-0">
      <div className="flex items-center justify-between gap-2 px-4 py-[14px]">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="lg:hidden"
            aria-label="Ouvrir le menu"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon aria-hidden className="size-3.5" />
          </Button>
          <h1 className="truncate">{title}</h1>
          {pill ?? <StatutPennylane />}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            aria-label="Rechercher"
            aria-keyshortcuts="Meta+K Control+K"
            onClick={() => setSearchOpen(true)}
          >
            <SearchIcon aria-hidden className="size-3.5" />
          </Button>
          <Notifications />
          {moi && (
            <Button
              variant="secondary"
              size="none"
              className="caption-style h-[30px] gap-1.5 py-[5px] pr-[7px] pl-[5px] font-normal"
              aria-label={`Ouvrir le profil de ${moi.nom}`}
              onClick={() => openProfile(moi.nom)}
            >
              <Avatar nom={moi.nom} ton={moi.ton} />
              <span className="hidden sm:inline">{moi.nom}</span>
            </Button>
          )}
        </div>
      </div>

      {tabs && (
        <Tabs value={tab} onValueChange={onTab}>
          <TabsList className="border-border border-b px-4">
            {tabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
    </header>
  );
}
