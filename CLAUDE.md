@AGENTS.md

# Cockpit : consignes pour Claude Code

Cockpit est le mission control d'une petite entreprise : un CRM, les factures Pennylane, un tableau de bord,
Mission control, un agenda et des tâches. Tout le texte de l'interface est en français, et tutoie l'utilisateur.

## Où sont les choses

- `app/` : les pages (une par entrée du menu) et l'API (`app/api/[...chemin]/route.ts`, `app/payer/[numero]/route.ts`).
- `server/` : tout ce qui tourne côté serveur. `routeur.ts` reçoit les requêtes, `pennylane.ts` parle à l'API Pennylane, `faux-pennylane.ts` et `demo.ts` font la démo, `tableau.ts` calcule les chiffres, `crm.ts` lit et écrit le CRM dans `.cockpit/`.
- `server/crm-types.ts` : les types et les listes du CRM (segments, étapes). La page les importe d'ici, jamais de `crm.ts`, qui dépend de Node.
- `stores/cockpit-store.ts` : l'état de la page (données, filtres, fenêtres ouvertes, toasts).
- `components/_ui` et `components/_common` : les briques du style (boutons, étiquettes, barres, tableau, fenêtres). `components/<page>/` : les écrans.
- `data/mission.ts` et `data/agenda.ts` : la journée, les outils, les automatisations, l'agenda.

## Règles

- Le jeton Pennylane (`PENNYLANE_API_TOKEN`, dans `.env`) ne quitte jamais le serveur. Ne l'affiche jamais, ne le demande jamais dans la conversation : l'utilisateur le colle lui-même dans `.env`.
- Ne génère jamais de facture d'essai sur un vrai compte Pennylane : une facture finalisée reçoit un numéro et ne s'efface plus. Les essais se font dans la démo (sans jeton).
- `.cockpit/` contient les données de l'utilisateur : ne le supprime pas, ne le versionne pas.
- Style : garde celui du Sales CRM de Kargul Studio. Les couleurs sont dans `app/globals.css` (fond `#161616`, accent violet `--primary`, vert `--trend` pour l'argent), les étiquettes passent par `Tag` et ses tons, les pourcentages par `SegmentBar`, l'activité par `Sparkline`. Passe toujours un `variant` explicite à `Button`. Styles en Tailwind uniquement.
- Avec zustand, un sélecteur doit rendre une valeur stable : écris `useCockpit((s) => s.crm?.equipe) ?? VIDE`, jamais `useCockpit((s) => s.crm?.equipe ?? [])`, qui crée un tableau neuf à chaque rendu et fait boucler la page.
- Les exports CSV utilisent le point-virgule, pour Excel en français.
- Avant de rendre la main : `npm run check` et `npm run lint` doivent passer sans erreur. Ne coupe jamais une règle pour faire passer un contrôle : corrige le code.
