import { create } from "zustand";
import { api, type ModifEntreprise } from "@/lib/api";
import { FILTRES_DEFAUT, type FiltresCrm, type Vue } from "@/lib/cockpit";
import { euros } from "@/lib/format";
import type { Crm, Entreprise } from "@/server/crm-types";
import type { Tableau } from "@/server/types";

export type Toast = {
  id: number;
  ton: "succes" | "erreur" | "info";
  titre: string;
  texte?: string;
};

type CockpitState = {
  tableau: Tableau | null;
  crm: Crm | null;
  erreur: string | null;
  charger: (frais?: boolean) => Promise<void>;
  modifierEntreprise: (id: string, modif: ModifEntreprise) => Promise<void>;
  ajouterEntreprise: (modif: ModifEntreprise) => Promise<Entreprise | null>;

  suivis: number[];
  suivrePaiement: (id: number) => void;

  toasts: Toast[];
  toast: (t: Omit<Toast, "id">) => void;
  retirerToast: (id: number) => void;

  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  detailId: string | null;
  detailOpen: boolean;
  openDetail: (id: string) => void;
  closeDetail: () => void;
  profileName: string | null;
  profileOpen: boolean;
  openProfile: (nom: string) => void;
  closeProfile: () => void;
  newCompanyOpen: boolean;
  setNewCompanyOpen: (open: boolean) => void;
  factureOpen: boolean;
  factureClientId: number | null;
  ouvrirFacture: (clientId?: number | null) => void;
  fermerFacture: () => void;

  filtres: FiltresCrm;
  setFiltres: (f: Partial<FiltresCrm>) => void;
  resetFiltres: () => void;
  vue: Vue;
  setVue: (vue: Vue) => void;
  selectedIds: string[];
  toggleSelected: (id: string) => void;
  setSelected: (ids: string[]) => void;

  lues: string[];
  marquerLue: (id: string) => void;
  toutMarquerLu: (ids: string[]) => void;
};

let prochainToast = 1;

export const useCockpit = create<CockpitState>((set, get) => ({
  tableau: null,
  crm: null,
  erreur: null,

  async charger(frais = false) {
    try {
      const [tableau, crm] = await Promise.all([api.tableau(frais), api.crm()]);
      const avant = get().tableau;
      const suivis = get().suivis;
      const payees = suivis.filter(
        (id) =>
          avant?.factures.find((f) => f.id === id)?.statut !== "payee" &&
          tableau.factures.find((f) => f.id === id)?.statut === "payee",
      );
      set({
        tableau,
        crm,
        erreur: null,
        suivis: suivis.filter((id) => !payees.includes(id)),
      });
      for (const id of payees) {
        const f = tableau.factures.find((x) => x.id === id)!;
        get().toast({
          ton: "succes",
          titre: "Paiement reçu",
          texte: `${f.client} a réglé la facture ${f.numero} : ${euros(f.montant, true)}.`,
        });
      }
    } catch (e) {
      set({ erreur: (e as Error).message });
    }
  },

  async modifierEntreprise(id, modif) {
    const crm = get().crm;
    if (!crm) return;
    const avant = crm.entreprises.find((e) => e.id === id);
    if (!avant) return;
    set({
      crm: {
        ...crm,
        entreprises: crm.entreprises.map((e) =>
          e.id === id ? { ...e, ...modif } : e,
        ),
      },
    });
    try {
      const maj = await api.modifierEntreprise(id, modif);
      const actuel = get().crm!;
      set({
        crm: {
          ...actuel,
          entreprises: actuel.entreprises.map((e) => (e.id === id ? maj : e)),
        },
      });
    } catch (e) {
      const actuel = get().crm!;
      set({
        crm: {
          ...actuel,
          entreprises: actuel.entreprises.map((x) => (x.id === id ? avant : x)),
        },
      });
      get().toast({
        ton: "erreur",
        titre: "Modification impossible",
        texte: (e as Error).message,
      });
    }
  },

  async ajouterEntreprise(modif) {
    try {
      const e = await api.ajouterEntreprise(modif);
      const crm = get().crm;
      if (crm) set({ crm: { ...crm, entreprises: [e, ...crm.entreprises] } });
      return e;
    } catch (err) {
      get().toast({
        ton: "erreur",
        titre: "Entreprise non créée",
        texte: (err as Error).message,
      });
      return null;
    }
  },

  suivis: [],
  suivrePaiement: (id) =>
    set((s) => ({ suivis: s.suivis.includes(id) ? s.suivis : [...s.suivis, id] })),

  toasts: [],
  toast: (t) => {
    const id = prochainToast++;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id }] }));
    setTimeout(() => get().retirerToast(id), t.ton === "erreur" ? 7000 : 4500);
  },
  retirerToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  searchOpen: false,
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  detailId: null,
  detailOpen: false,
  openDetail: (detailId) =>
    set({ detailId, detailOpen: true, profileOpen: false, searchOpen: false }),
  closeDetail: () => set({ detailOpen: false }),
  profileName: null,
  profileOpen: false,
  openProfile: (profileName) =>
    set({ profileName, profileOpen: true, detailOpen: false }),
  closeProfile: () => set({ profileOpen: false }),
  newCompanyOpen: false,
  setNewCompanyOpen: (newCompanyOpen) => set({ newCompanyOpen }),
  factureOpen: false,
  factureClientId: null,
  ouvrirFacture: (clientId = null) =>
    set({ factureOpen: true, factureClientId: clientId, detailOpen: false }),
  fermerFacture: () => set({ factureOpen: false }),

  filtres: FILTRES_DEFAUT,
  setFiltres: (f) => set((s) => ({ filtres: { ...s.filtres, ...f } })),
  resetFiltres: () => set({ filtres: FILTRES_DEFAUT }),
  vue: "toutes",
  setVue: (vue) => set({ vue }),
  selectedIds: [],
  toggleSelected: (id) =>
    set((s) => ({
      selectedIds: s.selectedIds.includes(id)
        ? s.selectedIds.filter((x) => x !== id)
        : [...s.selectedIds, id],
    })),
  setSelected: (selectedIds) => set({ selectedIds }),

  lues: [],
  marquerLue: (id) =>
    set((s) => ({ lues: s.lues.includes(id) ? s.lues : [...s.lues, id] })),
  toutMarquerLu: (ids) =>
    set((s) => ({ lues: [...new Set([...s.lues, ...ids])] })),
}));
