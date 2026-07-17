// Import / Export — Excel & PDF. Utilise le backend (window.API) pour Excel,
// et l'impression navigateur (« Enregistrer en PDF ») pour les documents.
import { API } from './api'

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

// Ouvre une fenêtre d'impression (l'utilisateur choisit imprimante ou « Enregistrer en PDF »).
export function printDocument(title, bodyHtml) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>
    @page{size:A4;margin:14mm}
    *{box-sizing:border-box}
    body{font-family:"Segoe UI",system-ui,sans-serif;color:#111;font-size:12px;margin:0}
    h1{font-size:20px;color:#b45309;margin:0 0 2px}
    .sub{color:#666;font-size:12px;margin-bottom:16px}
    .row{display:flex;justify-content:space-between;gap:20px;margin-bottom:16px}
    .box{font-size:12px;line-height:1.6}
    .box b{color:#111}
    table{width:100%;border-collapse:collapse;margin:12px 0}
    th{background:#f5c518;color:#111;padding:8px;text-align:left;font-size:11px;text-transform:uppercase}
    td{padding:7px 8px;border-bottom:1px solid #eee}
    .r{text-align:right}
    .tot{text-align:right;font-size:15px;font-weight:700;color:#b45309;margin-top:8px}
    .foot{margin-top:30px;text-align:center;color:#999;font-size:10px;border-top:1px solid #eee;padding-top:10px}
    @media screen{body{max-width:210mm;margin:16px auto;padding:14mm;background:#fff;box-shadow:0 4px 30px rgba(0,0,0,.15)}}
  </style></head><body>${bodyHtml}
  <script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script></body></html>`
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const w = window.open(url, '_blank', 'width=900,height=1000')
  if (!w) { alert('Fenêtre d\'impression bloquée.'); URL.revokeObjectURL(url); return }
  w.onload = () => URL.revokeObjectURL(url)
}
