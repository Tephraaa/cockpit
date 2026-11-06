// La page de paiement de la démo : ce que voit le client de Maison Orée quand il ouvre son lien de paiement.
// Rien n'est encaissé pour de vrai : le bouton marque simplement la facture comme payée dans la démo.

import type { PLCustomer, PLCustomerInvoice } from './types'

const echapper = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
const eur = (v: string | number) => Number(v).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
const date = (iso: string | null) => (iso ? new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '')

export function pagePaiement(f: PLCustomerInvoice, client: PLCustomer | undefined) {
  const payee = f.paid || f.status === 'paid'
  const reste = Number(f.remaining_amount_with_tax ?? f.amount)
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Facture ${echapper(f.invoice_number)} · Maison Orée</title>
<style>
  :root { --vert: #00a449; --encre: #16201a; --doux: #5d6862; --filet: #e2e8e4; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 32px 16px;
    font: 15px/1.45 ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif; color: var(--encre);
    background: radial-gradient(1200px 600px at 50% -10%, #e4f4ea, transparent), #f3f6f4; }
  .carte { width: 100%; max-width: 440px; background: #fff; border: 1px solid var(--filet); border-radius: 18px;
    box-shadow: 0 24px 60px rgba(20, 40, 28, 0.12); overflow: hidden; }
  .tete { display: flex; align-items: center; gap: 12px; padding: 22px 26px; border-bottom: 1px solid var(--filet); }
  .logo { width: 38px; height: 38px; border-radius: 10px; display: grid; place-items: center; font-weight: 700; color: #fff;
    background: linear-gradient(160deg, #2f6b46, #173a27); }
  .tete strong { display: block; font-size: 15px; }
  .tete span { font-size: 13px; color: var(--doux); }
  .corps { padding: 26px; }
  .etiquette { font-size: 13px; color: var(--doux); }
  .montant { margin: 6px 0 4px; font-size: 40px; font-weight: 650; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
  .details { margin: 22px 0; border-top: 1px solid var(--filet); }
  .details div { display: flex; justify-content: space-between; gap: 16px; padding: 11px 0; border-bottom: 1px solid var(--filet); font-size: 14px; }
  .details dt { color: var(--doux); } .details dd { margin: 0; text-align: right; }
  .moyens { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px; }
  .moyen { padding: 12px; border-radius: 12px; border: 1.5px solid var(--filet); background: #fff; font: inherit; font-size: 14px;
    cursor: pointer; text-align: left; transition: border-color .15s, background-color .15s; }
  .moyen small { display: block; margin-top: 2px; font-size: 12px; color: var(--doux); }
  .moyen[aria-checked='true'] { border-color: var(--vert); background: #f0faf4; }
  .payer { width: 100%; height: 50px; border: 0; border-radius: 12px; font: inherit; font-size: 16px; font-weight: 600; color: #fff;
    background: linear-gradient(180deg, #10a752, #00843a); box-shadow: 0 8px 20px rgba(0, 164, 73, 0.3); cursor: pointer; }
  .payer:disabled { opacity: .75; cursor: progress; }
  .fini { text-align: center; padding: 10px 0 4px; }
  .coche { width: 56px; height: 56px; margin: 0 auto 14px; border-radius: 50%; display: grid; place-items: center; background: var(--vert);
    color: #fff; font-size: 28px; animation: pop .35s cubic-bezier(.22, 1, .36, 1) both; }
  @keyframes pop { from { transform: scale(.6); opacity: 0; } }
  .fini h2 { margin: 0 0 6px; font-size: 20px; } .fini p { margin: 0; color: var(--doux); }
  .pied { padding: 14px 26px; font-size: 12px; color: var(--doux); background: #f7f9f8; border-top: 1px solid var(--filet); }
  [hidden] { display: none !important; }
</style></head>
<body>
<main class="carte">
  <div class="tete"><span class="logo">MO</span><div><strong>Maison Orée</strong><span>Facture ${echapper(f.invoice_number)}</span></div></div>
  <div class="corps">
    <div id="a-payer" ${payee ? 'hidden' : ''}>
      <p class="etiquette">Montant à régler</p>
      <p class="montant">${eur(reste)}</p>
      <p class="etiquette">à régler avant le ${echapper(date(f.deadline))}</p>
      <dl class="details">
        <div><dt>Client</dt><dd>${echapper(client?.name ?? '')}</dd></div>
        <div><dt>Prestation</dt><dd>${echapper(f.label ?? '')}</dd></div>
        <div><dt>Montant HT</dt><dd>${eur(f.currency_amount_before_tax)}</dd></div>
      </dl>
      <div class="moyens" role="radiogroup" aria-label="Moyen de paiement">
        <button class="moyen" role="radio" aria-checked="true" data-moyen="carte">Carte bancaire<small>Visa, Mastercard</small></button>
        <button class="moyen" role="radio" aria-checked="false" data-moyen="virement">Virement instantané<small>depuis ta banque</small></button>
      </div>
      <button class="payer" id="payer">Payer ${eur(reste)}</button>
    </div>
    <div class="fini" id="fini" ${payee ? '' : 'hidden'}>
      <div class="coche">✓</div>
      <h2>Paiement reçu, merci !</h2>
      <p>Maison Orée a bien reçu le règlement de la facture ${echapper(f.invoice_number)}. Tu peux fermer cette page.</p>
    </div>
  </div>
  <p class="pied">Démo Cockpit : paiement simulé, aucune donnée bancaire n'est demandée ni enregistrée.</p>
</main>
<script>
  document.querySelectorAll('.moyen').forEach((b) => b.addEventListener('click', () =>
    document.querySelectorAll('.moyen').forEach((x) => x.setAttribute('aria-checked', String(x === b)))))
  const bouton = document.getElementById('payer')
  bouton?.addEventListener('click', async () => {
    bouton.disabled = true
    bouton.textContent = 'Paiement en cours…'
    const res = await fetch(location.pathname, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    if (!res.ok) { bouton.disabled = false; bouton.textContent = 'Réessayer'; return }
    document.getElementById('a-payer').hidden = true
    document.getElementById('fini').hidden = false
  })
</script>
</body></html>`
}
