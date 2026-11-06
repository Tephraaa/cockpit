"use client";

import { useState, type CSSProperties } from "react";
import Tag from "@/components/_ui/tag";
import FilterMenu from "@/components/_common/filter-menu";
import { useCompte } from "@/hooks/use-compte";
import { euros, jourCourt, pourcent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Serie } from "@/server/types";

const SEGMENTS = 22;

const PERIODES = [
  { value: "12m", label: "12 mois" },
  { value: "6m", label: "6 mois" },
];

function Total({ valeur }: { valeur: number }) {
  const v = useCompte(valeur);
  return <>{euros(Math.round(v))}</>;
}

export default function ChiffreAffaires({ series }: { series: Serie[] | null }) {
  const [periode, setPeriode] = useState<Serie["periode"]>("12m");
  const [survol, setSurvol] = useState<number | null>(null);
  const serie = series?.find((s) => s.periode === periode);
  const points = serie?.points ?? [];
  const max = Math.max(...points.map((p) => p.montant), 1);
  const choisi = survol !== null ? points[survol] : null;

  return (
    <section className="flex min-w-0 flex-col gap-5 p-4 outline-1 outline-border">
      <div className="flex h-[30px] items-center justify-between gap-2">
        <h2 className="eyebrow-style font-normal">Chiffre d&apos;affaires HT</h2>
        <FilterMenu
          value={periode}
          options={PERIODES}
          onChange={(v) => {
            setPeriode(v as Serie["periode"]);
            setSurvol(null);
          }}
          align="end"
        />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="block text-[28px] leading-none font-semibold tracking-[-0.01em] tabular-nums">
            {serie ? <Total valeur={choisi ? choisi.montant : serie.total} /> : "—"}
          </span>
          <span className="caption-style text-soft block">
            {choisi
              ? `du ${jourCourt(choisi.debut)} au ${jourCourt(choisi.fin)}`
              : periode === "12m"
                ? "facturés sur les 12 derniers mois"
                : "facturés sur les 6 derniers mois"}
          </span>
        </div>
        {serie && serie.variation !== null && !choisi && (
          <Tag tone={serie.variation >= 0 ? "green" : "red"} size="sm" className="tabular-nums">
            {pourcent(serie.variation)} sur 6 mois
          </Tag>
        )}
      </div>

      <div
        key={serie ? periode : "attente"}
        className="flex min-h-[196px] flex-1 items-stretch gap-[3px]"
        onMouseLeave={() => setSurvol(null)}
      >
        {(points.length ? points : Array.from({ length: 12 }, () => null)).map((p, i) => {
          const remplis = p ? Math.max(p.montant > 0 ? 1 : 0, Math.round((p.montant / max) * SEGMENTS)) : 0;
          const actif = survol === i;
          const dernier = i === points.length - 1;
          return (
            <button
              key={i}
              type="button"
              disabled={!p}
              onMouseEnter={() => setSurvol(i)}
              onFocus={() => setSurvol(i)}
              onBlur={() => setSurvol(null)}
              aria-label={p ? `${p.etiquette} : ${euros(p.montant)}` : undefined}
              className="group flex min-w-0 flex-1 cursor-pointer flex-col items-stretch gap-2 outline-none"
            >
              <span className="flex flex-1 flex-col-reverse gap-[2px] rounded-[2px] bg-white/4 p-[2px]">
                {Array.from({ length: SEGMENTS }, (_, s) => (
                  <span
                    key={s}
                    style={
                      s < remplis
                        ? ({
                            "--d": `${150 + i * 55 + s * 22}ms`,
                            "--depuis": "rgb(255 255 255 / 0.06)",
                          } as CSSProperties)
                        : undefined
                    }
                    className={cn(
                      "min-h-px flex-1 rounded-[1px] transition-colors duration-150 ease-power3-out",
                      s < remplis
                        ? actif
                          ? "bg-success"
                          : dernier
                            ? "bg-trend"
                            : "bg-trend-muted group-hover:bg-trend"
                        : "bg-white/6",
                      s < remplis && "anim-segment",
                    )}
                  />
                ))}
              </span>
              <span
                className={cn(
                  "caption-style block truncate text-center transition-colors duration-150",
                  actif ? "text-foreground" : "text-subtle",
                )}
              >
                {p?.etiquette.replace(".", "") ?? ""}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
