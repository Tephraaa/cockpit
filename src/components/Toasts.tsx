import { X } from 'lucide-react'
import { fermer, useToasts } from '../lib/toasts'

export default function Toasts() {
  const liste = useToasts()
  return (
    <div className="toasts" role="status" aria-live="polite">
      {liste.map((t) => (
        <div key={t.id} className={`toast toast--${t.ton}${t.sortie ? ' est-sortant' : ''}`}>
          <span className="toast__ton" />
          <div>
            <p className="toast__titre">{t.titre}</p>
            {t.texte && <p className="toast__texte">{t.texte}</p>}
          </div>
          <button onClick={() => fermer(t.id)} aria-label="Fermer">
            <X />
          </button>
        </div>
      ))}
    </div>
  )
}
