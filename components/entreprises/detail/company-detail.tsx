"use client";

import { useState } from "react";
import Avatar from "@/components/_ui/avatar";
import Button from "@/components/_ui/button";
import Field from "@/components/_ui/field";
import { Input } from "@/components/_ui/input";
import Tag from "@/components/_ui/tag";
import { ScrollArea } from "@/components/_ui/scroll-area";
import { Slider } from "@/components/_ui/slider";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/_ui/sheet";
import FilterMenu from "@/components/_common/filter-menu";
import SegmentBar from "@/components/_common/segment-bar";
import DetailSection from "./detail-section";
import PipelineHealth from "./pipeline-health";
import ActivityTrend from "./activity-trend";
import PennylaneSection from "./pennylane-section";
import { etiquettes, membre } from "@/lib/cockpit";
import { aujourdhui } from "@/lib/format";
import { ETAPES, type Entreprise, type Etape } from "@/server/crm-types";
import { useCockpit } from "@/stores/cockpit-store";
import BuildingIcon from "@/public/assets/images/companies/detail/building.svg";
import XIcon from "@/public/assets/images/companies/detail/x.svg";
import MailIcon from "@/public/assets/images/companies/detail/mail-04.svg";
import PhoneIcon from "@/public/assets/images/companies/detail/phone.svg";

const ETAPE_OPTIONS = ETAPES.map((etape) => ({ value: etape, label: etape }));

type Brouillon = Pick<Entreprise, "etape" | "chances" | "pipeline" | "suite" | "notes">;

function brouillonDe(e: Entreprise): Brouillon {
  return {
    etape: e.etape,
    chances: e.chances,
    pipeline: e.pipeline,
    suite: e.suite,
    notes: e.notes,
  };
}

