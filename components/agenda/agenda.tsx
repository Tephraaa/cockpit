"use client";

import { ScrollArea } from "@/components/_ui/scroll-area";
import CountBadge from "@/components/_ui/count-badge";
import Tag from "@/components/_ui/tag";
import PageHeader from "@/components/_common/page-header";
import { cn } from "@/lib/utils";
import { RDV, TYPES_RDV, jourOuvre, type Couleur } from "@/data/agenda";
import type { Ton } from "@/server/crm-types";
import { useCockpit } from "@/stores/cockpit-store";

const TONS: Record<Couleur, Ton> = { bleu: "blue", ambre: "amber", vert: "green", gris: "neutral" };
const JOURS = [-2, -1, 0, 1, 2];

export default function Agenda() {
  const crm = useCockpit((state) => state.crm);
  const openDetail = useCockpit((state) => state.openDetail);

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      <PageHeader title="Agenda" pill={<Tag tone="neutral" size="sm">5 jours ouvrés</Tag>} />
      <ScrollArea orientation="both" className="border-border min-h-0 flex-1 border-t">
        <div className="grid min-h-[calc(100dvh-60px)] min-w-[980px] grid-cols-5 gap-px bg-background p-px">
          {JOURS.map((j) => {
            const date = jourOuvre(j);
            const rdv = RDV.filter((r) => r.j === j).sort((a, b) => a.debut.localeCompare(b.debut));
            return (
              <div key={j} className={cn("flex min-w-0 flex-col outline-1 outline-border", j === 0 && "bg-white/2")}>
                <div className="flex items-center justify-between gap-2 px-4 py-3">
                  <span className="flex items-baseline gap-2">
                    <span className="lead-style font-medium capitalize">
                      {date.toLocaleDateString("fr-FR", { weekday: "long" })}
                    </span>
                    <span className="caption-style text-subtle tabular-nums">
                      {date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </span>
                  </span>
                  {j === 0 ? <Tag tone="green" size="sm">Aujourd&apos;hui</Tag> : <CountBadge>{rdv.length}</CountBadge>}
                </div>
                <div className="flex flex-col gap-2 px-3 pb-3">
                  {rdv.map((r) => {
                    const type = TYPES_RDV[r.type];
                    const e = r.avec ? crm?.entreprises.find((x) => x.nom === r.avec) : undefined;
                    return (
                      <article
                        key={`${r.debut}-${r.titre}`}
                        onClick={() => e && openDetail(e.id)}
                        className={cn(
                          "bg-card flex flex-col gap-2.5 rounded-lg p-3 shadow-[0px_4px_4px_0px_rgba(42,42,42,0.32),0px_0px_0px_1px_#0e0e0e,inset_0px_1px_0px_0px_rgba(255,255,255,0.08),inset_0px_0px_0px_1px_rgba(255,255,255,0.08)] transition-colors duration-150",
                          e && "cursor-pointer hover:bg-[#252525]",
                        )}
                      >
                        <span className="caption-style text-soft tabular-nums">
                          {r.debut} – {r.fin}
                        </span>
                        <span className="flex flex-col gap-1">
                          <span className="leading-[1.25]">{r.titre}</span>
                          {r.avec && <span className="caption-style text-subtle truncate">{r.avec}</span>}
                        </span>
                        <Tag tone={TONS[type.couleur]} size="sm" className="self-start">
                          {type.libelle}
                        </Tag>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </section>
  );
}
