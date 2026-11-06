"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/_ui/avatar";
import Button from "@/components/_ui/button";
import CountBadge from "@/components/_ui/count-badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/_ui/popover";
import { ScrollArea } from "@/components/_ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/_ui/tabs";
import { api } from "@/lib/api";
import { membre } from "@/lib/cockpit";
import { euros, ilYaJours, joursAvant, joursDepuis, pluriel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Entreprise } from "@/server/crm-types";
import { useCockpit } from "@/stores/cockpit-store";
import BellIcon from "@/public/assets/images/companies/header/bell.svg";

type Filtre = "toutes" | "non-lues";

type Notif = {
  id: string;
  acteur?: string;
  entreprise?: Entreprise;
  message: string;
  citation?: string;
  quand: string;
  factureId?: number;
};

function Marque({
  entreprise,
  className,
}: {
  entreprise?: Entreprise;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "bg-muted flex shrink-0 items-center justify-center overflow-hidden shadow-[0px_0px_0px_1px_#232323]",
        className,
      )}
    >
      <span className="caption-style text-soft">
        {entreprise?.nom.slice(0, 1) ?? "€"}
      </span>
    </span>
  );
}

export default function Notifications() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [filtre, setFiltre] = useState<Filtre>("toutes");
  const [relance, setRelance] = useState<number | null>(null);
  const navigue = useRef(false);
  const tableau = useCockpit((state) => state.tableau);
  const crm = useCockpit((state) => state.crm);
  const lues = useCockpit((state) => state.lues);
  const marquerLue = useCockpit((state) => state.marquerLue);
  const toutMarquerLu = useCockpit((state) => state.toutMarquerLu);
  const openDetail = useCockpit((state) => state.openDetail);
  const toast = useCockpit((state) => state.toast);
  const charger = useCockpit((state) => state.charger);

  const retards = useMemo(
    () =>
      (tableau?.factures ?? [])
        .filter((f) => f.statut === "en_retard")
        .sort((a, b) => (a.echeance ?? "").localeCompare(b.echeance ?? "")),
    [tableau],
  );

  const notifs = useMemo<Notif[]>(() => {
    if (!crm) return [];
    const parPennylane = (id: number | null) =>
      crm.entreprises.find((e) => e.pennylaneId === id);
    const liste: Notif[] = [];
    for (const f of retards) {
      const retard = -(joursAvant(f.echeance) ?? 0);
      liste.push({
        id: `retard-${f.id}`,
        entreprise: parPennylane(f.clientId),
        message: `La facture ${f.numero} de ${f.client} est en retard de ${pluriel(retard, "jour")}`,
        quand: `${euros(f.restant)} à encaisser`,
        factureId: f.id,
      });
    }
    for (const e of crm.entreprises) {
      if (e.etape === "Gagné")
        liste.push({
          id: `gagne-${e.id}`,
          acteur: e.responsable,
          entreprise: e,
          message: `a signé avec ${e.nom} : la facture est à faire`,
          quand: ilYaJours(e.dernierEchange.date),
        });
      if (e.etape === "Nouveau" && joursDepuis(e.creeLe) <= 30)
        liste.push({
          id: `nouveau-${e.id}`,
          entreprise: e,
          message: `Nouveau lead : ${e.nom}${e.etiquettes[0] ? `, via ${e.etiquettes[0]}` : ""}`,
          citation: e.suite || undefined,
          quand: ilYaJours(e.dernierEchange.date),
        });
      if (e.etape === "Devis envoyé" && joursDepuis(e.dernierEchange.date) >= 3)
        liste.push({
          id: `devis-${e.id}`,
          acteur: e.responsable,
          entreprise: e,
          message: `attend une réponse de ${e.nom} sur son devis`,
          citation: e.suite || undefined,
          quand: ilYaJours(e.dernierEchange.date),
        });
    }
    return liste;
  }, [crm, retards]);

  const nonLues = notifs.filter((n) => !lues.includes(n.id));
  const visibles = filtre === "toutes" ? notifs : nonLues;

  function choisir(n: Notif) {
    marquerLue(n.id);
    navigue.current = true;
    setOpen(false);
    if (n.entreprise) openDetail(n.entreprise.id);
    else router.push("/factures");
  }

  async function relancerTout() {
    let envoyees = 0;
    setRelance(0);
    for (const f of retards) {
      try {
        await api.envoyer(f.id);
        envoyees++;
      } catch {}
      setRelance(envoyees);
    }
    setRelance(null);
    toutMarquerLu(retards.map((f) => `retard-${f.id}`));
    await charger(true);
    toast({
      ton: envoyees === retards.length ? "succes" : "erreur",
      titre: `${pluriel(envoyees, "relance envoyée", "relances envoyées")}`,
      texte:
        envoyees === retards.length
          ? "Chaque client reçoit sa facture et son lien de paiement."
          : `${retards.length - envoyees} envoi(s) en échec : réessaie plus tard.`,
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          aria-label={
            nonLues.length > 0
              ? `Notifications, ${nonLues.length} non lues`
              : "Notifications"
          }
          className="data-[state=open]:bg-muted relative"
        >
          <BellIcon aria-hidden className="size-3.5" />
          {nonLues.length > 0 && (
            <span
              aria-hidden
              className="bg-danger ring-secondary absolute top-[7px] right-[7px] size-1.5 rounded-full ring-2"
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(400px,calc(100vw-2rem))]"
        onCloseAutoFocus={(event) => {
          if (navigue.current) event.preventDefault();
          navigue.current = false;
        }}
      >
        <div className="flex h-14 items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-2">
            <h2>Notifications</h2>
            {nonLues.length > 0 && <CountBadge>{nonLues.length}</CountBadge>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={nonLues.length === 0}
            onClick={() => toutMarquerLu(notifs.map((n) => n.id))}
            className="-mr-1.5"
          >
            Tout marquer comme lu
          </Button>
        </div>

        <Tabs value={filtre} onValueChange={(v) => setFiltre(v as Filtre)}>
          <TabsList className="border-line-strong border-b px-4">
            <TabsTrigger value="toutes" className="py-3">
              Toutes
            </TabsTrigger>
            <TabsTrigger value="non-lues" className="py-3">
              Non lues
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {visibles.length > 0 ? (
          <ScrollArea viewportClassName="max-h-[min(420px,60dvh)]">
            <ul className="flex flex-col gap-0.5 p-1.5">
              {visibles.map((n) => {
                const nonLue = !lues.includes(n.id);
                const acteur = n.acteur && crm ? membre(crm.equipe, n.acteur) : null;
                return (
                  <li key={n.id} className="relative">
                    <Button
                      variant="item"
                      size="none"
                      onClick={() => choisir(n)}
                      data-unread={nonLue}
                      className="p-3 data-[unread=true]:bg-white/2 data-[unread=true]:hover:bg-white/5"
                    >
                      <span className="relative mt-px shrink-0">
                        {acteur ? (
                          <>
                            <Avatar
                              nom={acteur.nom}
                              ton={acteur.ton}
                              className="size-8 text-[11px]"
                            />
                            <Marque
                              entreprise={n.entreprise}
                              className="ring-popover absolute -right-1 -bottom-1 size-4 rounded-[5px] ring-2"
                            />
                          </>
                        ) : (
                          <Marque
                            entreprise={n.entreprise}
                            className="size-8 rounded-lg"
                          />
                        )}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-2 pr-4">
                        <span className="p-style text-soft block">
                          {acteur && (
                            <span className="text-foreground font-medium">
                              {acteur.nom}{" "}
                            </span>
                          )}
                          {n.message}
                        </span>
                        {n.citation && (
                          <span className="p-style border-line-strong text-soft block rounded-lg border bg-white/3 px-3 py-2">
                            {n.citation}
                          </span>
                        )}
                        <span className="caption-style text-subtle flex items-center gap-1.5">
                          {n.quand}
                          {n.entreprise && (
                            <>
                              <span
                                aria-hidden
                                className="bg-subtle size-0.5 rounded-full"
                              />
                              {n.entreprise.nom}
                            </>
                          )}
                        </span>
                      </span>
                      {nonLue && <span className="sr-only">Non lue</span>}
                    </Button>
                    {nonLue && (
                      <span
                        aria-hidden
                        className="bg-danger pointer-events-none absolute top-4 right-3 size-1.5 rounded-full"
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <span className="bg-muted flex size-10 items-center justify-center rounded-full shadow-[0px_0px_0px_1px_#232323]">
              <BellIcon aria-hidden className="text-soft size-4" />
            </span>
            <span className="lead-style mt-1 block font-medium">
              Tu es à jour
            </span>
            <span className="caption-style text-subtle block">
              Les retards, les nouveaux leads et les affaires signées
              apparaîtront ici.
            </span>
          </div>
        )}

        {retards.length > 0 && (
          <div className="border-line-strong flex items-center justify-between gap-2 border-t px-4 py-3">
            <span className="caption-style text-soft">
              {pluriel(retards.length, "facture en retard", "factures en retard")}
            </span>
            <Button
              variant="primary"
              size="sm"
              disabled={relance !== null}
              onClick={relancerTout}
            >
              {relance === null
                ? "Tout relancer"
                : `Relance ${Math.min(relance + 1, retards.length)} sur ${retards.length}…`}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
