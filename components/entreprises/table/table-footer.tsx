import { euros, nombre } from "@/lib/format";
import type { Entreprise } from "@/server/crm-types";

type TableFooterProps = {
  entreprises: Entreprise[];
};

export default function TableFooter({ entreprises }: TableFooterProps) {
  const enCours = entreprises.filter(
    (e) => e.etape !== "Perdu" && e.affaires > 0,
  );
  const pipeline = enCours.reduce((s, e) => s + e.pipeline, 0);
  const pondere = enCours.reduce((s, e) => s + (e.pipeline * e.chances) / 100, 0);
  const moyenne = enCours.length
    ? Math.round(enCours.reduce((s, e) => s + e.chances, 0) / enCours.length)
    : 0;

  const cases = [
    { valeur: euros(pipeline), libelle: "de pipeline en cours" },
    { valeur: `${moyenne} %`, libelle: "de chances en moyenne" },
    { valeur: euros(pondere), libelle: "pondéré par les chances" },
  ];

  return (
    <div className="caption-style grid shrink-0 grid-cols-2 gap-px border-b border-border bg-background p-px sm:grid-cols-4">
      <div className="flex items-center gap-2 p-3 outline-1 outline-border">
        <span className="text-foreground tabular-nums">
          {nombre(entreprises.length)}
        </span>
        <span className="text-muted-foreground">
          {entreprises.length > 1 ? "entreprises affichées" : "entreprise affichée"}
        </span>
      </div>
      {cases.map((c) => (
        <div
          key={c.libelle}
          className="flex items-center gap-2 p-3 outline-1 outline-border"
        >
          <span className="text-foreground whitespace-nowrap tabular-nums">{c.valeur}</span>
          <span className="text-muted-foreground truncate">{c.libelle}</span>
        </div>
      ))}
    </div>
  );
}
