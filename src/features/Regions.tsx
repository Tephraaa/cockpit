import { useMemo, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import type { Region } from '../../server/types'
import BarrePoints from '../components/BarrePoints'
import Points, { type Point } from '../components/Points'
import { delaiPoint, INTRO } from '../lib/intro'
import { euros } from '../lib/format'
import france from '../data/france.json'

type Carte = { colonnes: number; lignes: number; cases: [number, number, number][]; regions: { code: string; nom: string; repere: [number, number] }[] }
const CARTE = france as unknown as Carte
const COTE = 0.62 // un point occupe 62 % de sa case

type Props = { regions: Region[] | null; clientsActifs: number; nouveaux: number; intro: boolean }

export default function Regions({ regions, clientsActifs, nouveaux, intro }: Props) {
  const [epingle, setEpingle] = useState<string | null>(null)
  const actives = useMemo(() => new Set((regions ?? []).filter((r) => r.montant > 0).map((r) => r.code)), [regions])
  const top = (regions ?? []).filter((r) => r.montant > 0).slice(0, 3)
  const choisie = top.find((r) => r.code === epingle) ?? top[0]

  const { allumes, eteints } = useMemo(() => {
    const allumes: Point[] = []
    const eteints: Point[] = []
    for (const [c, l, k] of CARTE.cases) {
      const pt = { x: c, y: l }
      if (actives.has(CARTE.regions[k].code)) allumes.push({ ...pt, delai: delaiPoint(c / CARTE.colonnes, c, l) })
      if (!actives.has(CARTE.regions[k].code) || intro) eteints.push(pt)
    }
    return { allumes, eteints }
  }, [actives, intro])

  const position = (code: string) => {
    const r = CARTE.regions.find((x) => x.code === code)!
    return { x: ((r.repere[0] + COTE / 2) / CARTE.colonnes) * 100, y: ((r.repere[1] + COTE / 2) / CARTE.lignes) * 100 }
  }

  let bulle = null
  if (choisie) {
    const { x, y } = position(choisie.code)
    const enHaut = y > 38 // la bulle se met au-dessus du repère, sauf tout en haut de la carte
    const aDroite = x < 55
    const milieu = enHaut ? `calc(${y}% - 44px)` : `calc(${y}% + 44px)`
    const delai = { animationDelay: `${INTRO.reperes + 150}ms` }
    bulle = (
      <>
        <span className="lien-v" style={{ left: `${x}%`, top: enHaut ? milieu : `calc(${y}% + 5px)`, height: 39, ...delai }} />
        <span className="lien-h" style={{ left: aDroite ? `${x}%` : `calc(${x}% - 20px)`, top: milieu, width: 20, animationDelay: `${INTRO.reperes + 300}ms` }} />
        <div
          className="bulle bulle--region"
          style={{
            left: aDroite ? `calc(${x}% + 20px)` : undefined,
            right: aDroite ? undefined : `calc(${100 - x}% + 20px)`,
            top: milieu,
            translate: '0 -50%',
            animationDelay: `${INTRO.reperes + 420}ms`,
          }}
        >
          <p className="bulle__titre">{choisie.nom}</p>
          <p className="bulle__ligne">
            <span>{choisie.clients} client{choisie.clients > 1 ? 's' : ''}</span>
            <span>{euros(choisie.montant)}</span>
          </p>
        </div>
      </>
    )
  }

  return (
    <section className={`carte regions${intro ? ' est-intro' : ''}`} aria-label="Clients par région">
      <div className="regions__infos">
        <h2 className="etiquette">Clients par région</h2>
        <p className="chiffre">{regions ? `${clientsActifs} clients` : '—'}</p>
        {nouveaux > 0 && (
          <span className="tendance">
            <ArrowUp strokeWidth={2.6} aria-hidden="true" />
            {nouveaux} nouveau{nouveaux > 1 ? 'x' : ''} en 90 jours
          </span>
        )}
        <ul className="classement">
          {top.map((r) => (
            <li key={r.code} className={r.code === choisie?.code ? 'est-epingle' : ''} onMouseEnter={() => setEpingle(r.code)}>
              <span className="classement__nom">{r.nom}</span>
              <BarrePoints valeur={r.montant / top[0].montant} lignes={2} anime={intro} libelle={`${r.nom} : ${euros(r.montant)}`} />
              <span className="classement__montant">{euros(r.montant)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="carte-france">
        <Points
          repere={[CARTE.colonnes - 1 + COTE, CARTE.lignes - 1 + COTE]}
          taille={COTE}
          allumes={allumes}
          eteints={eteints}
          couleur="--vert"
          eclat="--vert-vif"
          couleurEteint="--point-eteint"
          anime={intro}
        />
        {top.map((r, i) => {
          const { x, y } = position(r.code)
          return (
            <button
              key={r.code}
              className="repere"
              style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${INTRO.reperes + i * 70}ms` }}
              onMouseEnter={() => setEpingle(r.code)}
              onFocus={() => setEpingle(r.code)}
              aria-label={`${r.nom} : ${r.clients} clients, ${euros(r.montant)}`}
            >
              {r.code === choisie?.code && <span className="repere__onde" />}
            </button>
          )
        })}
        {bulle}
      </div>
    </section>
  )
}
