"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, Copy, ExternalLink, Link2, TriangleAlert } from "lucide-react";
import Button from "@/components/_ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/_ui/dialog";
import Field from "@/components/_ui/field";
import { Input } from "@/components/_ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/_ui/select";
import SegmentBar from "@/components/_common/segment-bar";
import FormSection from "@/components/entreprises/new-company/form-section";
import { api } from "@/lib/api";
import { euros } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CodeTva, NouvelleFacture as Saisie } from "@/server/types";
import { useCockpit } from "@/stores/cockpit-store";

const TVA: { code: CodeTva; libelle: string; taux: number }[] = [
  { code: "FR_200", libelle: "20 %", taux: 0.2 },
  { code: "FR_100", libelle: "10 %", taux: 0.1 },
  { code: "FR_55", libelle: "5,5 %", taux: 0.055 },
  { code: "exempt", libelle: "0 %", taux: 0 },
];
const ECHEANCES = [15, 30, 45];

type Etat = "attente" | "en-cours" | "faite" | "erreur";

function Progression({ etat }: { etat: Etat }) {
  const [valeur, setValeur] = useState(
    etat === "faite" ? 100 : etat === "en-cours" ? 5 : 0,
  );
  useEffect(() => {
    if (etat !== "en-cours") return;
    const t = window.setInterval(
      () => setValeur((v) => Math.min(92, v + (95 - v) * 0.12)),
      80,
    );
    return () => window.clearInterval(t);
  }, [etat]);
  return (
    <SegmentBar
      percent={valeur}
      segments={48}
      tone={etat === "erreur" ? "danger" : "success"}
      className="h-3 w-full border border-white/4 px-px"
      segmentClassName="h-2"
      trackClassName="bg-white/8"
    />
  );
}

