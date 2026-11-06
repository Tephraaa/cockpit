const EUROS = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const EUROS_CENTIMES = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NOMBRE = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

const espace = (texte: string) => texte.replace(/\u202f/g, "\u00a0");

export function euros(valeur: number, centimes = false) {
  return espace((centimes ? EUROS_CENTIMES : EUROS).format(valeur));
}

export function nombre(valeur: number) {
  return espace(NOMBRE.format(valeur));
}

export function aujourdhui() {
  return new Date().toLocaleDateString("sv-SE");
}

export function jourCourt(iso: string | null) {
  if (!iso) return "—";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export function jourLong(iso: string | null) {
  if (!iso) return "—";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function joursDepuis(iso: string) {
  const jour = 86_400_000;
  return Math.max(
    0,
    Math.round(
      (Date.parse(`${aujourdhui()}T12:00:00`) - Date.parse(`${iso}T12:00:00`)) /
        jour,
    ),
  );
}

export function joursAvant(iso: string | null) {
  if (!iso) return null;
  const jour = 86_400_000;
  return Math.round(
    (Date.parse(`${iso}T12:00:00`) - Date.parse(`${aujourdhui()}T12:00:00`)) /
      jour,
  );
}

export function ilYaJours(iso: string) {
  const n = joursDepuis(iso);
  if (n === 0) return "aujourd'hui";
  if (n === 1) return "hier";
  return `il y a ${n} jours`;
}

export function pourcent(valeur: number) {
  const signe = valeur > 0 ? "+" : "";
  return `${signe}${valeur.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}

export function initiales(nom: string) {
  const mots = nom
    .replace(/^(dr|me|m\.|mme)\s+/i, "")
    .split(/\s+/)
    .filter(Boolean);
  return ((mots[0]?.[0] ?? "") + (mots[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function pluriel(n: number, mot: string, motPluriel = `${mot}s`) {
  return `${nombre(n)} ${n > 1 ? motPluriel : mot}`;
}
