// Accès au backend. Trois cas :
//  1) Application Electron  → window.API (direct, rapide).
//  2) Navigateur servi par le serveur web → proxy HTTP vers /api/<fonction>.
//  3) Hébergement statique sans serveur → pas de backend.
function makeHttpProxy() {
  return new Proxy({}, {
    get: (_t, name) => (...args) =>
      fetch('/api/' + String(name), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ args })
      }).then(async r => {
        const d = await r.json().catch(() => ({}))
        if (!r.ok || !d.ok) throw new Error(d.error || ('Erreur serveur (' + r.status + ')'))
        return d.result
      })
  })
}
const isElectron = typeof window !== 'undefined' && window.API
const isBrowserServed = typeof window !== 'undefined' && !isElectron && location.protocol.startsWith('http')
export const API = isElectron ? window.API : (isBrowserServed ? makeHttpProxy() : null)
export const hasBackend = !!API

// Utilisateur courant (mis à jour au login ; binding live ESM → les pages le voient)
export let currentUser = { id: null, nom: 'Admin', role: 'admin' }
export function setCurrentUser(u) { currentUser = u }

// Formatage montant Ariary court (1.2M, 680k) — pour l'interface
export function fmtAr(n) {
  n = Number(n || 0)
  if (n >= 1e6) return (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1) + 'M Ar'
  if (n >= 1e3) return Math.round(n / 1e3) + 'k Ar'
  return Math.round(n) + ' Ar'
}

// Formatage montant complet avec séparateurs (pour documents imprimés)
export function fmtArFull(n) {
  n = Number(n || 0)
  return Math.round(n).toLocaleString('fr-FR') + ' Ar'
}
export function fmtDate(d) {
  if (!d) return ''
  const x = new Date(d)
  if (isNaN(x)) return String(d)
  return x.toLocaleDateString('fr-FR')
}
