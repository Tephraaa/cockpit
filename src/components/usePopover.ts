import { useEffect, useRef, useState } from 'react'

/** Ouvre et ferme un petit menu : clic à l'extérieur ou Échap le referment. */
export function usePopover<T extends HTMLElement = HTMLDivElement>() {
  const [ouvert, setOuvert] = useState(false)
  const ref = useRef<T>(null)
  useEffect(() => {
    if (!ouvert) return
    const clic = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOuvert(false)
    const touche = (e: KeyboardEvent) => e.key === 'Escape' && setOuvert(false)
    document.addEventListener('mousedown', clic)
    document.addEventListener('keydown', touche)
    return () => {
      document.removeEventListener('mousedown', clic)
      document.removeEventListener('keydown', touche)
    }
  }, [ouvert])
  return { ouvert, setOuvert, ref, basculer: () => setOuvert((o) => !o) }
}
