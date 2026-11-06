import type { CSSProperties } from 'react'
import { Blocks, CalendarDays, Gauge, LayoutDashboard, ListChecks, Moon, MoreVertical, ReceiptEuro, RefreshCw, RotateCcw, Settings, Sparkles, Users, type LucideIcon } from 'lucide-react'
import type { Tableau } from '../../server/types'
import BarrePoints from '../components/BarrePoints'
import Logo from '../components/Logo'
import { usePopover } from '../components/usePopover'
import { bruit } from '../lib/intro'
import { euros, initiales } from '../lib/format'
import type { Theme } from '../lib/theme'

export type PageId = 'accueil' | 'mission' | 'clients' | 'taches' | 'agenda' | 'pennylane' | 'outils' | 'parametres'
type Lien = { id: PageId; libelle: string; icone: LucideIcon }

export const LIENS: Lien[] = [
  { id: 'accueil', libelle: 'Tableau de bord', icone: LayoutDashboard },
  { id: 'mission', libelle: 'Mission control', icone: Gauge },
  { id: 'clients', libelle: 'Clients', icone: Users },
  { id: 'taches', libelle: 'Tâches', icone: ListChecks },
  { id: 'agenda', libelle: 'Agenda', icone: CalendarDays },
  { id: 'pennylane', libelle: 'Pennylane', icone: ReceiptEuro },
  { id: 'outils', libelle: 'Outils', icone: Blocks },
  { id: 'parametres', libelle: 'Paramètres', icone: Settings },
]
const lien = (id: PageId) => LIENS.find((l) => l.id === id)!
const GROUPES: { groupe: string; liens: PageId[] }[] = [
  { groupe: '', liens: ['accueil', 'mission', 'clients', 'taches', 'agenda'] },
  { groupe: 'Modules', liens: ['pennylane'] },
  { groupe: 'Réglages', liens: ['outils', 'parametres'] },
]

/** La lueur de l'élément actif : halo et cœur en CSS, plus une poussière d'étincelles qui se pose au chargement. */
function Lueur() {
  return (
    <span className="lueur" aria-hidden="true">
      {Array.from({ length: 26 }, (_, i) => {
        const r = bruit(i, 7)
        const x = 78 + bruit(i, 3) * 20 // en % de la largeur : les étincelles se massent à droite
        const y = 50 + (bruit(i, 11) - 0.5) * 46
        const style = {
          left: `${x}%`,
          top: `${y}%`,
          opacity: 0.15 + ((x - 78) / 20) * 0.7,
          '--dx': `${-(5 + (1 - (x - 78) / 20) * 10 + r * 4).toFixed(1)}px`,
          '--dy': `${((bruit(i, 5) - 0.5) * 6).toFixed(1)}px`,
          animationDelay: `${Math.round(150 + r * 380 + i * 5)}ms`,
        } as CSSProperties
        return <i key={i} className="etincelle" style={style} />
      })}
      <span className="lueur__barre" />
    </span>
  )
}

type Props = {
  page: PageId
  allerA: (p: PageId) => void
  tableau: Tableau | null
  intro: boolean
  theme: Theme
  changerTheme: (t: Theme) => void
  actualiser: () => void
  reinitialiser: () => void
}

export default function MenuLateral({ page, allerA, tableau, intro, theme, changerTheme, actualiser, reinitialiser }: Props) {
  const menu = usePopover()
  const objectif = tableau?.objectif
  return (
    <aside className="menu-lateral">
      <div className="marque">
        <Logo />
        Cockpit
        {tableau && (
          <span className={`marque__mode${tableau.mode === 'pennylane' ? ' marque__mode--live' : ''}`}>
            {tableau.mode === 'pennylane' ? 'Pennylane' : 'Démo'}
          </span>
        )}
      </div>

      <nav className="nav" aria-label="Navigation principale">
        {GROUPES.map((g) => (
          <div className="nav__groupe" key={g.groupe || 'principal'}>
            {g.groupe && <p className="nav__titre">{g.groupe}</p>}
            {g.liens.map((id) => {
              const { libelle, icone: Icone } = lien(id)
              return (
                <button
                  key={id}
                  className={`nav__lien${page === id ? ' est-actif' : ''}`}
                  aria-current={page === id ? 'page' : undefined}
                  onClick={() => allerA(id)}
                >
                  <Icone strokeWidth={1.4} />
                  {libelle}
                  {page === id && <Lueur key={page} />}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="menu-lateral__pied">
        {objectif && (
          <div className="objectif">
            <p className="objectif__titre">
              Objectif {objectif.annee}
              {objectif.auto && <span title="+10 % sur les 12 derniers mois"> · auto</span>}
            </p>
            <BarrePoints
              valeur={objectif.montant / objectif.cible}
              lignes={4}
              anime={intro}
              libelle={`${euros(objectif.montant)} sur ${euros(objectif.cible)}`}
            />
            <p className="objectif__pied">
              <span>
                <strong>{euros(objectif.montant)}</strong> / {euros(objectif.cible)}
              </span>
              <span>{Math.round((objectif.montant / objectif.cible) * 100)} %</span>
            </p>
          </div>
        )}

        <div className="compte" ref={menu.ref}>
          <span className="compte__initiales">{tableau ? initiales(tableau.entreprise) : '··'}</span>
          <div className="compte__texte">
            <p className="compte__nom">{tableau?.entreprise ?? 'Chargement…'}</p>
            <p className="compte__role">{tableau?.mode === 'pennylane' ? 'Données Pennylane' : 'Entreprise fictive'}</p>
          </div>
          <button className="bouton-icone" aria-label="Options" aria-expanded={menu.ouvert} onClick={menu.basculer}>
            <MoreVertical />
          </button>
          {menu.ouvert && (
            <div className="menu menu--haut" role="menu">
              <button className="menu__item" role="menuitemcheckbox" aria-checked={theme === 'sombre'} onClick={() => changerTheme(theme === 'sombre' ? 'clair' : 'sombre')}>
                <Moon />
                Thème sombre
                <span className={`interrupteur${theme === 'sombre' ? ' est-actif' : ''}`} />
              </button>
              <button className="menu__item" role="menuitem" onClick={() => (actualiser(), menu.setOuvert(false))}>
                <RefreshCw />
                Actualiser les données
              </button>
              {tableau?.mode === 'demo' && (
                <button className="menu__item" role="menuitem" onClick={() => (reinitialiser(), menu.setOuvert(false))}>
                  <RotateCcw />
                  Réinitialiser la démo
                </button>
              )}
              <div className="menu__separateur" />
              <a className="menu__item" role="menuitem" href="https://pennylane.readme.io/reference" target="_blank" rel="noreferrer">
                <Sparkles />
                Doc de l'API Pennylane
              </a>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