export default function CompanyDetail() {
  const detailId = useCockpit((state) => state.detailId);
  const detailOpen = useCockpit((state) => state.detailOpen);
  const crm = useCockpit((state) => state.crm);
  const closeDetail = useCockpit((state) => state.closeDetail);
  const openProfile = useCockpit((state) => state.openProfile);
  const modifier = useCockpit((state) => state.modifierEntreprise);
  const toast = useCockpit((state) => state.toast);

  const company = crm?.entreprises.find((e) => e.id === detailId);
  const owner = company && crm ? membre(crm.equipe, company.responsable) : null;
  const [brouillon, setBrouillon] = useState<Brouillon | null>(null);
  const ouverte = detailOpen && company ? company.id : null;
  const [ouverteAvant, setOuverteAvant] = useState<string | null>(null);
  if (ouverte !== ouverteAvant) {
    setOuverteAvant(ouverte);
    if (ouverte && company) setBrouillon(brouillonDe(company));
  }

  const modifie =
    company &&
    brouillon &&
    JSON.stringify(brouillonDe(company)) !== JSON.stringify(brouillon);

  async function enregistrer() {
    if (!company || !brouillon || !modifie) return closeDetail();
    const chances =
      brouillon.etape === "Gagné" || brouillon.etape === "Client"
        ? 100
        : brouillon.etape === "Perdu"
          ? 0
          : brouillon.chances;
    await modifier(company.id, {
      ...brouillon,
      chances,
      dernierEchange:
        brouillon.etape !== company.etape
          ? { date: aujourdhui(), libelle: `Passé en ${brouillon.etape}`.slice(0, 40) }
          : company.dernierEchange,
    });
    toast({
      ton: "succes",
      titre: `${company.nom} mise à jour`,
      texte:
        brouillon.etape !== company.etape
          ? `Étape : ${brouillon.etape}.`
          : "Les changements sont enregistrés dans ton CRM.",
    });
    closeDetail();
  }

  const maj = <K extends keyof Brouillon>(cle: K, valeur: Brouillon[K]) =>
    setBrouillon((b) => (b ? { ...b, [cle]: valeur } : b));

  return (
    <Sheet
      open={detailOpen && company !== undefined}
      onOpenChange={(open) => !open && closeDetail()}
    >
      <SheetContent side="right" className="sm:w-[560px] sm:max-w-[560px]">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <BuildingIcon aria-hidden className="text-icon size-3.5" />
            <SheetTitle>Fiche entreprise</SheetTitle>
          </div>
          <SheetDescription className="sr-only">
            Contact, étape, santé du pipeline, activité et factures Pennylane
          </SheetDescription>
          <SheetClose asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="-mr-1"
              aria-label="Fermer la fiche"
            >
              <XIcon aria-hidden className="text-foreground size-4" />
            </Button>
          </SheetClose>
        </SheetHeader>

        {company && owner && brouillon && (
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex items-start gap-3 p-5 shadow-[inset_0_-1px_0_var(--line-strong)]">
              <span className="bg-muted flex size-[50px] shrink-0 items-center justify-center rounded-[12.5px] shadow-[0px_6.25px_6.25px_0px_rgba(15,15,15,0.24),0px_0px_0px_1.563px_#232323]">
                <span className="h2-style text-soft">
                  {company.nom.slice(0, 1)}
                </span>
              </span>
              <div className="flex min-w-0 flex-col gap-3">
                <h2 className="truncate">{company.nom}</h2>
                <div className="flex flex-wrap items-center gap-[3px]">
                  {etiquettes(company).map((tag) => (
                    <Tag key={tag.libelle} tone={tag.ton} size="sm">
                      {tag.libelle}
                    </Tag>
                  ))}
                </div>
              </div>
            </div>

            <DetailSection title="Contact">
              <div className="lead-style flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                  <Button
                    variant="ghost"
                    size="none"
                    onClick={() => openProfile(owner.nom)}
                    aria-label={`Ouvrir le profil de ${owner.nom}`}
                    className="lead-style text-foreground -mx-1.5 gap-1.5 px-1.5 py-1 font-medium"
                  >
                    <Avatar nom={owner.nom} ton={owner.ton} />
                    {owner.nom}
                  </Button>
                  <span className="caption-style text-soft">
                    suit cette entreprise
                    {company.ville ? `, à ${company.ville}` : ""}
                  </span>
                </div>
                {company.contact && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                    {company.contact.nom && (
                      <span className="font-medium">{company.contact.nom}</span>
                    )}
                    {company.contact.email && (
                      <a
                        href={`mailto:${company.contact.email}`}
                        className="hover:text-soft flex items-center gap-1 transition-colors duration-150"
                      >
                        <MailIcon aria-hidden className="text-soft size-3" />
                        {company.contact.email}
                      </a>
                    )}
                    {company.contact.telephone && (
                      <span className="flex items-center gap-1 tabular-nums">
                        <PhoneIcon aria-hidden className="text-soft size-3" />
                        {company.contact.telephone}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </DetailSection>

            <DetailSection
              title="Étape et suite"
              action={
                <FilterMenu
                  value={brouillon.etape}
                  options={ETAPE_OPTIONS}
                  onChange={(v) => maj("etape", v as Etape)}
                  align="end"
                />
              }
            >
              <div className="flex flex-col gap-4">
                {brouillon.etape !== "Client" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Pipeline (€ HT)" htmlFor="fiche-pipeline">
                      <Input
                        id="fiche-pipeline"
                        type="number"
                        min={0}
                        step={100}
                        inputMode="numeric"
                        value={brouillon.pipeline}
                        onChange={(e) => maj("pipeline", Math.max(0, Math.round(Number(e.target.value) || 0)))}
                        className="tabular-nums"
                      />
                    </Field>
                    <Field
                      label="Chances de signer"
                      htmlFor="fiche-chances"
                      trailing={
                        <span className="caption-style text-foreground tabular-nums">
                          {brouillon.chances} %
                        </span>
                      }
                    >
                      <div className="flex h-9 flex-col justify-center gap-2">
                        <Slider
                          id="fiche-chances"
                          aria-label="Chances de signer"
                          min={0}
                          max={100}
                          step={1}
                          value={[brouillon.chances]}
                          onValueChange={([v]) => maj("chances", v)}
                        />
                      </div>
                    </Field>
                  </div>
                )}
                <Field label="Ce qu'il reste à faire" htmlFor="fiche-suite">
                  <Input
                    id="fiche-suite"
                    value={brouillon.suite}
                    maxLength={80}
                    onChange={(e) => maj("suite", e.target.value)}
                    placeholder="Relancer le devis jeudi"
                  />
                </Field>
                <Field label="Notes" htmlFor="fiche-notes">
                  <textarea
                    id="fiche-notes"
                    value={brouillon.notes}
                    maxLength={2000}
                    rows={3}
                    onChange={(e) => maj("notes", e.target.value)}
                    placeholder="Ce qu'il faut retenir de cette entreprise"
                    className="border-line-strong bg-secondary text-foreground placeholder:text-subtle focus-visible:border-ring ease-power3-out min-h-[84px] w-full resize-y rounded-lg border px-3 py-2.5 text-[14px] leading-[1.4] outline-none transition-[border-color] duration-150"
                  />
                </Field>
              </div>
            </DetailSection>

            {company.etape !== "Client" && (
              <DetailSection title="Santé du pipeline">
                <PipelineHealth company={{ ...company, ...brouillon }} />
              </DetailSection>
            )}

            <DetailSection title="Activité">
              <ActivityTrend company={company} />
            </DetailSection>

            <PennylaneSection company={company} />

            {company.etape === "Client" && (
              <DetailSection title="Chances de signer" className="shadow-none">
                <div className="flex flex-col gap-2">
                  <div className="caption-style flex items-center justify-between">
                    <span>
                      {company.affaires > 1
                        ? `Sur les ${company.affaires} affaires en cours`
                        : company.affaires === 1
                          ? "Sur l'affaire en cours"
                          : "Aucune affaire en cours"}
                    </span>
                    <span>{company.chances} %</span>
                  </div>
                  <SegmentBar
                    percent={company.chances}
                    segments={63}
                    className="h-3 w-full border border-white/4 px-px"
                    segmentClassName="h-2"
                    trackClassName="bg-white/8"
                    anime={{ delai: 250, pas: 6 }}
                  />
                </div>
              </DetailSection>
            )}
          </ScrollArea>
        )}

        <SheetFooter>
          <span className="caption-style text-subtle">
            {company ? `Dans ton CRM depuis le ${new Date(`${company.creeLe}T12:00:00`).toLocaleDateString("fr-FR")}` : ""}
          </span>
          <div className="flex items-center gap-2">
            <SheetClose asChild>
              <Button variant="subtle" size="sm">
                Annuler
              </Button>
            </SheetClose>
            <Button variant="primary" size="sm" onClick={enregistrer} disabled={!modifie}>
              Enregistrer
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
