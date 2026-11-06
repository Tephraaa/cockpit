import { useEffect, useState, type CSSProperties } from 'react'
import { RDV, TYPES_RDV, jourOuvre } from '../data/agenda'

const DEBUT = 8 // la grille va de 8 h à 19 h
const FIN = 19
const JOURS = [-2, -1, 0, 1, 2]
const minutes = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3))
/** Position dans la journée affichée, de 0 (8 h) à 1 (19 h). */
const place = (min: number) => (min - DEBUT * 60) / ((FIN - DEBUT) * 60)

/** La semaine en cours : rendez-vous clients, tournages, appels et points d'équipe (données de src/data/agenda.ts). */
export default function Agenda() {
  const [maintenant, setMaintenant] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setMaintenant(new Date()), 60_000)
    return () => window.clearInterval(t)
  }, [])

  const jours = JOURS.map((j) => ({ j, date: jourOuvre(j) }))
  const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString('fr-FR', o)
  const periode = `du ${fmt(jours[0].date, { day: 'numeric', month: 'long' })} au ${fmt(jours[4].date, { day: 'numeric', month: 'long' })}`
  const estAujourdhui = (d: Date) => d.toDateString() === maintenant.toDateString()
  const ligne = place(maintenant.getHours() * 60 + maintenant.getMinutes())

  return (
    <section className="carte agenda page-pleine" aria-label="Agenda">
      <div className="carte__tete">
        <h2 className="etiquette">Agenda</h2>
        <span className="journee__date">{periode}</span>
        <ul className="agenda__legende">
          {Object.values(TYPES_RDV).map((t) => (
            <li key={t.libelle}>
              <span className={`agenda__puce agenda__puce--${t.couleur}`} />
              {t.libelle}
            </li>
          ))}
        </ul>
      </div>
      <div className="agenda__defilement">
        <div className="agenda__grille">
          <span />
          {jours.map(({ j, date }) => (
            <p key={j} className={`agenda__jour${estAujourdhui(date) ? ' est-aujourdhui' : ''}`}>
              {fmt(date, { weekday: 'short' })} <strong>{date.getDate()}</strong>
            </p>
          ))}
          <div className="agenda__heures" aria-hidden="true">
            {Array.from({ length: FIN - DEBUT + 1 }, (_, i) => (
              <span key={i} style={{ '--y': i / (FIN - DEBUT) } as CSSProperties}>
                {DEBUT + i} h
              </span>
            ))}
          </div>
          {jours.map(({ j, date }) => (
            <div key={j} className={`agenda__colonne${estAujourdhui(date) ? ' est-aujourdhui' : ''}`}>
              {Array.from({ length: FIN - DEBUT - 1 }, (_, i) => (
                <i key={i} className="agenda__trait" style={{ '--y': (i + 1) / (FIN - DEBUT) } as CSSProperties} />
              ))}
              {RDV.filter((r) => r.j === j).map((r) => {
                const debut = place(minutes(r.debut))
                const style = { '--y': debut, '--h': place(minutes(r.fin)) - debut } as CSSProperties
                return (
                  <article key={r.debut + r.titre} className={`rdv rdv--${TYPES_RDV[r.type].couleur}`} style={style}>
                    <p className="rdv__heure">
                      {r.debut} → {r.fin}
                    </p>
                    <p className="rdv__titre">{r.titre}</p>
                    {r.avec && <p className="rdv__avec">{r.avec}</p>}
                  </article>
                )
              })}
              {estAujourdhui(date) && ligne > 0 && ligne < 1 && <span className="agenda__maintenant" style={{ '--y': ligne } as CSSProperties} />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
