import { useEffect, useState } from 'react'

export type Theme = 'sombre' | 'clair'

/** Thème courant, enregistré dans le navigateur. Les couleurs se croisent en fondu pendant la bascule. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme === 'clair' ? 'clair' : 'sombre'))
  useEffect(() => {
    const racine = document.documentElement
    if (racine.dataset.theme === theme) return
    racine.classList.add('bascule-theme')
    racine.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'clair' ? '#eef2ef' : '#1e2320')
    try {
      localStorage.setItem('cockpit-theme', theme)
    } catch {
      // navigation privée : le choix ne sera simplement pas retenu
    }
    const t = window.setTimeout(() => racine.classList.remove('bascule-theme'), 320)
    return () => window.clearTimeout(t)
  }, [theme])
  return [theme, setTheme] as const
}
