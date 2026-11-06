"use client";

import { useMemo, useState, type CSSProperties, type MouseEvent } from "react";
import SegmentBar from "@/components/_common/segment-bar";
import { useCompte } from "@/hooks/use-compte";
import { euros, pluriel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Region } from "@/server/types";
import france from "@/data/france.json";

type Carte = {
  colonnes: number;
  lignes: number;
  cases: [number, number, number][];
  regions: { code: string; nom: string; repere: [number, number] }[];
};

const CARTE = france as unknown as Carte;
const COTE = 0.64;

const INDEX = new Map(CARTE.cases.map(([c, l, k]) => [c * 1000 + l, k]));

const DELAIS = CARTE.cases.map(
  ([c, l]) =>
    ({
      "--d": `${c * 9 + l * 2}ms`,
      "--d2": `${420 + c * 14 + ((c * 7 + l * 13) % 9) * 14}ms`,
    }) as CSSProperties,
);

function Somme({ valeur }: { valeur: number }) {
  const v = useCompte(valeur, 1100);
  return <>{euros(Math.round(v))}</>;
}

function teinte(part: number) {
  if (part >= 0.5) return "#00b562";
  if (part >= 0.12) return "#1f8c57";
  return "#395e4d";
}

type CarteFranceProps = {
  regions: Region[] | null;
  clientsActifs: number;
  nouveaux: number;
};

export default function CarteFrance({ regions, clientsActifs, nouveaux }: CarteFranceProps) {
  const [survol, setSurvol] = useState<string | null>(null);

  const actives = useMemo(
    () => (regions ?? []).filter((r) => r.montant > 0).sort((a, b) => b.montant - a.montant),
    [regions],
  );
  const max = actives[0]?.montant ?? 1;
  const total = actives.reduce((s, r) => s + r.montant, 0) || 1;
  const parCode = useMemo(() => new Map(actives.map((r) => [r.code, r])), [actives]);

  function bouger(event: MouseEvent<SVGSVGElement>) {
    const boite = event.currentTarget.getBoundingClientRect();
    const c = Math.floor(((event.clientX - boite.left) / boite.width) * CARTE.colonnes);
    const l = Math.floor(((event.clientY - boite.top) / boite.height) * CARTE.lignes);
    const k = INDEX.get(c * 1000 + l);
    const code = k === undefined ? null : CARTE.regions[k].code;
    setSurvol(code && parCode.has(code) ? code : null);
  }

  const choisie = survol ? parCode.get(survol) : null;

  return (
    <section className="flex min-w-0 flex-col gap-5 p-4 outline-1 outline-border">
      <div className="flex h-[30px] items-center justify-between gap-2">
        <h2 className="eyebrow-style font-normal">Clients par région</h2>
        <span className="caption-style text-subtle">
          {regions ? `${pluriel(actives.length, "région")}` : ""}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="block text-[28px] leading-none font-semibold tracking-[-0.01em] tabular-nums">
          {regions ? (choisie ? euros(choisie.montant) : pluriel(clientsActifs, "client")) : "—"}
        </span>
        <span className="caption-style text-soft block">
          {choisie
            ? `${choisie.nom} · ${pluriel(choisie.clients, "client")}`
            : nouveaux > 0
              ? `actifs sur 12 mois, dont ${pluriel(nouveaux, "nouveau", "nouveaux")}`
              : "actifs sur 12 mois"}
        </span>
      </div>

      <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
        {regions ? (
          <svg
            viewBox={`0 0 ${CARTE.colonnes} ${CARTE.lignes}`}
            className="aspect-[61/58] w-full max-w-[300px] shrink-0 self-center sm:w-[46%]"
            role="img"
            aria-label="Carte de France des clients, par région"
            onMouseMove={bouger}
            onMouseLeave={() => setSurvol(null)}
          >
            {CARTE.cases.map(([c, l, k], i) => {
              const region = parCode.get(CARTE.regions[k].code);
              const actif = region && survol === region.code;
              return (
                <rect
                  key={`${c}-${l}`}
                  x={c + (1 - COTE) / 2}
                  y={l + (1 - COTE) / 2}
                  width={COTE}
                  height={COTE}
                  rx={0.14}
                  style={DELAIS[i]}
                  className={region ? "anim-case-allumee" : "anim-case"}
                  fill={region ? (actif ? "#22c55e" : teinte(region.montant / max)) : "#2a2a2a"}
                  opacity={survol && region && !actif ? 0.55 : 1}
                />
              );
            })}
          </svg>
        ) : (
          <div aria-hidden className="aspect-[61/58] w-full max-w-[300px] shrink-0 self-center sm:w-[46%]" />
        )}

        <ul className="flex min-w-0 flex-1 flex-col gap-3">
          {actives.slice(0, 6).map((r, i) => (
            <li
              key={r.code}
              onMouseEnter={() => setSurvol(r.code)}
              onMouseLeave={() => setSurvol(null)}
              className="flex flex-col gap-2"
            >
              <div className="caption-style flex items-center justify-between gap-2">
                <span className={cn("truncate transition-colors duration-150", survol === r.code ? "text-foreground" : "text-soft")}>
                  {r.nom}
                </span>
                <span className="shrink-0 tabular-nums">
                  <Somme valeur={r.montant} />
                </span>
              </div>
              <SegmentBar
                percent={Math.max(4, Math.round((r.montant / total) * 100))}
                segments={36}
                tone="success"
                className="h-3 w-full border border-white/4 px-px"
                segmentClassName="h-2"
                trackClassName="bg-white/8"
                anime={{ delai: 320 + i * 110, pas: 14 }}
              />
            </li>
          ))}
          {regions && actives.length === 0 && (
            <li className="caption-style text-subtle">Aucun client facturé sur 12 mois.</li>
          )}
        </ul>
      </div>
    </section>
  );
}
