"use client";

import { useRef, useState, type FormEvent } from "react";
import Avatar from "@/components/_ui/avatar";
import Button from "@/components/_ui/button";
import {
  Dialog,
  DialogClose,
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
import { Slider } from "@/components/_ui/slider";
import SegmentBar from "@/components/_common/segment-bar";
import FormSection from "./form-section";
import { aujourdhui } from "@/lib/format";
import { ETAPES, SEGMENTS, type Etape, type Segment } from "@/server/crm-types";
import { useCockpit } from "@/stores/cockpit-store";
import PlusIcon from "@/public/assets/images/_common/plus.svg";

const SOURCES = ["Site web", "Instagram", "LinkedIn", "Recommandation", "Salon", "Autre"];
const ECHANGES = ["Premier contact", "Appel", "E-mail", "Rendez-vous", "Devis", "Visite"];
const ETAPES_CREATION = ETAPES.filter((e) => e !== "Client");

type FormState = {
  nom: string;
  segment: Segment;
  etape: Etape;
  source: string;
  responsable: string;
  ville: string;
  contactNom: string;
  contactEmail: string;
  contactTelephone: string;
  pipeline: string;
  affaires: string;
  chances: number;
  echangeDate: string;
  echangeType: string;
  suite: string;
};

function formulaireVide(moi: string): FormState {
  return {
    nom: "",
    segment: "PME",
    etape: "Nouveau",
    source: SOURCES[0],
    responsable: moi,
    ville: "",
    contactNom: "",
    contactEmail: "",
    contactTelephone: "",
    pipeline: "",
    affaires: "1",
    chances: 20,
    echangeDate: aujourdhui(),
    echangeType: ECHANGES[0],
    suite: "",
  };
}

export default function NewCompanyDialog() {
  const open = useCockpit((state) => state.newCompanyOpen);
  const setOpen = useCockpit((state) => state.setNewCompanyOpen);
  const crm = useCockpit((state) => state.crm);
  const ajouter = useCockpit((state) => state.ajouterEntreprise);
  const openDetail = useCockpit((state) => state.openDetail);
  const toast = useCockpit((state) => state.toast);
  const moi = crm?.moi ?? "";
  const [form, setForm] = useState<FormState>(() => formulaireVide(moi));
  const [erreurNom, setErreurNom] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const nomRef = useRef<HTMLInputElement>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nom = form.nom.trim();
    if (!nom) {
      setErreurNom("Donne un nom à l'entreprise.");
      nomRef.current?.focus();
      return;
    }
    setEnvoi(true);
    const e = await ajouter({
      nom,
      segment: form.segment,
      etape: form.etape,
      etiquettes: form.source === "Autre" ? [] : [form.source],
      responsable: form.responsable || moi,
      ville: form.ville.trim(),
      contact: {
        nom: form.contactNom.trim(),
        email: form.contactEmail.trim(),
        telephone: form.contactTelephone.trim(),
      },
      pipeline: Math.max(0, Math.round(Number(form.pipeline) || 0)),
      affaires: Math.max(0, Math.round(Number(form.affaires) || 0)),
      chances: form.etape === "Gagné" ? 100 : form.etape === "Perdu" ? 0 : form.chances,
      dernierEchange: { date: form.echangeDate || aujourdhui(), libelle: form.echangeType },
      suite: form.suite.trim(),
    });
    setEnvoi(false);
    if (!e) return;
    setOpen(false);
    toast({ ton: "succes", titre: `${e.nom} ajoutée au CRM`, texte: `Étape : ${e.etape}, suivie par ${e.responsable}.` });
    openDetail(e.id);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-w-[560px]"
        onOpenAutoFocus={() => setForm(formulaireVide(moi))}
        onCloseAutoFocus={() => setErreurNom(null)}
      >
        <form onSubmit={handleSubmit} noValidate className="flex max-h-[85dvh] flex-col overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle entreprise</DialogTitle>
            <DialogDescription>
              Ajoute un prospect à ton pipeline. Il apparaît tout de suite dans ton CRM.
            </DialogDescription>
          </DialogHeader>

          <FormSection title="Entreprise">
            <Field label="Nom de l'entreprise" htmlFor="entreprise-nom" required error={erreurNom ?? undefined}>
              <Input
                ref={nomRef}
                id="entreprise-nom"
                value={form.nom}
                maxLength={80}
                onChange={(event) => {
                  update("nom", event.target.value);
                  if (erreurNom) setErreurNom(null);
                }}
                placeholder="Boulangerie du Parc"
                autoComplete="off"
                aria-invalid={erreurNom ? true : undefined}
                aria-describedby={erreurNom ? "entreprise-nom-error" : undefined}
                className="aria-invalid:border-danger"
                autoFocus
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Segment" htmlFor="entreprise-segment">
                <Select value={form.segment} onValueChange={(v) => update("segment", v as Segment)}>
                  <SelectTrigger id="entreprise-segment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEGMENTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Étape" htmlFor="entreprise-etape">
                <Select value={form.etape} onValueChange={(v) => update("etape", v as Etape)}>
                  <SelectTrigger id="entreprise-etape">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ETAPES_CREATION.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Venue par" htmlFor="entreprise-source">
                <Select value={form.source} onValueChange={(v) => update("source", v)}>
                  <SelectTrigger id="entreprise-source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Ville" htmlFor="entreprise-ville">
                <Input
                  id="entreprise-ville"
                  value={form.ville}
                  maxLength={60}
                  onChange={(event) => update("ville", event.target.value)}
                  placeholder="Lyon"
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Contact">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom" htmlFor="contact-nom">
                <Input
                  id="contact-nom"
                  value={form.contactNom}
                  maxLength={80}
                  onChange={(event) => update("contactNom", event.target.value)}
                  placeholder="Prénom Nom"
                />
              </Field>
              <Field label="Téléphone" htmlFor="contact-telephone">
                <Input
                  id="contact-telephone"
                  type="tel"
                  value={form.contactTelephone}
                  maxLength={30}
                  onChange={(event) => update("contactTelephone", event.target.value)}
                  className="tabular-nums"
                />
              </Field>
            </div>
            <Field label="E-mail" htmlFor="contact-email">
              <Input
                id="contact-email"
                type="email"
                value={form.contactEmail}
                maxLength={120}
                onChange={(event) => update("contactEmail", event.target.value)}
                placeholder="contact@entreprise.fr"
              />
            </Field>
          </FormSection>

          <FormSection title="Responsable et affaire">
            <Field label="Responsable" htmlFor="entreprise-responsable">
              <Select value={form.responsable || moi} onValueChange={(v) => update("responsable", v)}>
                <SelectTrigger id="entreprise-responsable">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(crm?.equipe ?? []).map((m) => (
                    <SelectItem key={m.nom} value={m.nom}>
                      <span className="flex items-center gap-2">
                        <Avatar nom={m.nom} ton={m.ton} />
                        {m.nom}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Montant espéré (€ HT)" htmlFor="entreprise-pipeline">
                <div className="relative">
                  <Input
                    id="entreprise-pipeline"
                    type="number"
                    min={0}
                    step={100}
                    inputMode="numeric"
                    value={form.pipeline}
                    onChange={(event) => update("pipeline", event.target.value)}
                    placeholder="4500"
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
              <Field label="Affaires en cours" htmlFor="entreprise-affaires">
                <Input
                  id="entreprise-affaires"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={form.affaires}
                  onChange={(event) => update("affaires", event.target.value)}
                  className="tabular-nums"
                />
              </Field>
            </div>

            <Field
              label="Chances de signer"
              htmlFor="entreprise-chances"
              trailing={
                <span className="caption-style text-foreground tabular-nums">{form.chances} %</span>
              }
            >
              <div className="flex flex-col gap-3">
                <Slider
                  id="entreprise-chances"
                  aria-label="Chances de signer"
                  min={0}
                  max={100}
                  step={1}
                  value={[form.chances]}
                  onValueChange={([value]) => update("chances", value)}
                />
                <SegmentBar
                  percent={form.chances}
                  segments={40}
                  className="h-3 w-full border border-white/4 px-px"
                  segmentClassName="h-2"
                  trackClassName="bg-white/8"
                />
              </div>
            </Field>
          </FormSection>

          <FormSection title="Dernier échange">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date" htmlFor="echange-date">
                <Input
                  id="echange-date"
                  type="date"
                  max={aujourdhui()}
                  value={form.echangeDate}
                  onChange={(event) => update("echangeDate", event.target.value)}
                  className="tabular-nums"
                />
              </Field>
              <Field label="Type" htmlFor="echange-type">
                <Select value={form.echangeType} onValueChange={(v) => update("echangeType", v)}>
                  <SelectTrigger id="echange-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ECHANGES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Ce qu'il reste à faire" htmlFor="entreprise-suite">
              <Input
                id="entreprise-suite"
                value={form.suite}
                maxLength={80}
                onChange={(event) => update("suite", event.target.value)}
                placeholder="Envoyer le devis vendredi"
              />
            </Field>
          </FormSection>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="subtle" size="sm">
                Annuler
              </Button>
            </DialogClose>
            <Button variant="primary" size="sm" type="submit" disabled={envoi}>
              <PlusIcon aria-hidden className="size-3" />
              {envoi ? "Création…" : "Créer l'entreprise"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
