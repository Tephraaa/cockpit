/** Le logo de Cockpit : un cadran en points avec son aiguille. */
export default function Logo() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--carte)" stroke="var(--filet-carte)" />
      <g fill="var(--vert)">
        <rect x="6" y="19" width="3" height="3" />
        <rect x="7.5" y="13.5" width="3" height="3" />
        <rect x="11.5" y="9.5" width="3" height="3" />
        <rect x="17.5" y="9.5" width="3" height="3" />
      </g>
      <g fill="var(--vert-vif)">
        <rect x="21.5" y="13.5" width="3" height="3" />
        <rect x="23" y="19" width="3" height="3" />
      </g>
      <path d="M16 22 21 14" stroke="var(--texte-fort)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="22" r="2" fill="var(--texte-fort)" />
    </svg>
  )
}
