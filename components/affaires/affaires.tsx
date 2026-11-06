"use client";

import { useMemo, useState, type DragEvent } from "react";
import Avatar from "@/components/_ui/avatar";
import Button from "@/components/_ui/button";
import CountBadge from "@/components/_ui/count-badge";
import { ScrollArea } from "@/components/_ui/scroll-area";
import Tag from "@/components/_ui/tag";
import FilterMenu from "@/components/_common/filter-menu";
import PageHeader from "@/components/_common/page-header";
import SegmentBar from "@/components/_common/segment-bar";
import { ownerOptions } from "@/components/entreprises/toolbar/filter-options";
import {
  ETAPE_POINTS,
  ETAPES_PIPELINE,
  SEGMENT_TONS,
  TOUS,
  membre,
} from "@/lib/cockpit";
import { aujourdhui, euros, ilYaJours, nombre } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Entreprise, Etape } from "@/server/crm-types";
import { useCockpit } from "@/stores/cockpit-store";
import PlusIcon from "@/public/assets/images/_common/plus.svg";

const VUES = [
  { value: "en-cours", label: "En cours" },
  { value: "perdues", label: "Perdues" },
];

function Carte({
  e,
  onOpen,
  onDrag,
}: {
  e: Entreprise;
  onOpen: () => void;
  onDrag: (event: DragEvent) => void;
}) {
  const equipe = useCockpit((state) => state.crm?.equipe);
  const owner = membre(equipe ?? [], e.responsable);
  return (
    <article
      draggable
      onDragStart={onDrag}
      onClick={onOpen}
      onKeyDown={(event) => event.key === "Enter" && onOpen()}
      tabIndex={0}
      aria-label={`${e.nom}, ${e.etape}, ${euros(e.pipeline)}`}
      className="bg-card ease-power3-out flex cursor-grab flex-col gap-3 rounded-lg p-3.5 shadow-[0px_4px_4px_0px_rgba(42,42,42,0.32),0px_0px_0px_1px_#0e0e0e,inset_0px_1px_0px_0px_rgba(255,255,255,0.08),inset_0px_0px_0px_1px_rgba(255,255,255,0.08)] transition-colors duration-150 outline-none hover:bg-[#252525] focus-visible:ring-2 focus-visible:ring-ring/60 active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="leading-[1.2]">{e.nom}</h3>
        <Tag tone={SEGMENT_TONS[e.segment]} size="sm">
          {e.segment}
        </Tag>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="lead-style flex items-center gap-1 tabular-nums">
          {nombre(e.pipeline)}
          <span className="text-muted-foreground">€</span>
        </span>
        <span className="caption-style flex items-center gap-2 tabular-nums">
          <SegmentBar percent={e.chances} segments={12} className="w-[52px]" anime={{ delai: 150, pas: 30 }} />
          {e.chances} %
        </span>
      </div>
      {e.suite && <p className="text-soft caption-style leading-[1.35]">{e.suite}</p>}
      <div className="caption-style text-subtle flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <Avatar nom={owner.nom} ton={owner.ton} className="size-4 text-[7px]" />
          <span className="truncate">{owner.nom}</span>
        </span>
        <span className="shrink-0">{ilYaJours(e.dernierEchange.date)}</span>
      </div>
    </article>
  );
}

export default function Affaires() {
  const crm = useCockpit((state) => state.crm);
  const openDetail = useCockpit((state) => state.openDetail);
  const modifier = useCockpit((state) => state.modifierEntreprise);
  const toast = useCockpit((state) => state.toast);
  const setNewCompanyOpen = useCockpit((state) => state.setNewCompanyOpen);
  const [vue, setVue] = useState("en-cours");
  const [responsable, setResponsable] = useState(TOUS);
  const [cible, setCible] = useState<Etape | null>(null);

  const entreprises = useMemo(
    () =>
      (crm?.entreprises ?? []).filter(
        (e) => responsable === TOUS || e.responsable === responsable,
      ),
    [crm, responsable],
  );
  const colonnes: Etape[] = vue === "perdues" ? ["Perdu"] : ETAPES_PIPELINE;

  function deposer(etape: Etape, event: DragEvent) {
    event.preventDefault();
    setCible(null);
    const id = event.dataTransfer.getData("text/plain");
    const e = crm?.entreprises.find((x) => x.id === id);
    if (!e || e.etape === etape) return;
    modifier(id, {
      etape,
      chances: etape === "Gagné" ? 100 : etape === "Perdu" ? 0 : e.chances,
      dernierEchange: { date: aujourdhui(), libelle: `Passé en ${etape}`.slice(0, 40) },
    });
    toast({ ton: "succes", titre: `${e.nom} : ${etape}`, texte: etape === "Gagné" ? "Bravo ! Pense à la facturer." : `Déplacée depuis « ${e.etape} ».` });
  }

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      <PageHeader title="Affaires" tabs={VUES} tab={vue} onTab={setVue} />
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-4 py-4">
        <FilterMenu
          label="Responsable"
          value={responsable}
          options={ownerOptions(crm?.equipe ?? [])}
          onChange={setResponsable}
        />
        <div className="flex items-center gap-2">
          <span className="caption-style text-subtle hidden md:inline">
            Glisse une carte vers une autre colonne pour changer son étape
          </span>
          <Button variant="primary" size="sm" onClick={() => setNewCompanyOpen(true)}>
            <PlusIcon aria-hidden className="size-3" />
            Nouvelle entreprise
          </Button>
        </div>
      </div>
      <ScrollArea orientation="horizontal" className="border-border min-h-0 flex-1 border-t">
        <div className="flex h-full min-h-[calc(100dvh-170px)] gap-px bg-background p-px">
          {colonnes.map((etape) => {
            const cartes = entreprises
              .filter((e) => e.etape === etape)
              .sort((a, b) => b.pipeline - a.pipeline);
            const somme = cartes.reduce((s, e) => s + e.pipeline, 0);
            return (
              <div
                key={etape}
                onDragOver={(event) => {
                  event.preventDefault();
                  setCible(etape);
                }}
                onDragLeave={() => setCible((c) => (c === etape ? null : c))}
                onDrop={(event) => deposer(etape, event)}
                className={cn(
                  "flex min-w-[228px] flex-1 flex-col outline-1 outline-border transition-colors duration-150",
                  vue === "perdues" && "max-w-[420px]",
                  cible === etape && "bg-white/3",
                )}
              >
                <div className="flex items-center justify-between gap-2 px-4 py-3">
                  <span className="flex items-center gap-2">
                    <span className={cn("size-1.5 rounded-full", ETAPE_POINTS[etape])} />
                    <h2 className="h4-style text-[14px] leading-none font-medium">{etape}</h2>
                    <CountBadge>{cartes.length}</CountBadge>
                  </span>
                  <span className="caption-style text-subtle tabular-nums">{euros(somme)}</span>
                </div>
                <div className="flex flex-1 flex-col gap-2 px-3 pb-3">
                  {cartes.map((e) => (
                    <Carte
                      key={e.id}
                      e={e}
                      onOpen={() => openDetail(e.id)}
                      onDrag={(event) => {
                        event.dataTransfer.setData("text/plain", e.id);
                        event.dataTransfer.effectAllowed = "move";
                      }}
                    />
                  ))}
                  {cartes.length === 0 && (
                    <span className="caption-style text-subtle border-line-strong flex h-20 items-center justify-center rounded-lg border border-dashed">
                      {crm ? "Aucune affaire" : "Chargement…"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </section>
  );
}
