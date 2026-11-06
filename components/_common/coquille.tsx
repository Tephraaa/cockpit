"use client";

import { useEffect, type ReactNode } from "react";
import Sidebar from "@/components/_common/sidebar/sidebar";
import Toasts from "@/components/_common/toasts";
import CommandMenu from "@/components/entreprises/command-menu/command-menu";
import CompanyDetail from "@/components/entreprises/detail/company-detail";
import NewCompanyDialog from "@/components/entreprises/new-company/new-company-dialog";
import Profile from "@/components/entreprises/profile/profile";
import NouvelleFacture from "@/components/factures/nouvelle-facture";
import { useCockpit } from "@/stores/cockpit-store";

export default function Coquille({ children }: { children: ReactNode }) {
  const charger = useCockpit((state) => state.charger);

  useEffect(() => {
    charger();
    let dernier = 0;
    const rafraichir = () => {
      if (document.visibilityState !== "visible" || Date.now() - dernier < 1500)
        return;
      dernier = Date.now();
      charger();
    };
    window.addEventListener("focus", rafraichir);
    document.addEventListener("visibilitychange", rafraichir);
    return () => {
      window.removeEventListener("focus", rafraichir);
      document.removeEventListener("visibilitychange", rafraichir);
    };
  }, [charger]);

  return (
    <main className="flex h-dvh max-w-full overflow-hidden">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      <CompanyDetail />
      <Profile />
      <NewCompanyDialog />
      <NouvelleFacture />
      <CommandMenu />
      <Toasts />
    </main>
  );
}
