import Button from "@/components/_ui/button";
import SegmentBar from "@/components/_common/segment-bar";
import { nombre } from "@/lib/format";
import type { Entreprise } from "@/server/crm-types";

type ProfileAccountProps = {
  company: Entreprise;
  onOpen: () => void;
};

export default function ProfileAccount({ company, onOpen }: ProfileAccountProps) {
  return (
    <li>
      <Button
        variant="item"
        size="md"
        onClick={onOpen}
        aria-label={`Ouvrir la fiche de ${company.nom}`}
        className="items-center px-2 py-2"
      >
        <span className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-lg shadow-[0px_0px_0px_1px_#232323]">
          <span className="caption-style text-soft">{company.nom.slice(0, 1)}</span>
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate">{company.nom}</span>
          <span className="caption-style text-subtle truncate">
            {company.affaires} affaire{company.affaires > 1 ? "s" : ""} · {company.segment}, {company.etape}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1.5 tabular-nums">
          <span className="flex items-center gap-1">
            {nombre(company.pipeline)}
            <span className="text-muted-foreground">€</span>
          </span>
          <SegmentBar percent={company.chances} className="w-[60px]" />
        </span>
      </Button>
    </li>
  );
}
