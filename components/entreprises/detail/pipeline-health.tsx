import SegmentBar from "@/components/_common/segment-bar";
import { avancement } from "@/lib/cockpit";
import type { Entreprise } from "@/server/crm-types";

type PipelineHealthProps = {
  company: Entreprise;
};

export default function PipelineHealth({ company }: PipelineHealthProps) {
  const a = avancement(company);
  const stages = [
    { label: "Découverte", value: a.decouverte, tone: "danger" as const },
    { label: "Proposition", value: a.proposition, tone: "warning" as const },
    { label: "Signature", value: a.signature, tone: "success" as const },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="block text-[28px] leading-none font-semibold tabular-nums">
          {company.chances} %
        </span>
        <span className="caption-style block text-soft">
          Chances de signer sur{" "}
          {company.affaires > 1
            ? `les ${company.affaires} affaires en cours`
            : "l'affaire en cours"}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {stages.map((stage, i) => (
          <div key={stage.label} className="flex flex-col gap-2">
            <div className="caption-style flex items-center justify-between">
              <span>{stage.label}</span>
              <span className="tabular-nums">{stage.value} %</span>
            </div>
            <SegmentBar
              percent={stage.value}
              segments={63}
              tone={stage.tone}
              className="h-3 w-full border border-white/4 px-px"
              segmentClassName="h-2"
              trackClassName="bg-white/8"
              anime={{ delai: 200 + i * 140, pas: 6 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
