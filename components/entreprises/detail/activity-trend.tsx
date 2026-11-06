import type { ComponentType, SVGProps } from "react";
import Sparkline from "@/components/_common/sparkline";
import { activite } from "@/lib/cockpit";
import { ilYaJours } from "@/lib/format";
import type { Entreprise } from "@/server/crm-types";
import CursorClickIcon from "@/public/assets/images/companies/detail/cursor-click.svg";
import MailIcon from "@/public/assets/images/companies/detail/mail-03.svg";
import CalendarIcon from "@/public/assets/images/companies/detail/calendar.svg";
import PhoneCallIcon from "@/public/assets/images/companies/detail/phone-call.svg";

type ActivityTrendProps = {
  company: Entreprise;
};

type Stat = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: number;
};

export default function ActivityTrend({ company }: ActivityTrendProps) {
  const a = activite(company);
  const stats: Stat[] = [
    { icon: CursorClickIcon, label: "Échanges", value: a.total },
    { icon: MailIcon, label: "E-mails", value: a.emails },
    { icon: CalendarIcon, label: "Rendez-vous", value: a.rendezVous },
    { icon: PhoneCallIcon, label: "Appels", value: a.appels },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-[3px]">
          <span className="block text-[24px] leading-none tabular-nums">
            {a.total}
          </span>
          <Sparkline
            values={company.tendance}
            className="h-[22px]"
            anime={{ delai: 250, pas: 25 }}
          />
        </div>
        <span className="caption-style block text-soft">
          Sur 14 semaines · dernier échange {ilYaJours(company.dernierEchange.date)} :{" "}
          {company.dernierEchange.libelle.toLowerCase()}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-3 rounded-lg border border-line-strong p-[11px]"
          >
            <span className="caption-style flex items-center gap-1 text-soft">
              <stat.icon aria-hidden className="size-3 shrink-0" />
              {stat.label}
            </span>
            <span className="lead-style block tabular-nums">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
