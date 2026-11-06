"use client";

import { useState } from "react";
import { Checkbox } from "@/components/_ui/checkbox";
import { ScrollArea } from "@/components/_ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/_ui/table";
import Tag from "@/components/_ui/tag";
import PageHeader from "@/components/_common/page-header";
import SegmentBar from "@/components/_common/segment-bar";
import { cn } from "@/lib/utils";
import { AUTOMATISATIONS, OUTILS, TACHES, type Tache } from "@/data/mission";
import type { Ton } from "@/server/crm-types";

export const ETATS: Record<Tache["etat"], { libelle: string; ton: Ton }> = {
  faite: { libelle: "Fait", ton: "green" },
  auto: { libelle: "Automatique", ton: "purple" },
  a_faire: { libelle: "À faire", ton: "amber" },
};

const outil = (id: string) => OUTILS.find((o) => o.id === id);

function duree(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h ? `${h} h${m ? ` ${String(m).padStart(2, "0")}` : ""}` : `${m} min`;
}

const COLONNES = "grid min-w-max grid-cols-[repeat(6,max-content)] justify-between";
const LIGNE = "col-span-full grid grid-cols-subgrid";

export default function MissionControl() {
  const [faites, setFaites] = useState<Set<number>>(
    () => new Set(TACHES.flatMap((t, i) => (t.etat === "faite" ? [i] : []))),
  );
  const gagne = AUTOMATISATIONS.reduce((s, a) => s + a.minutes * a.parSemaine * a.reussite, 0);
  const reussite = Math.round(
    (AUTOMATISATIONS.reduce((s, a) => s + a.reussite, 0) / AUTOMATISATIONS.length) * 100,
  );
  const manuelles = TACHES.filter((t) => t.etat !== "auto").length;
  const faitesManuelles = TACHES.filter((t, i) => t.etat !== "auto" && faites.has(i)).length;

  const stats = [
    { libelle: "Tâches du jour", valeur: `${faitesManuelles} / ${manuelles}`, legende: "faites à la main, le reste tourne seul" },
    { libelle: "Automatisations", valeur: String(AUTOMATISATIONS.length), legende: "actives cette semaine" },
    { libelle: "Temps gagné", valeur: duree(gagne), legende: "par semaine, grâce aux automatisations" },
    { libelle: "Réussite", valeur: `${reussite} %`, legende: "des passages sur 30 jours" },
  ];

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      <PageHeader title="Mission control" pill={<Tag tone="neutral" size="sm">Aujourd&apos;hui</Tag>} />
      <ScrollArea className="border-border min-h-0 flex-1 border-t">
        <div className="grid grid-cols-1 gap-px bg-background p-px sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <article key={s.libelle} className="flex min-w-0 flex-col gap-4 p-4 outline-1 outline-border">
              <span className="caption-style text-soft">{s.libelle}</span>
              <span className="block text-[28px] leading-none font-semibold tracking-[-0.01em] tabular-nums">{s.valeur}</span>
              <span className="caption-style text-subtle truncate">{s.legende}</span>
            </article>
          ))}
        </div>

        <div className="grid gap-px border-t border-border bg-background p-px xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <section className="flex min-w-0 flex-col gap-2 p-4 outline-1 outline-border">
            <div className="flex h-[30px] items-center justify-between">
              <h2 className="eyebrow-style font-normal">Ta journée</h2>
              <span className="caption-style text-subtle">ce que tu fais, quand, et avec quel outil</span>
            </div>
            <ul className="flex flex-col">
              {TACHES.map((t, i) => {
                const o = outil(t.outil);
                const fait = t.etat === "auto" ? false : faites.has(i);
                const etat = t.etat === "auto" ? "auto" : fait ? "faite" : "a_faire";
                return (
                  <li key={t.titre} className="border-line-strong flex items-center gap-3 border-b py-2.5 last:border-b-0">
                    <span className="caption-style text-subtle w-10 shrink-0 tabular-nums">{t.heure}</span>
                    {t.etat === "auto" ? (
                      <span aria-hidden className="flex size-4 shrink-0 items-center justify-center">
                        <span className="size-1.5 rounded-full bg-(--tag-purple-text)" />
                      </span>
                    ) : (
                      <Checkbox
                        checked={fait}
                        onCheckedChange={() =>
                          setFaites((s) => {
                            const n = new Set(s);
                            if (n.has(i)) n.delete(i);
                            else n.add(i);
                            return n;
                          })
                        }
                        aria-label={`Marquer « ${t.titre} » comme faite`}
                      />
                    )}
                    <span className={cn("min-w-0 flex-1 truncate", fait && "text-subtle line-through decoration-white/20")}>
                      {t.titre}
                    </span>
                    {o && (
                      <span className="caption-style text-soft hidden items-center gap-1.5 sm:flex">
                        <o.icone aria-hidden className="size-3.5" />
                        {o.nom}
                      </span>
                    )}
                    <Tag tone={ETATS[etat].ton} size="sm">
                      {ETATS[etat].libelle}
                    </Tag>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="flex min-w-0 flex-col gap-4 p-4 outline-1 outline-border">
            <div className="flex h-[30px] items-center justify-between">
              <h2 className="eyebrow-style font-normal">Tes outils</h2>
              <span className="caption-style text-subtle">{OUTILS.length} applications</span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {OUTILS.map((o) => {
                const branche = o.id === "pennylane";
                const usages = TACHES.filter((t) => t.outil === o.id).length;
                return (
                  <article key={o.id} className="border-line-strong flex flex-col gap-3 rounded-lg border p-[11px]">
                    <span className="flex items-center justify-between gap-2">
                      <span className="bg-muted flex size-7 items-center justify-center rounded-md shadow-[0px_0px_0px_1px_#232323]">
                        <o.icone aria-hidden className="text-soft size-3.5" />
                      </span>
                      <Tag tone={branche ? "green" : "neutral"} size="sm">
                        {branche ? "Branché" : `${usages} tâche${usages > 1 ? "s" : ""}`}
                      </Tag>
                    </span>
                    <span className="flex flex-col gap-1">
                      <span className="lead-style block font-medium">{o.nom}</span>
                      <span className="caption-style text-soft block truncate">{o.role}</span>
                    </span>
                  </article>
                );
              })}
            </div>
          </section>
        </div>

        <div className="border-border flex items-center justify-between gap-2 border-t px-4 py-4">
          <h2>Automatisations</h2>
          <span className="caption-style text-subtle">ce qui tourne sans toi</span>
        </div>
        <div className="border-border border-t">
          <ScrollArea orientation="horizontal">
            <Table role="table" className={cn(COLONNES, "w-full")}>
              <TableHeader role="rowgroup" className="contents">
                <TableRow role="row" className={LIGNE}>
                  {["Automatisation", "Quand", "Outil", "Réussite sur 30 jours", "Temps gagné", "Dernier passage"].map((h, i) => (
                    <TableHead key={h} role="columnheader" className={cn("flex items-center", (i === 3 || i === 4) && "justify-end")}>
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody role="rowgroup" className="contents">
                {AUTOMATISATIONS.map((a, i) => {
                  const o = outil(a.outil);
                  return (
                    <TableRow key={a.nom} role="row" className={cn(LIGNE, "hover:bg-card/60")}>
                      <TableCell role="cell" className="flex items-center">{a.nom}</TableCell>
                      <TableCell role="cell" className="text-soft flex items-center">{a.quand}</TableCell>
                      <TableCell role="cell" className="flex items-center">
                        {o && (
                          <span className="flex items-center gap-1.5">
                            <o.icone aria-hidden className="text-soft size-3.5" />
                            {o.nom}
                          </span>
                        )}
                      </TableCell>
                      <TableCell role="cell" className="flex items-center justify-end">
                        <span className="flex items-center gap-2 tabular-nums">
                          <SegmentBar
                            percent={Math.round(a.reussite * 100)}
                            className="w-[74px]"
                            anime={{ delai: 200 + i * 60, pas: 16 }}
                          />
                          <span className="w-[4ch] text-right">{Math.round(a.reussite * 100)} %</span>
                        </span>
                      </TableCell>
                      <TableCell role="cell" className="flex items-center justify-end tabular-nums">
                        {duree(a.minutes * a.parSemaine)} / sem.
                      </TableCell>
                      <TableCell role="cell" className="text-soft flex items-center">{a.derniere}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </ScrollArea>
    </section>
  );
}
