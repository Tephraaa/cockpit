"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RefreshCw, RotateCcw } from "lucide-react";
import Avatar from "@/components/_ui/avatar";
import Button from "@/components/_ui/button";
import { ScrollArea } from "@/components/_ui/scroll-area";
import SidebarNavItem from "./sidebar-nav-item";
import SidebarSection from "./sidebar-section";
import { api } from "@/lib/api";
import { ETAPE_POINTS, ETAPES_PIPELINE } from "@/lib/cockpit";
import { cn } from "@/lib/utils";
import { TACHES } from "@/data/mission";
import { RDV } from "@/data/agenda";
import { useCockpit } from "@/stores/cockpit-store";
import Logo from "@/public/assets/images/_common/logo.svg";
import BuildingIcon from "@/public/assets/images/companies/sidebar/building.svg";
import ClipboardIcon from "@/public/assets/images/companies/sidebar/clipboard.svg";
import BarChartIcon from "@/public/assets/images/companies/sidebar/bar-chart-10.svg";
import ListIcon from "@/public/assets/images/companies/sidebar/list.svg";
import TargetIcon from "@/public/assets/images/companies/sidebar/target-05.svg";
import WalletIcon from "@/public/assets/images/companies/sidebar/wallet.svg";
import CalendarIcon from "@/public/assets/images/_common/calendar.svg";

const LIENS = [
  { href: "/", label: "Tableau de bord", icon: BarChartIcon },
  { href: "/mission", label: "Mission control", icon: TargetIcon },
  { href: "/entreprises", label: "Entreprises", icon: BuildingIcon },
  { href: "/affaires", label: "Affaires", icon: ClipboardIcon },
  { href: "/factures", label: "Factures", icon: WalletIcon },
  { href: "/agenda", label: "Agenda", icon: CalendarIcon },
  { href: "/taches", label: "Tâches", icon: ListIcon },
] as const;

export default function SidebarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const tableau = useCockpit((state) => state.tableau);
  const crm = useCockpit((state) => state.crm);
  const charger = useCockpit((state) => state.charger);
  const toast = useCockpit((state) => state.toast);
  const openProfile = useCockpit((state) => state.openProfile);
  const setFiltres = useCockpit((state) => state.setFiltres);
  const setVue = useCockpit((state) => state.setVue);
  const ouvrirFacture = useCockpit((state) => state.ouvrirFacture);
  const setSidebarOpen = useCockpit((state) => state.setSidebarOpen);
  const filtres = useCockpit((state) => state.filtres);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  const entreprises = crm?.entreprises ?? [];
  const retards = (tableau?.factures ?? []).filter(
    (f) => f.statut === "en_retard",
  ).length;
  const counts: Record<string, number | undefined> = {
    "/entreprises": crm ? entreprises.length : undefined,
    "/affaires": crm
      ? entreprises.filter((e) => ETAPES_PIPELINE.includes(e.etape)).length
      : undefined,
    "/factures": tableau && retards > 0 ? retards : undefined,
    "/agenda": RDV.filter((r) => r.j === 0).length,
    "/taches": TACHES.filter((t) => t.etat === "a_faire").length,
  };

  const objectif = tableau?.objectif;
  const atteint =
    objectif && objectif.cible > 0
      ? Math.round((objectif.montant / objectif.cible) * 100)
      : null;

  async function reinitialiser() {
    await api.reinitialiserDemo();
    await charger(true);
    router.push("/");
    toast({
      ton: "info",
      titre: "Démo réinitialisée",
      texte: "Maison Orée repart de ses factures et de son CRM de départ.",
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-sidebar-border bg-sidebar-accent flex shrink-0 items-center gap-2 border-b p-3">
        <Logo aria-hidden className="size-8 shrink-0 overflow-visible" />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="lead-style block truncate font-medium tracking-[-0.01em]">
            Cockpit
          </span>
          <span className="caption-style text-subtle block truncate">
            {tableau?.entreprise ?? "Mission control"}
          </span>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <nav aria-label="Pages">
          <SidebarSection className="border-sidebar-border border-b">
            {LIENS.map((lien) => (
              <SidebarNavItem
                key={lien.href}
                icon={lien.icon}
                label={lien.label}
                href={lien.href}
                count={counts[lien.href]}
                active={
                  lien.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(lien.href)
                }
              />
            ))}
          </SidebarSection>

          {crm && (
            <SidebarSection
              title="Équipe"
              className="border-sidebar-border border-b"
            >
              {crm.equipe.map((m) => (
                <SidebarNavItem
                  key={m.nom}
                  mark={<Avatar nom={m.nom} ton={m.ton} className="size-3.5 text-[6.5px]" />}
                  label={m.nom}
                  onClick={() => openProfile(m.nom)}
                />
              ))}
            </SidebarSection>
          )}

          <SidebarSection title="Pipeline">
            {ETAPES_PIPELINE.map((etape) => (
              <SidebarNavItem
                key={etape}
                mark={
                  <span
                    aria-hidden
                    className="flex size-3.5 shrink-0 items-center justify-center"
                  >
                    <span className={cn("size-1.5 rounded-full", ETAPE_POINTS[etape])} />
                  </span>
                }
                label={etape}
                count={crm ? entreprises.filter((e) => e.etape === etape).length : undefined}
                active={pathname.startsWith("/entreprises") && filtres.etape === etape}
                onClick={() => {
                  setVue("prospects");
                  setFiltres({ etape, fenetre: 0 });
                  router.push("/entreprises");
                }}
              />
            ))}
          </SidebarSection>
        </nav>
      </ScrollArea>

      <SidebarSection className="border-sidebar-border shrink-0 border-t border-b">
        <SidebarNavItem
          icon={RefreshCw}
          label="Actualiser les chiffres"
          tone="quiet"
          onClick={async () => {
            await charger(true);
            toast({
              ton: "info",
              titre: "Chiffres à jour",
              texte: `Pennylane et le CRM relus à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.`,
            });
          }}
        />
        {tableau?.mode === "demo" && (
          <SidebarNavItem
            icon={RotateCcw}
            label="Réinitialiser la démo"
            tone="quiet"
            onClick={reinitialiser}
          />
        )}
      </SidebarSection>

      <div className="border-sidebar-border bg-sidebar-accent flex shrink-0 items-center justify-between gap-2 border-b p-4">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="lead-style block font-medium tracking-[-0.01em] tabular-nums">
            {atteint === null ? "Objectif" : `${atteint} %`}
          </span>
          <span className="caption-style text-subtle block truncate">
            {objectif
              ? atteint === null
                ? `${objectif.annee} à définir`
                : `de l'objectif ${objectif.annee}`
              : "Chargement…"}
          </span>
        </div>
        <Button variant="muted" size="md" onClick={() => ouvrirFacture()}>
          <WalletIcon aria-hidden className="size-3.5" />
          Facturer
        </Button>
      </div>
    </div>
  );
}
