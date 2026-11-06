import { ArrowDown, ArrowUp } from 'lucide-react'
import type { Kpi } from '../../server/types'
import { pourcent } from '../lib/format'

/** Une variation en vert (hausse) ou en rouge (baisse), ou une mention courte. */
export default function Tendance({ tendance, inverse = false }: { tendance: Kpi['tendance']; inverse?: boolean }) {
  if (!tendance) return null
  if ('texte' in tendance) return <span className={`tendance tendance--${tendance.ton}`}>{tendance.texte}</span>
  const hausse = tendance.pourcent >= 0
  const bon = inverse ? !hausse : hausse
  const Fleche = hausse ? ArrowUp : ArrowDown
  return (
    <span className={`tendance${bon ? '' : ' tendance--baisse'}`}>
      <Fleche strokeWidth={2.6} aria-hidden="true" />
      <span className="sr-only">{hausse ? 'en hausse de' : 'en baisse de'}</span>
      {pourcent(tendance.pourcent)}
    </span>
  )
}
