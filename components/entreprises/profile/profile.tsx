"use client";

import { useRouter } from "next/navigation";
import Avatar from "@/components/_ui/avatar";
import Button from "@/components/_ui/button";
import { ScrollArea } from "@/components/_ui/scroll-area";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/_ui/sheet";
import DetailSection from "../detail/detail-section";
import ProfileAccount from "./profile-account";
import { TOUS, membre } from "@/lib/cockpit";
import { euros } from "@/lib/format";
import { useCockpit } from "@/stores/cockpit-store";
import UsersIcon from "@/public/assets/images/companies/sidebar/users.svg";
import XIcon from "@/public/assets/images/companies/detail/x.svg";
import MailIcon from "@/public/assets/images/companies/detail/mail-04.svg";
import PhoneIcon from "@/public/assets/images/companies/detail/phone.svg";

export default function Profile() {
  const router = useRouter();
  const profileName = useCockpit((state) => state.profileName);
  const profileOpen = useCockpit((state) => state.profileOpen);
  const crm = useCockpit((state) => state.crm);
  const closeProfile = useCockpit((state) => state.closeProfile);
  const openDetail = useCockpit((state) => state.openDetail);
  const setFiltres = useCockpit((state) => state.setFiltres);
  const setVue = useCockpit((state) => state.setVue);

  const person = profileName && crm ? membre(crm.equipe, profileName) : null;
  const isMe = person?.nom === crm?.moi;
  const accounts = person
    ? (crm?.entreprises ?? [])
        .filter((e) => isMe || e.responsable === person.nom)
        .sort((a, b) => b.pipeline - a.pipeline)
    : [];

  const enCours = accounts.filter((e) => e.etape !== "Perdu");
  const affaires = enCours.reduce((s, e) => s + e.affaires, 0);
  const pipeline = enCours.reduce((s, e) => s + e.pipeline, 0);
  const moyenne = enCours.length
    ? Math.round(enCours.reduce((s, e) => s + e.chances, 0) / enCours.length)
    : 0;

  const stats = [
    { label: "Entreprises", value: String(accounts.length) },
    { label: "Affaires en cours", value: String(affaires) },
    { label: "Pipeline", value: euros(pipeline) },
    { label: "Chances moyennes", value: `${moyenne} %` },
  ];

  function showAccounts() {
    setVue("toutes");
    setFiltres({ responsable: isMe || !person ? TOUS : person.nom });
    closeProfile();
    router.push("/entreprises");
  }

  return (
    <Sheet
      open={profileOpen && person !== null}
      onOpenChange={(open) => !open && closeProfile()}
    >
      <SheetContent side="right" className="sm:w-[480px] sm:max-w-[480px]">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <UsersIcon aria-hidden className="text-icon size-3.5" />
            <SheetTitle>{isMe ? "Mon profil" : "Profil"}</SheetTitle>
          </div>
          <SheetDescription className="sr-only">
            Coordonnées, pipeline et entreprises suivies
          </SheetDescription>
          <SheetClose asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="-mr-1"
              aria-label="Fermer le profil"
            >
              <XIcon aria-hidden className="text-foreground size-4" />
            </Button>
          </SheetClose>
        </SheetHeader>

        {person && (
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex items-center gap-3 p-5 shadow-[inset_0_-1px_0_var(--line-strong)]">
              <Avatar
                nom={person.nom}
                ton={person.ton}
                className="size-[50px] text-[17px] shadow-[0px_6.25px_6.25px_0px_rgba(15,15,15,0.24),0px_0px_0px_1.563px_#232323]"
              />
              <div className="flex min-w-0 flex-col gap-2">
                <h2 className="truncate">{person.nom}</h2>
                <span className="caption-style text-soft block truncate">
                  {person.role}
                </span>
              </div>
            </div>

            {(person.email || person.telephone) && (
              <DetailSection title="Contact">
                <div className="lead-style flex flex-wrap items-center gap-x-4 gap-y-3">
                  {person.email && (
                    <a
                      href={`mailto:${person.email}`}
                      className="hover:text-soft ease-power3-in-out flex items-center gap-1 transition-colors duration-150"
                    >
                      <MailIcon aria-hidden className="text-soft size-3" />
                      {person.email}
                    </a>
                  )}
                  {person.telephone && (
                    <a
                      href={`tel:${person.telephone.replace(/[^\d+]/g, "")}`}
                      className="hover:text-soft ease-power3-in-out flex items-center gap-1 tabular-nums transition-colors duration-150"
                    >
                      <PhoneIcon aria-hidden className="text-soft size-3" />
                      {person.telephone}
                    </a>
                  )}
                </div>
              </DetailSection>
            )}

            <DetailSection title={isMe ? "Pipeline de l'équipe" : "Pipeline"}>
              <div className="grid grid-cols-2 gap-2">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="border-line-strong flex flex-col gap-3 rounded-lg border p-[11px]"
                  >
                    <span className="caption-style text-soft block">
                      {stat.label}
                    </span>
                    <span className="lead-style block tabular-nums">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </DetailSection>

            <DetailSection
              title={isMe ? "Les entreprises de l'équipe" : "Ses entreprises"}
              className="shadow-none"
            >
              {accounts.length > 0 ? (
                <ul className="-mx-2 flex flex-col gap-0.5">
                  {accounts.map((e) => (
                    <ProfileAccount
                      key={e.id}
                      company={e}
                      onOpen={() => openDetail(e.id)}
                    />
                  ))}
                </ul>
              ) : (
                <span className="caption-style text-subtle block">
                  Aucune entreprise pour l&apos;instant.
                </span>
              )}
            </DetailSection>
          </ScrollArea>
        )}

        <SheetFooter>
          <SheetClose asChild>
            <Button variant="subtle" size="sm">
              Fermer
            </Button>
          </SheetClose>
          <Button
            variant="primary"
            size="sm"
            onClick={showAccounts}
            disabled={accounts.length === 0}
          >
            {isMe ? "Voir toutes les entreprises" : "Filtrer le CRM sur ses entreprises"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
