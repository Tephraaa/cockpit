import { useSyncExternalStore } from 'react'

export type Toast = { id: number; titre: string; texte?: string; ton: 'succes' | 'erreur' | 'info'; sortie?: boolean }

let toasts: Toast[] = []
let suivant = 1
const abonnes = new Set<() => void>()
const publier = (liste: Toast[]) => {
  toasts = liste
  abonnes.forEach((f) => f())
}

/** Affiche une notification en bas à droite ; elle s'en va seule après 4,5 s. */
export function toast(t: Omit<Toast, 'id'>) {
  const id = suivant++
  publier([...toasts, { ...t, id }].slice(-4))
  window.setTimeout(() => fermer(id), 4500)
}

export function fermer(id: number) {
  if (!toasts.some((t) => t.id === id && !t.sortie)) return
  publier(toasts.map((t) => (t.id === id ? { ...t, sortie: true } : t)))
  window.setTimeout(() => publier(toasts.filter((t) => t.id !== id)), 220)
}

export const useToasts = () =>
  useSyncExternalStore(
    (f) => (abonnes.add(f), () => abonnes.delete(f)),
    () => toasts,
  )
