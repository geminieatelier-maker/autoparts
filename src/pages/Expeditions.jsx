import { useState, useEffect, useCallback } from 'react'
import { Send, Package, Clock, Plus, X, Eye, Search, ClipboardList } from 'lucide-react'
import { API, currentUser, fmtAr, fmtDate } from '../lib/api'

const tabs = ['Toutes','Préparée','Expédiée','Livrée']
const transports = ['Taxi-brousse','Transporteur','Retrait sur place']
const badge = s => s==='Livrée'?'b-g':s==='Expédiée'?'b-y':'b-b'
const today = () => new Date().toISOString().slice(0,10)

export default function Expeditions() {
  const [tab, setTab] = useState('Toutes')
  const [q, setQ] = useState('')
  const [list, setList] = useState([])
  const [clients, setClients] = useState([])
  const [commandes, setCommandes] = useState([])
  const [form, setForm] = useState(null)
  const [detail, setDetail] = useState(null)

  const load = useCallback(async () => {
    if (!API) return
    setList(await API.getExpeditions({ statut: tab, recherche: q }))
  }, [tab, q])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!API) return
    API.getClients({}).then(setClients)
    API.getCommandes({ statut:'Toutes' }).then(setCommandes)
  }, [])

  const stats = list.reduce((a,e)=>{
    a[e.statut] = (a[e.statut]||0) + 1
    return a
  }, {})

  function openNew() {
    setForm({ header:{ client_id:'', transport:'Taxi-brousse', date_exp:today(), statut:'Préparée', no_colis:'', observations:'' }, commande_ids:[] })
  }
  async function openDetail(e) { setDetail(await API.getExpeditionDetail(e.id)) }
  const setH = (k,v)=>setForm(f=>({...f,header:{...f.header,[k]:v}}))
  const toggleCommande = id=>setForm(f=>({...f,commande_ids:f.commande_ids.includes(id)?f.commande_ids.filter(x=>x!==id):[...f.commande_ids,id]}))
  function selectClient(id) {
    setForm(f=>({...f,header:{...f.header,client_id:id},commande_ids:[]}))
  }
  async function save() {
    if (!form.header.client_id) return alert('Sélectionnez un client')
    if (!form.commande_ids.length) return alert('Cochez au moins une commande client')
    await API.saveExpedition(form, currentUser)
    setForm(null); load()
  }
  async function changeStatut(s) {
    await API.updateExpeditionStatut(detail.id, s)
    setDetail(await API.getExpeditionDetail(detail.id)); load()
  }

  const cmdClient = form?.header.client_id ? commandes.filter(c=>String(c.client_id)===String(form.header.client_id)) : []
  const totalSelected = cmdClient.filter(c=>form?.commande_ids.includes(c.id)).reduce((s,c)=>s+Number(c.total||0),0)

  if (form) return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h3 style={{color:'#f8fafc',fontSize:18,margin:0}}>Nouvelle expédition</h3>
        <button className="btn btn-o btn-sm" onClick={()=>setForm(null)}><X size={14}/> Fermer</button>
      </div>
      <div className="card">
        <div className="card-title"><Send size={18}/> Détails expédition</div>
        <div className="grid2">
          <div className="fg"><label>Client *</label>
            <select value={form.header.client_id} onChange={e=>selectClient(e.target.value)}>
              <option value="">— Sélectionner —</option>
              {clients.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <div className="fg"><label>Transport</label>
            <select value={form.header.transport} onChange={e=>setH('transport',e.target.value)}>{transports.map(t=><option key={t}>{t}</option>)}</select>
          </div>
          <div className="fg"><label>Date expédition</label><input type="date" value={form.header.date_exp} onChange={e=>setH('date_exp',e.target.value)}/></div>
          <div className="fg"><label>Statut</label>
            <select value={form.header.statut} onChange={e=>setH('statut',e.target.value)}>{tabs.filter(t=>t!=='Toutes').map(s=><option key={s}>{s}</option>)}</select>
          </div>
          <div className="fg"><label>N° de colis / suivi</label><input value={form.header.no_colis} onChange={e=>setH('no_colis',e.target.value)} placeholder="ex : COL-2045 / n° taxi-brousse"/></div>
        </div>
        <div className="fg"><label>Observations</label><textarea value={form.header.observations} onChange={e=>setH('observations',e.target.value)} rows={2}/></div>
      </div>
      <div className="card">
        <div className="card-title"><ClipboardList size={18}/> Commandes clients à regrouper</div>
        {!form.header.client_id ? <div style={{color:'#64748b',fontSize:14}}>Sélectionnez un client pour afficher ses commandes.</div> :
        cmdClient.length===0 ? <div style={{color:'#64748b',fontSize:14}}>Aucune commande client pour ce client.</div> :
        cmdClient.map(c=>(
          <label key={c.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'#0f172a',borderRadius:8,marginBottom:6,cursor:'pointer',fontSize:14,color:'#e2e8f0'}}>
            <input type="checkbox" checked={form.commande_ids.includes(c.id)} onChange={()=>toggleCommande(c.id)} style={{accentColor:'#f5c518',width:18,height:18}}/>
            <div style={{flex:1}}><span style={{color:'#f5c518'}}>{c.numero}</span> — {fmtDate(c.date_cmd)} <span style={{fontSize:13,color:'#94a3b8'}}>({c.nb_lignes} pièce(s), {fmtAr(c.total)})</span></div>
            <span className={`badge ${c.statut==='Livré'?'b-g':c.statut==='Impayé'?'b-r':'b-y'}`}>{c.statut}</span>
          </label>
        ))}
        <div style={{textAlign:'right',marginTop:10,fontSize:16,fontWeight:600,color:'#f5c518'}}>Total regroupé : {fmtAr(totalSelected)}</div>
      </div>
      <div style={{display:'flex',gap:10}}>
        <button className="btn btn-p" onClick={save}><Send size={16}/> Créer l'expédition</button>
        <button className="btn btn-o" onClick={()=>setForm(null)}>Annuler</button>
      </div>
    </div>
  )

  if (detail) return (
    <div>
      <button className="btn btn-o btn-sm" onClick={()=>setDetail(null)} style={{marginBottom:14}}>← Retour</button>
      <div className="card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div className="card-title" style={{marginBottom:0}}><Send size={18}/> {detail.numero} — {detail.client_nom||'—'}</div>
          <span className={`badge ${badge(detail.statut)}`}>{detail.statut}</span>
        </div>
        <div className="grid2">
          <div className="fg"><label>Client</label><input readOnly value={detail.client_nom||'—'}/></div>
          <div className="fg"><label>Transport</label><input readOnly value={detail.transport||'—'}/></div>
          <div className="fg"><label>Date</label><input readOnly value={fmtDate(detail.date_exp)}/></div>
          <div className="fg"><label>N° de colis / suivi</label><input readOnly value={detail.no_colis||'—'}/></div>
          <div className="fg"><label>Observations</label><input readOnly value={detail.observations||'—'}/></div>
        </div>
      </div>
      <div className="card">
        <div className="card-title">Commandes regroupées ({detail.commandes.length})</div>
        {detail.commandes.map(c=><div key={c.id} className="pay-row">
          <div><span style={{color:'#f5c518'}}>{c.numero}</span> <span style={{color:'#94a3b8'}}>· {fmtDate(c.date_cmd)}</span></div>
          <div style={{fontWeight:600,color:'#f8fafc'}}>{fmtAr(c.total)}</div>
        </div>)}
      </div>
      <div className="card">
        <div className="card-title"><Package size={18}/> Articles à expédier</div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Commande</th><th>Pièce</th><th>Réf.</th><th>Qté</th><th>Montant</th></tr></thead>
            <tbody>
              {detail.lignes.length===0 ? <tr><td colSpan={5} style={{color:'#64748b',textAlign:'center',padding:20}}>Aucun article</td></tr> :
              detail.lignes.map(l=><tr key={`${l.commande_numero}-${l.id}`}><td>{l.commande_numero}</td><td>{l.designation}</td><td>{l.reference}</td><td>{l.quantite}</td><td>{fmtAr(l.montant)}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{display:'flex',gap:10}}>
        <button className="btn btn-o" onClick={()=>changeStatut('Expédiée')}>Marquer expédiée</button>
        <button className="btn btn-s" onClick={()=>changeStatut('Livrée')}>Marquer livrée</button>
      </div>
    </div>
  )

  return <>
    <div className="stats">
      <div className="stat"><div className="label">Préparées</div><div className="value" style={{color:'#3b82f6'}}>{stats['Préparée']||0}</div></div>
      <div className="stat"><div className="label">Expédiées</div><div className="value" style={{color:'#f5c518'}}>{stats['Expédiée']||0}</div></div>
      <div className="stat"><div className="label">Livrées</div><div className="value" style={{color:'#22c55e'}}>{stats['Livrée']||0}</div></div>
    </div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap',gap:8}}>
      <div className="tabs" style={{marginBottom:0}}>{tabs.map(t=><div key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t}</div>)}</div>
      <button className="btn btn-p" onClick={openNew}><Plus size={16}/> Nouvelle expédition</button>
    </div>
    <div className="search-bar"><Search size={16} color="#475569"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher par client, n° expédition, transport..."/></div>
    <div className="card">
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>N°</th><th>Client</th><th>Date</th><th>Transport</th><th>N° colis</th><th>Commandes</th><th>Total</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            {list.length===0 ? <tr><td colSpan={9} style={{color:'#64748b',textAlign:'center',padding:20}}>Aucune expédition</td></tr> :
            list.map(e=><tr key={e.id}>
              <td style={{color:'#f5c518'}}>{e.numero}</td><td>{e.client_nom||'—'}</td><td><Clock size={12} style={{verticalAlign:'-2px',marginRight:4}}/>{fmtDate(e.date_exp)}</td>
              <td>{e.transport}</td><td>{e.no_colis||'—'}</td><td>{e.nb_commandes}</td><td>{fmtAr(e.total_commandes)}</td>
              <td><span className={`badge ${badge(e.statut)}`}>{e.statut}</span></td>
              <td><button className="btn btn-o btn-sm" onClick={()=>openDetail(e)}><Eye size={14}/> Voir</button></td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  </>
}
