"use client";

import { cn } from "@/lib/utils";
import { useCockpit } from "@/stores/cockpit-store";
import XIcon from "@/public/assets/images/companies/detail/x.svg";

const POINT = {
  succes: "bg-success",
  erreur: "bg-danger",
  info: "bg-chip",
} as const;

export default function Toasts() {
  const toasts = useCockpit((state) => state.toasts);
  const retirer = useCockpit((state) => state.retirerToast);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.ton === "erreur" ? "alert" : "status"}
          className="bg-popover border-line-strong shadow-overlay animate-in fade-in-0 slide-in-from-bottom-2 ease-power3-out pointer-events-auto flex items-start gap-3 rounded-xl border p-4 duration-300"
        >
          <span
            aria-hidden
            className="flex h-[14px] w-2 shrink-0 items-center justify-center"
          >
            <span className={cn("size-1.5 rounded-full", POINT[t.ton])} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="lead-style block font-medium">{t.titre}</span>
            {t.texte && (
              <span className="caption-style text-soft block leading-[1.35]">
                {t.texte}
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => retirer(t.id)}
            aria-label="Fermer"
            className="text-subtle hover:text-foreground -mt-0.5 -mr-1 cursor-pointer rounded-full p-0.5 transition-colors duration-150"
          >
            <XIcon aria-hidden className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
