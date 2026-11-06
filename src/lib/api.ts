import type { NouvelleFacture, Tableau } from '../../server/types'

async function appel<T>(chemin: string, init?: RequestInit): Promise<T> {
  const res = await fetch(chemin, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { erreur?: string }).erreur ?? `Erreur ${res.status}`)
  return data as T
}

const poster = <T,>(chemin: string, corps?: unknown) => appel<T>(chemin, { method: 'POST', body: JSON.stringify(corps ?? {}) })

export const api = {
  tableau: (frais = false) => appel<Tableau>(`/api/tableau${frais ? '?frais=1' : ''}`),
  creerBrouillon: (f: NouvelleFacture) => poster<{ id: number }>('/api/factures', f),
  finaliser: (id: number) => poster<{ id: number; numero: string }>(`/api/factures/${id}/finaliser`),
  envoyer: (id: number) => poster<{ ok: true }>(`/api/factures/${id}/envoyer`),
  reinitialiserDemo: () => poster<{ ok: true }>('/api/demo/reinitialiser'),
  urlPdf: (id: number) => `/api/factures/${id}/pdf`,
  /** Le lien de paiement d'une facture, en adresse complète (prête à copier). `simule` : page de paiement de la démo. */
  lienPaiement: async (id: number) => {
    const r = await appel<{ url: string; simule: boolean }>(`/api/factures/${id}/paiement`)
    return { ...r, url: new URL(r.url, location.origin).href }
  },
}