function Choix<T extends string | number>({
  valeur,
  options,
  onChange,
  label,
}: {
  valeur: T;
  options: { valeur: T; libelle: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="bg-secondary border-line-strong flex h-9 items-center gap-0.5 rounded-lg border p-0.5"
    >
      {options.map((o) => (
        <button
          key={String(o.valeur)}
          type="button"
          role="radio"
          aria-checked={valeur === o.valeur}
          onClick={() => onChange(o.valeur)}
          className="text-subtle hover:text-soft aria-checked:bg-muted aria-checked:text-foreground ease-power3-out h-full flex-1 cursor-pointer rounded-md text-[13px] leading-none transition-colors duration-150 aria-checked:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.4),inset_0px_1px_0px_0px_rgba(255,255,255,0.1)]"
        >
          {o.libelle}
        </button>
      ))}
    </div>
  );
}

export default function NouvelleFacture() {
  const router = useRouter();
  const pathname = usePathname();
  const open = useCockpit((state) => state.factureOpen);
  const clientInitial = useCockpit((state) => state.factureClientId);
  const fermer = useCockpit((state) => state.fermerFacture);
  const tableau = useCockpit((state) => state.tableau);
  const charger = useCockpit((state) => state.charger);
  const toast = useCockpit((state) => state.toast);
  const suivrePaiement = useCockpit((state) => state.suivrePaiement);
  const clients = tableau?.clients ?? [];

  const [f, setF] = useState<Saisie>({
    clientId: 0,
    libelle: "Accompagnement mensuel",
    montantHT: 1200,
    tva: "FR_200",
    echeanceJours: 30,
  });
  const [etapes, setEtapes] = useState<Etat[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [numero, setNumero] = useState("");
  const [lien, setLien] = useState<{ url: string; simule: boolean } | null>(null);
  const idFacture = useRef<number | null>(null);

  const [ouvertAvant, setOuvertAvant] = useState(false);
  if (open !== ouvertAvant) {
    setOuvertAvant(open);
    if (open) {
      setF((x) => ({ ...x, clientId: clientInitial ?? clients[0]?.id ?? 0 }));
      setEtapes(null);
      setErreur(null);
      setNumero("");
      setLien(null);
    }
  }

  const client = clients.find((c) => c.id === f.clientId);
  const ttc = f.montantHT * (1 + TVA.find((t) => t.code === f.tva)!.taux);
  const envoyee = etapes?.[2] === "faite";
  const occupe = !!etapes && !erreur && !envoyee;

  async function lancer(depuis = 0) {
    setErreur(null);
    const suivi: Etat[] = [0, 1, 2].map((i) => (i < depuis ? "faite" : "attente"));
    const marquer = (i: number, e: Etat) => {
      suivi[i] = e;
      setEtapes([...suivi]);
    };
    let i = depuis;
    try {
      if (i === 0) {
        marquer(0, "en-cours");
        idFacture.current = (await api.creerBrouillon(f)).id;
        marquer(0, "faite");
        i = 1;
      }
      if (i === 1) {
        marquer(1, "en-cours");
        setNumero((await api.finaliser(idFacture.current!)).numero);
        marquer(1, "faite");
        i = 2;
      }
      marquer(2, "en-cours");
      await api.envoyer(idFacture.current!);
      marquer(2, "faite");
      setLien(await api.lienPaiement(idFacture.current!).catch(() => null));
    } catch (e) {
      marquer(i, "erreur");
      setErreur((e as Error).message);
    }
  }

  async function terminer() {
    fermer();
    await charger(true);
    if (!pathname.startsWith("/factures") && !pathname.startsWith("/entreprises"))
      router.push("/factures");
    toast({
      ton: "succes",
      titre: `Facture ${numero} envoyée`,
      texte: `${euros(ttc, true)} TTC à ${client?.nom ?? "ton client"}, avec son lien de paiement.`,
    });
  }

  function quitter() {
    if (occupe) return;
    if (envoyee) terminer();
    else fermer();
  }

  async function copier() {
    try {
      await navigator.clipboard.writeText(lien!.url);
      toast({ ton: "info", titre: "Lien copié", texte: "Tu peux le coller dans un message à ton client." });
    } catch {
      toast({ ton: "erreur", titre: "Copie impossible", texte: lien!.url });
    }
  }

  function ouvrir() {
    window.open(lien!.url, "_blank", "noopener");
    if (idFacture.current) suivrePaiement(idFacture.current);
    terminer();
  }

  const ETAPES = [
    { titre: "Brouillon créé dans Pennylane", detail: "POST /customer_invoices" },
    {
      titre: numero ? `Facture ${numero} finalisée` : "Facture finalisée",
      detail: "PUT /customer_invoices/{id}/finalize",
    },
    {
      titre: client?.email ? `Envoyée à ${client.email}` : "Envoyée par e-mail",
      detail: "POST /customer_invoices/{id}/send_by_email",
    },
  ];

  function soumettre(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!f.montantHT || !f.libelle.trim() || !client) return;
    lancer();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && quitter()}>
      <DialogContent
        className="max-w-[560px]"
        onEscapeKeyDown={(e) => occupe && e.preventDefault()}
        onPointerDownOutside={(e) => occupe && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Générer une facture</DialogTitle>
          <DialogDescription>
            Créée, numérotée et envoyée à ton client par l&apos;API Pennylane
            {tableau?.mode === "demo" ? " (ici, la démo : rien ne part vraiment)." : "."}
          </DialogDescription>
        </DialogHeader>

        {!etapes ? (
          <form onSubmit={soumettre} noValidate className="flex flex-col">
            <FormSection title="Facture">
              <Field label="Client" htmlFor="facture-client">
                <Select
                  value={f.clientId ? String(f.clientId) : undefined}
                  onValueChange={(v) => setF({ ...f, clientId: Number(v) })}
                >
                  <SelectTrigger id="facture-client">
                    <SelectValue placeholder="Choisis un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Prestation" htmlFor="facture-libelle">
                <Input
                  id="facture-libelle"
                  value={f.libelle}
                  maxLength={120}
                  onChange={(e) => setF({ ...f, libelle: e.target.value })}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Montant HT" htmlFor="facture-montant">
                  <div className="relative">
                    <Input
                      id="facture-montant"
                      type="number"
                      min={1}
                      step={0.01}
                      inputMode="decimal"
                      value={f.montantHT || ""}
                      onChange={(e) => setF({ ...f, montantHT: Number(e.target.value) })}
                      className="pr-7 tabular-nums"
                    />
                    <span
                      aria-hidden
                      className="text-subtle pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[14px] leading-none"
                    >
                      €
                    </span>
                  </div>
                </Field>
                <Field label="À payer sous" htmlFor="facture-echeance">
                  <Choix
                    label="Délai de paiement"
                    valeur={f.echeanceJours}
                    options={ECHEANCES.map((j) => ({ valeur: j, libelle: `${j} j` }))}
                    onChange={(j) => setF({ ...f, echeanceJours: j })}
                  />
                </Field>
              </div>
              <Field label="TVA" htmlFor="facture-tva">
                <Choix
                  label="Taux de TVA"
                  valeur={f.tva}
                  options={TVA.map((t) => ({ valeur: t.code, libelle: t.libelle }))}
                  onChange={(tva) => setF({ ...f, tva })}
                />
              </Field>
            </FormSection>
            <DialogFooter className="justify-between">
              <span className="flex items-baseline gap-1.5">
                <span className="lead-style font-semibold tabular-nums">{euros(ttc, true)}</span>
                <span className="caption-style text-subtle">TTC</span>
              </span>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={!f.montantHT || !f.libelle.trim() || !client}
              >
                Créer et envoyer
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <div aria-live="polite" className="flex flex-col">
              {ETAPES.map((e, i) => (
                <div
                  key={e.detail}
                  className="flex items-start gap-3 px-6 py-4 shadow-[inset_0_-1px_0_var(--line-strong)]"
                >
                  <span
                    className={cn(
                      "caption-style mt-px flex size-5 shrink-0 items-center justify-center rounded-full border",
                      etapes[i] === "faite"
                        ? "border-(--tag-green-border) bg-(--tag-green-bg) text-(--tag-green-text)"
                        : etapes[i] === "erreur"
                          ? "border-(--tag-red-border) bg-(--tag-red-bg) text-(--tag-red-text)"
                          : "border-line-strong bg-muted text-soft",
                    )}
                  >
                    {etapes[i] === "faite" ? (
                      <Check aria-hidden className="size-3" strokeWidth={3} />
                    ) : etapes[i] === "erreur" ? (
                      <TriangleAlert aria-hidden className="size-3" />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-2.5">
                    <span className="lead-style block truncate">{e.titre}</span>
                    <Progression key={etapes[i]} etat={etapes[i]} />
                    <code className="caption-style text-subtle block font-mono">{e.detail}</code>
                  </span>
                </div>
              ))}
              {erreur && (
                <p className="text-danger px-6 py-4 shadow-[inset_0_-1px_0_var(--line-strong)]">{erreur}</p>
              )}
              {lien && (
                <div className="flex flex-col gap-3 px-6 py-5">
                  <span className="eyebrow-style text-soft flex items-center gap-1.5">
                    <Link2 aria-hidden className="size-3" />
                    Lien de paiement
                  </span>
                  <code className="border-line-strong bg-secondary block truncate rounded-lg border px-3 py-2.5 font-mono text-[13px]">
                    {lien.url.replace(/^https?:\/\//, "")}
                  </code>
                  {!lien.simule && (
                    <p className="caption-style text-soft leading-[1.4]">
                      C&apos;est le PDF de la facture : il porte le bouton « Payer maintenant » si le paiement en
                      ligne est activé dans Pennylane.
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={copier}>
                      <Copy aria-hidden className="size-3" />
                      Copier
                    </Button>
                    <Button variant="primary" size="sm" onClick={ouvrir}>
                      <ExternalLink aria-hidden className="size-3" />
                      {lien.simule ? "Ouvrir le lien de paiement" : "Ouvrir la facture"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="justify-between">
              <span className="flex min-w-0 items-baseline gap-1.5">
                <span className="lead-style font-semibold tabular-nums">{euros(ttc, true)}</span>
                <span className="caption-style text-subtle truncate">TTC · {client?.nom}</span>
              </span>
              {erreur ? (
                <Button variant="secondary" size="sm" onClick={() => lancer(etapes.indexOf("erreur"))}>
                  Réessayer
                </Button>
              ) : envoyee ? (
                <Button variant="secondary" size="sm" onClick={terminer}>
                  Terminer
                </Button>
              ) : null}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
