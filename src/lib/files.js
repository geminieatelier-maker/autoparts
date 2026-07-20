// Import / Export — Excel & PDF. Utilise le backend (window.API) pour Excel,
// et l'impression navigateur (« Enregistrer en PDF ») pour les documents.
import { API } from './api'

let _logoB64Cache = null
export async function getLogoBase64() {
  if (_logoB64Cache) return _logoB64Cache
  try {
    const url = (import.meta.env.BASE_URL || '/') + 'logo.png'
    const resp = await fetch(url)
    if (!resp.ok) return ''
    const blob = await resp.blob()
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onloadend = () => { _logoB64Cache = reader.result; resolve(reader.result) }
      reader.onerror = () => resolve('')
      reader.readAsDataURL(blob)
    })
  } catch { return '' }
}

function base64ToBlob(b64, type) {
  const bin = atob(b64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new Blob([arr], { type })
}
function download(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

// Exporte un tableau de lignes (objets) en .xlsx et le télécharge.
export async function exportExcel(rows, filename = 'export.xlsx', sheetName = 'Données') {
  if (!API) return alert('Export disponible uniquement dans l\'application.')
  if (!rows || !rows.length) return alert('Rien à exporter.')
  const b64 = await API.excelDepuisLignes(rows, sheetName)
  download(base64ToBlob(b64, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'), filename)
}

// Lit un fichier Excel choisi par l'utilisateur. articles=true → colonnes reconnues
// (désignation, référence, quantité, prix). Renvoie un tableau d'objets.
export async function importExcelFile(file, articles = false) {
  if (!API) { alert('Import disponible uniquement dans l\'application.'); return [] }
  const buf = await file.arrayBuffer()
  const bytes = Array.from(new Uint8Array(buf))
  return articles ? API.lireArticlesExcel(bytes) : API.lireExcel(bytes)
}

// Lit un fichier Excel de clients choisi par l'utilisateur → tableau d'objets client
// (colonnes reconnues automatiquement côté backend).
export async function importClientsExcel(file) {
  if (!API) { alert('Import disponible uniquement dans l\'application.'); return [] }
  const buf = await file.arrayBuffer()
  const bytes = Array.from(new Uint8Array(buf))
  return API.lireClientsExcel(bytes)
}

// Lit un fichier Excel de fournisseurs choisi par l'utilisateur → tableau d'objets fournisseur.
export async function importFournisseursExcel(file) {
  if (!API) { alert('Import disponible uniquement dans l\'application.'); return [] }
  const buf = await file.arrayBuffer()
  const bytes = Array.from(new Uint8Array(buf))
  return API.lireFournisseursExcel(bytes)
}

// Ouvre une fenêtre d'impression (l'utilisateur choisit imprimante ou « Enregistrer en PDF »).
export function printDocument(title, bodyHtml) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>
    @page{size:A4;margin:14mm}
    *{box-sizing:border-box}
    body{font-family:"Segoe UI",system-ui,sans-serif;color:#1e293b;font-size:12px;margin:0;line-height:1.5}
    h1{font-size:18px;color:#b45309;margin:0;font-weight:700}
    .sub{color:#64748b;font-size:11px}
    .header-row{display:flex;justify-content:space-between;gap:20px;margin-bottom:20px;align-items:flex-start}
    .company{flex:1}
    .company-info{font-size:11px;color:#475569;line-height:1.6}
    .invoice-box{text-align:right;min-width:180px}
    .invoice-title{font-size:28px;font-weight:800;color:#b45309;letter-spacing:1px;margin-bottom:8px}
    .info-tbl{margin-left:auto;border-collapse:collapse;font-size:12px}
    .info-tbl .lbl{color:#64748b;padding:2px 12px 2px 0;text-align:right}
    .info-tbl .val{font-weight:600;color:#1e293b;padding:2px 0}
    .client-box{margin:0 0 16px;padding:10px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;font-size:13px}
    .row{display:flex;justify-content:space-between;gap:20px;margin-bottom:16px}
    .box{font-size:12px;line-height:1.6}
    .box b{color:#1e293b}
    table.items{width:100%;border-collapse:collapse;margin:0 0 8px}
    table.items th{background:#1e293b;color:#fff;padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.5px}
    table.items td{padding:7px 10px;border-bottom:1px solid #e2e8f0;font-size:12px}
    table.items tr.alt td{background:#f8fafc}
    table{width:100%;border-collapse:collapse;margin:12px 0}
    th{background:#f5c518;color:#111;padding:8px;text-align:left;font-size:11px;text-transform:uppercase}
    td{padding:7px 8px;border-bottom:1px solid #eee}
    .r{text-align:right}
    .totals{margin:12px 0 0;display:flex;flex-direction:column;align-items:flex-end}
    .total-line{display:flex;justify-content:space-between;width:250px;padding:6px 0;font-size:14px;font-weight:700;color:#1e293b;border-top:2px solid #1e293b}
    .total-line.sub-line{font-weight:400;font-size:12px;color:#64748b;border-top:none;padding:3px 0}
    .total-line.rest-line{font-weight:700;font-size:14px;color:#b45309;border-top:1px solid #e2e8f0;padding-top:6px}
    .tot{text-align:right;font-size:15px;font-weight:700;color:#b45309;margin-top:8px}
    .bottom-section{margin-top:36px;display:flex;justify-content:space-between;align-items:flex-start}
    .arrete{font-size:12px;color:#475569;line-height:1.6;max-width:55%}
    .arrete b{color:#1e293b;font-size:13px}
    .signature{text-align:center;font-size:11px;color:#64748b;min-width:180px}
    .sig-line{width:160px;border-top:1px solid #94a3b8;margin:0 auto}
    .foot{margin-top:30px;text-align:center;color:#94a3b8;font-size:10px;border-top:1px solid #e2e8f0;padding-top:10px}
    @media screen{body{max-width:210mm;margin:16px auto;padding:14mm;background:#fff;box-shadow:0 4px 30px rgba(0,0,0,.15)}}
  </style></head><body>${bodyHtml}
  <script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script></body></html>`
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const w = window.open(url, '_blank', 'width=900,height=1000')
  if (!w) { alert('Fenêtre d\'impression bloquée.'); URL.revokeObjectURL(url); return }
  w.onload = () => URL.revokeObjectURL(url)
}
