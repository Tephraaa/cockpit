import { initiales } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Ton } from "@/server/crm-types";

type AvatarProps = {
  nom: string;
  ton?: Ton;
  className?: string;
};

const TON_CLASS: Record<Ton, string> = {
  blue: "border-(--tag-blue-border) bg-(--tag-blue-bg) text-(--tag-blue-text)",
  purple:
    "border-(--tag-purple-border) bg-(--tag-purple-bg) text-(--tag-purple-text)",
  green:
    "border-(--tag-green-border) bg-(--tag-green-bg) text-(--tag-green-text)",
  moss: "border-(--tag-moss-border) bg-(--tag-moss-bg) text-(--tag-moss-text)",
  red: "border-(--tag-red-border) bg-(--tag-red-bg) text-(--tag-red-text)",
  orange:
    "border-(--tag-orange-border) bg-(--tag-orange-bg) text-(--tag-orange-text)",
  amber:
    "border-(--tag-amber-border) bg-(--tag-amber-bg) text-(--tag-amber-text)",
  teal: "border-(--tag-teal-border) bg-(--tag-teal-bg) text-(--tag-teal-text)",
  yellow:
    "border-(--tag-yellow-border) bg-(--tag-yellow-bg) text-(--tag-yellow-text)",
  neutral:
    "border-(--tag-neutral-border) bg-(--tag-neutral-bg) text-(--tag-neutral-text)",
};

export default function Avatar({ nom, ton = "neutral", className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-full border text-[8.5px] leading-none font-semibold tracking-[0.02em] select-none",
        TON_CLASS[ton],
        className,
      )}
    >
      {initiales(nom)}
    </span>
  );
}
