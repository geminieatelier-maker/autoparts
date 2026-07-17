import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Search, Eye, FileText, X, Trash2, Download, Upload, Printer } from 'lucide-react'
import { API, currentUser, fmtAr, fmtDate } from '../lib/api'
import { exportExcel, importExcelFile, printDocument } from '../lib/files'

const tabs = ['Toutes','En cours','Devis','Livré','Impayé']
const statutBadge = s => s==='Livré'?'b-g':s==='Impayé'?'b-r':s==='Devis'?'b-b':'b-y'
const today = () => new Date().toISOString().slice(0,10)

export default function Commandes() {
  const [tab, setTab] = useState('Toutes')
  const [q, setQ] = useState('')
  const [list, setList] = useState([])
  const [clients, setClients] = useState([])
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState(null)
  const fileRef = useRef(null)

  const load = useCallback(async () => {
    if (!API) return
    setList(await API.getCommandes({ statut: tab, recherche: q }))
  }, [tab, q])
  useEffect(() => { load() }, [load])
  useEffect(() => { if (API) API.getClients({}).then(setClients) }, [])

  function openNew() {
    setForm({ header:{ client_id:'', date_cmd:today(), type:'Commande', priorite:'Normale', statut:'En cours', observations:'' },
      lignes:[{ quantite:1, reference:'', designation:'', marque:'', prix_unitaire:0 }] })
  }
  async function openDetail(c) { setDetail(await API.getCommandeDetail(c.id)) }
  async function nouveauClient() {
    const nom = prompt('Nom du nouveau client :')
    if (!nom || !nom.trim()) return
    const id = await API.saveClient({ nom: nom.trim() })
    const cs = await API.getClients({}); setClients(cs); setH('client_id', String(id))
  }
  const setH = (k,v) => setForm(f => ({ ...f, header:{ ...f.header, [k]:v } }))
  const setL = (i,k,v) => setForm(f => { const l=[...f.lignes]; l[i]={...l[i],[k]:v}; return {...f,lignes:l} })
  const addL = () => setForm(f => ({ ...f, lignes:[...f.lignes,{ quantite:1, reference:'', designation:'', marque:'', prix_unitaire:0 }] }))
  const delL = i => setForm(f => ({ ...f, lignes:f.lignes.filter((_,j)=>j!==i) }))
  const totalForm = () => (form?.lignes||[]).reduce((s,l)=>s+Number(l.quantite||0)*Number(l.prix_unitaire||0),0)

  async function save(asDevis) {
    if (!form.header.client_id) return alert('Sélectionnez un client')
    const header = { ...form.header }
    if (asDevis) { header.type='Devis'; header.statut='Devis' }
    await API.saveCommande({ header, lignes: form.lignes.filter(l=>l.designation.trim()) }, currentUser)
    setForm(null); load()
  }
  async function changeStatut(s) { await API.updateCommandeStatut(detail.id, s); setDetail(await API.getCommandeDetail(detail.id)); load() }
  async function remove() { if(!confirm('Supprimer cette commande ?'))return; await API.deleteCommande(detail.id); setDetail(null); load() }

  async function onImport(e) {
    const file = e.target.files?.[0]; if (!file) return
    const rows = await importExcelFile(file, true)
    if (rows.length) setForm(f=>({ ...f, lignes:[...f.lignes.filter(l=>l.designation.trim()||l.reference), ...rows] }))
    else alert('Aucune ligne reconnue. Colonnes attendues : Désignation, Référence, Quantité, Prix.')
    e.target.value = ''
  }
  function exportListe() {
    exportExcel(list.map(c=>({ 'N°':c.numero, Client:c.client_nom, Date:fmtDate(c.date_cmd), Articles:c.nb_lignes, Montant:Number(c.total), Priorité:c.priorite, Statut:c.statut })), 'commandes-clients.xlsx', 'Commandes')
  }
  function imprimer(d) {
    const lignes = (d.lignes||[]).map(l=>`<tr><td class="r">${l.quantite}</td><td>${l.reference||''}</td><td>${l.designation||''}</td><td>${l.marque||''}</td><td class="r">${fmtAr(l.prix_unitaire)}</td><td class="r">${fmtAr(Number(l.quantite)*Number(l.prix_unitaire))}</td></tr>`).join('')
    printDocument('Commande '+d.numero, `
      <h1>BON DE COMMANDE</h1><div class="sub">ABS STORE PIECES AUTOS — Distribution de pièces automobiles</div>
      <div class="row"><div class="box"><b>N° :</b> ${d.numero||''}<br><b>Date :</b> ${fmtDate(d.date_cmd)}<br><b>Type :</b> ${d.type||''}</div>
      <div class="box" style="text-align:right"><b>Client :</b> ${d.client_nom||''}<br><b>Priorité :</b> ${d.priorite||''}<br><b>Statut :</b> ${d.statut||''}</div></div>
      <table><thead><tr><th class="r">Qté</th><th>Réf.</th><th>Désignation</th><th>Marque</th><th class="r">P.U.</th><th class="r">Total</th></tr></thead><tbody>${lignes}</tbody></table>
      <div class="tot">Total : ${fmtAr(d.total)}</div>
      ${d.observations?`<div class="box" style="margin-top:10px"><b>Observations :</b> ${d.observations}</div>`:''}
      <div class="foot">Document généré par ABS STORE PIECES AUTOS</div>`)
  }

  // ---- Formulaire ----
  if (form) return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h3 style={{color:'#f8fafc',fontSize:18,margin:0}}>Nouvelle commande client</h3>
        <button className="btn btn-o btn-sm" onClick={()=>setForm(null)}><X size={14}/> Fermer</button>
      </div>
      <div className="card">
        <div className="card-title">Informations client</div>
        <div className="grid2">
          <div className="fg"><label>Client *</label>
            <div style={{display:'flex',gap:6}}>
              <select value={form.header.client_id} onChange={e=>setH('client_id',e.target.value)} style={{flex:1}}>
                <option value="">— Sélectionner un client —</option>
                {clients.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
              <button className="btn btn-o btn-sm" title="Nouveau client" onClick={nouveauClient}><Plus size={14}/></button>
            </div>
          </div>
          <div className="fg"><label>Date</label><input type="date" value={form.header.date_cmd} onChange={e=>setH('date_cmd',e.target.value)}/></div>
          <div className="fg"><label>Type</label>
            <select value={form.header.type} onChange={e=>setH('type',e.target.value)}><option>Commande</option><option>Devis</option><option>Proforma</option></select>
          </div>
          <div className="fg"><label>Priorité</label>
            <select value={form.header.priorite} onChange={e=>setH('priorite',e.target.value)}><option>Normale</option><option>Urgente</option></select>
          </div>
        </div>
        {clients.length===0 && <div style={{color:'#f5c518',fontSize:13}}>Aucun client enregistré — ajoutez-en un dans le menu <b>Clients</b>, ou avec le bouton « + » ci-dessus.</div>}
      </div>
      <div className="card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div className="card-title" style={{marginBottom:0}}>Articles commandés</div>
          <button className="btn btn-o btn-sm" onClick={()=>fileRef.current?.click()}><Upload size={14}/> Importer Excel</button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{display:'none'}} onChange={onImport}/>
        </div>
        <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Qté</th><th>Réf.</th><th>Désignation</th><th>Marque</th><th>Prix (Ar)</th><th>Total</th><th></th></tr></thead>
          <tbody>
            {form.lignes.map((l,i)=>(
              <tr key={i}>
                <td><input type="number" value={l.quantite} onChange={e=>setL(i,'quantite',e.target.value)} style={{...inp,width:60}}/></td>
                <td><input value={l.reference} onChange={e=>setL(i,'reference',e.target.value)} placeholder="Réf" style={{...inp,width:100}}/></td>
                <td><input value={l.designation} onChange={e=>setL(i,'designation',e.target.value)} placeholder="Désignation de la pièce" style={inp}/></td>
                <td><input value={l.marque||''} onChange={e=>setL(i,'marque',e.target.value)} placeholder="Marque" style={{...inp,width:120}}/></td>
                <td><input type="number" value={l.prix_unitaire} onChange={e=>setL(i,'prix_unitaire',e.target.value)} style={{...inp,width:110}}/></td>
                <td style={{color:'#94a3b8'}}>{fmtAr(Number(l.quantite||0)*Number(l.prix_unitaire||0))}</td>
                <td><button className="btn btn-d btn-sm" onClick={()=>delL(i)}><Trash2 size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <button className="btn btn-o btn-sm" style={{marginTop:10}} onClick={addL}><Plus size={14}/> Ajouter une ligne</button>
        <div style={{textAlign:'right',marginTop:10,fontSize:16,fontWeight:600,color:'#f5c518'}}>Total : {fmtAr(totalForm())}</div>
      </div>
      <div className="card">
        <div className="fg"><label>Notes / remarques</label><textarea value={form.header.observations} onChange={e=>setH('observations',e.target.value)} rows={2} style={{width:'100%',padding:'12px 16px',background:'#0f172a',border:'1px solid #334155',borderRadius:8,color:'#f8fafc',fontSize:15,outline:'none',resize:'vertical'}}/></div>
      </div>
      <div style={{display:'flex',gap:10}}>
        <button className="btn btn-p" onClick={()=>save(false)}>Enregistrer la commande</button>
        <button className="btn btn-o" onClick={()=>save(true)}>Enregistrer comme devis</button>
        <button className="btn btn-o" onClick={()=>setForm(null)}>Annuler</button>
      </div>
    </div>
  )

  // ---- Détail ----
  if (detail) return (
    <div>
      <button className="btn btn-o btn-sm" onClick={()=>setDetail(null)} style={{marginBottom:14}}>← Retour</button>
      <div className="card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div className="card-title" style={{marginBottom:0}}><FileText size={18}/> Commande {detail.numero}</div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-o btn-sm" onClick={()=>imprimer(detail)}><Printer size={14}/> Imprimer / PDF</button>
            <button className="btn btn-d btn-sm" onClick={remove}><Trash2 size={14}/> Supprimer</button>
          </div>
        </div>
        <div className="grid2">
          <div className="fg"><label>Client</label><input readOnly value={detail.client_nom||'—'}/></div>
          <div className="fg"><label>Date</label><input readOnly value={fmtDate(detail.date_cmd)}/></div>
          <div className="fg"><label>Montant total</label><input readOnly value={fmtAr(detail.total)}/></div>
          <div className="fg"><label>Statut</label><input readOnly value={detail.statut}/></div>
          <div className="fg"><label>Priorité</label><input readOnly value={detail.priorite}/></div>
          <div className="fg"><label>Observations</label><input readOnly value={detail.observations||'—'}/></div>
        </div>
      </div>
      <div className="card">
        <div className="card-title">Articles ({detail.lignes.length})</div>
        <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Qté</th><th>Réf.</th><th>Désignation</th><th>Marque</th><th>Prix</th><th>Total</th></tr></thead>
          <tbody>{detail.lignes.map((l)=>(
            <tr key={l.id}><td>{l.quantite}</td><td>{l.reference}</td><td>{l.designation}</td><td>{l.marque||'—'}</td><td>{fmtAr(l.prix_unitaire)}</td><td>{fmtAr(l.montant)}</td></tr>
          ))}</tbody>
        </table>
        </div>
      </div>
      <div style={{display:'flex',gap:10}}>
        <button className="btn btn-s" onClick={()=>changeStatut('Livré')}>Marquer comme livré</button>
        <button className="btn btn-o" onClick={()=>changeStatut('Impayé')}>Marquer impayé</button>
      </div>
    </div>
  )

  // ---- Liste ----
  return <>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap',gap:8}}>
      <div className="tabs" style={{marginBottom:0}}>{tabs.map(t=><div key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t}</div>)}</div>
      <button className="btn btn-p" onClick={openNew}><Plus size={16}/> Nouvelle commande</button>
    </div>
    <div style={{display:'flex',gap:8,marginBottom:10}}>
      <button className="btn btn-o btn-sm" onClick={exportListe}><Download size={14}/> Export Excel</button>
    </div>
    <div className="search-bar"><Search size={16} color="#475569"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher par client, n° commande..."/></div>
    <div className="card">
      <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr><th>N°</th><th>Client</th><th>Date</th><th>Pièces</th><th>Montant</th><th>Priorité</th><th>Statut</th><th></th></tr></thead>
        <tbody>
          {list.length===0 ? <tr><td colSpan={8} style={{color:'#64748b',textAlign:'center',padding:20}}>Aucune commande</td></tr> :
          list.map(c=>(
            <tr key={c.id}>
              <td style={{color:'#f5c518'}}>{c.numero}</td>
              <td>{c.client_nom||'—'}</td>
              <td>{fmtDate(c.date_cmd)}</td>
              <td>{c.nb_lignes}</td>
              <td>{fmtAr(c.total)}</td>
              <td><span className={`badge ${c.priorite==='Urgente'?'b-r':'b-b'}`} style={{fontSize:11}}>{c.priorite}</span></td>
              <td><span className={`badge ${statutBadge(c.statut)}`}>{c.statut}</span></td>
              <td><button className="btn btn-o btn-sm" onClick={()=>openDetail(c)}><Eye size={14}/> Voir</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  </>
}
const inp = { background:'#0f172a', border:'1px solid #334155', borderRadius:6, padding:'6px 10px', color:'#f8fafc', fontSize:14, width:'100%' }
