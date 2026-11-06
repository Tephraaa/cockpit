"use client";

import { useMemo, useState } from "react";
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
import { ETATS } from "@/components/mission/mission-control";
import { cn } from "@/lib/utils";
import { TACHES_SEMAINE, jourOuvre } from "@/data/agenda";
import { OUTILS } from "@/data/mission";

const ONGLETS = [
  { value: "toutes", label: "Toutes" },
  { value: "a_faire", label: "À faire" },
  { value: "auto", label: "Automatiques" },
  { value: "faite", label: "Faites" },
];

const COLONNES = "grid min-w-max grid-cols-[repeat(5,max-content)] justify-between";
const LIGNE = "col-span-full grid grid-cols-subgrid";

function jour(j: number) {
  if (j === 0) return "Aujourd'hui";
  if (j === 1) return "Demain";
  if (j === -1) return "Hier";
  return jourOuvre(j).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" });
}

export default function Taches() {
  const [onglet, setOnglet] = useState("toutes");
  const [faites, setFaites] = useState<Set<number>>(
    () => new Set(TACHES_SEMAINE.flatMap((t, i) => (t.etat === "faite" ? [i] : []))),
  );

  const lignes = useMemo(
    () =>
      TACHES_SEMAINE.map((t, i) => ({
        ...t,
        i,
        etat: t.etat === "auto" ? ("auto" as const) : faites.has(i) ? ("faite" as const) : ("a_faire" as const),
      }))
        .filter((t) => onglet === "toutes" || t.etat === onglet)
        .sort((a, b) => a.j - b.j || a.heure.localeCompare(b.heure)),
    [onglet, faites],
  );

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      <PageHeader title="Tâches" tabs={ONGLETS} tab={onglet} onTab={setOnglet} />
      <div className="border-border mt-4 flex min-h-0 flex-1 flex-col border-t">
        <ScrollArea orientation="both" className="min-h-0 flex-1">
          <Table role="table" className={cn(COLONNES, "w-full")}>
            <TableHeader role="rowgroup" className="contents">
              <TableRow role="row" className={LIGNE}>
                {["Tâche", "Jour", "Heure", "Outil", "État"].map((h) => (
                  <TableHead key={h} role="columnheader" className="flex items-center">
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody role="rowgroup" className="contents">
              {lignes.map((t) => {
                const o = OUTILS.find((x) => x.id === t.outil);
                return (
                  <TableRow key={t.i} role="row" className={cn(LIGNE, "hover:bg-card/60", t.j === 0 && "bg-white/2")}>
                    <TableCell role="cell" className="flex items-center">
                      <span className="flex items-center gap-5">
                        {t.etat === "auto" ? (
                          <span aria-hidden className="flex size-4 items-center justify-center">
                            <span className="size-1.5 rounded-full bg-(--tag-purple-text)" />
                          </span>
                        ) : (
                          <Checkbox
                            checked={t.etat === "faite"}
                            onCheckedChange={() =>
                              setFaites((s) => {
                                const n = new Set(s);
                                if (n.has(t.i)) n.delete(t.i);
                                else n.add(t.i);
                                return n;
                              })
                            }
                            aria-label={`Marquer « ${t.titre} » comme faite`}
                          />
                        )}
                        <span className={cn(t.etat === "faite" && "text-subtle line-through decoration-white/20")}>{t.titre}</span>
                      </span>
                    </TableCell>
                    <TableCell role="cell" className={cn("flex items-center first-letter:uppercase", t.j === 0 ? "text-foreground" : "text-soft")}>
                      {jour(t.j)}
                    </TableCell>
                    <TableCell role="cell" className="flex items-center tabular-nums">
                      {t.heure}
                    </TableCell>
                    <TableCell role="cell" className="flex items-center">
                      {o && (
                        <span className="flex items-center gap-1.5">
                          <o.icone aria-hidden className="text-soft size-3.5" />
                          {o.nom}
                        </span>
                      )}
                    </TableCell>
                    <TableCell role="cell" className="flex items-center">
                      <Tag tone={ETATS[t.etat].ton}>{ETATS[t.etat].libelle}</Tag>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
        <div className="caption-style grid shrink-0 grid-cols-3 gap-px border-b border-border bg-background p-px">
          {(["a_faire", "auto", "faite"] as const).map((etat) => {
            const n = TACHES_SEMAINE.filter((t, i) => (t.etat === "auto" ? "auto" : faites.has(i) ? "faite" : "a_faire") === etat).length;
            return (
              <div key={etat} className="flex items-center gap-2 p-3 outline-1 outline-border">
                <span className="text-foreground tabular-nums">{n}</span>
                <span className="text-muted-foreground lowercase">{ETATS[etat].libelle === "Automatique" ? "automatiques" : ETATS[etat].libelle === "Fait" ? "faites" : "à faire"}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
