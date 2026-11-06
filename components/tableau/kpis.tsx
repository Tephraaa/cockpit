"use client";

import type { ComponentType, SVGProps } from "react";
import Tag from "@/components/_ui/tag";
import Sparkline from "@/components/_common/sparkline";
import { useCompte } from "@/hooks/use-compte";
import { euros, pourcent } from "@/lib/format";
import type { Kpi, Serie } from "@/server/types";
import BarChartIcon from "@/public/assets/images/companies/sidebar/bar-chart.svg";
import WalletIcon from "@/public/assets/images/companies/sidebar/wallet.svg";
import ClockIcon from "@/public/assets/images/companies/detail/clock.svg";
import AlertIcon from "@/public/assets/images/companies/sidebar/alert-triangle.svg";

const ICONES: Record<Kpi["cle"], ComponentType<SVGProps<SVGSVGElement>>> = {
  ca: BarChartIcon,
  encaisse: WalletIcon,
  a_encaisser: ClockIcon,
  retard: AlertIcon,
};

function Tendance({ kpi }: { kpi: Kpi }) {
  const t = kpi.tendance;
  if (!t) return null;
  if ("pourcent" in t)
    return (
      <Tag tone={t.pourcent >= 0 ? "green" : "red"} size="sm" className="tabular-nums">
        {pourcent(t.pourcent)}
      </Tag>
    );
  return (
    <Tag tone={t.ton === "alerte" ? "red" : "neutral"} size="sm">
      {t.texte}
    </Tag>
  );
}

function Montant({ valeur }: { valeur: number }) {
  const v = useCompte(valeur);
  return <>{euros(Math.round(v))}</>;
}

function hauteurs(serie: Serie | undefined) {
  const points = serie?.points ?? [];
  const max = Math.max(...points.map((p) => p.montant), 1);
  return points.map((p) => Math.max(2, Math.round((p.montant / max) * 14)));
}

type KpisProps = {
  kpis: Kpi[] | null;
  serie?: Serie;
};

export default function Kpis({ kpis, serie }: KpisProps) {
  const liste = kpis ?? (["ca", "encaisse", "a_encaisser", "retard"] as const).map((cle) => ({ cle }) as Partial<Kpi> & { cle: Kpi["cle"] });

  return (
    <div className="grid shrink-0 grid-cols-1 gap-px bg-background p-px sm:grid-cols-2 xl:grid-cols-4">
      {liste.map((k) => {
        const Icone = ICONES[k.cle];
        const kpi = k as Kpi;
        return (
          <article
            key={k.cle}
            className="flex min-w-0 flex-col gap-4 p-4 outline-1 outline-border"
          >
            <div className="flex h-[22px] items-center justify-between gap-2">
              <span className="caption-style text-soft flex items-center gap-1.5">
                <Icone aria-hidden className="text-subtle size-3.5" />
                {kpi.libelle ?? "…"}
              </span>
              {kpis && <Tendance kpi={kpi} />}
            </div>
            <div className="flex items-end justify-between gap-3">
              <span className="block text-[28px] leading-none font-semibold tracking-[-0.01em] tabular-nums">
                {kpis && kpi.valeur !== null ? <Montant valeur={kpi.valeur} /> : "—"}
              </span>
              {k.cle === "ca" && serie && (
                <Sparkline values={hauteurs(serie)} className="mb-0.5" anime={{ delai: 250, pas: 30 }} />
              )}
            </div>
            <span className="caption-style text-subtle block truncate">
              {kpi.legende ?? "Chargement…"}
            </span>
          </article>
        );
      })}
    </div>
  );
}
