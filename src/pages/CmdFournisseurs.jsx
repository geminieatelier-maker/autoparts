import { useState, useEffect, useCallback } from 'react'
import { ClipboardList, Plus, Eye, Search, X, Package, Trash2 } from 'lucide-react'
import { API, currentUser, fmtAr, fmtDate } from '../lib/api'

const tabs = ['Toutes','Préparation','En transit','Livré']
const badge = s => s==='Livré'?'b-g':s==='En transit'?'b-y':'b-b'
const today = () => new Date().toISOString().slice(0,10)

export default function CmdFournisseurs() {
  const [tab, setTab] = useState('Toutes')
  const [q, setQ] = useState('')
  const [list, setList] = useState([])
  const [fournisseurs, setFournisseurs] = useState([])
  const [cmdClients, setCmdClients] = useState([])
  const [form, setForm] = useState(null)
  const [detail, setDetail] = useState(null)

  const load = useCallback(async () => { if (API) setList(await API.getCmdFournisseurs({ statut: tab, recherche: q })) }, [tab, q])
  useEffect(() => { load() }, [load])
  useEffect(() => { if (API) { API.getFournisseurs({}).then(setFournisseurs); API.getCommandes({ statut:'En cours' }).then(setCmdClients) } }, [])

  function openNew() {
    setForm({ header:{ fournisseur_id:'', date_cmd:today(), devise:'MGA', statut:'Préparation', conditions_paiement:'Comptant', observations:'' },
      lignes:[{ designation:'', reference:'', quantite:1, prix_unitaire:0 }], client_ids:[] })
  }
  async function openDetail(c){ setDetail(await API.getCmdFournisseurDetail(c.id)) }
  const setH = (k,v)=>setForm(f=>({...f,header:{...f.header,[k]:v}}))
  const setL = (i,k,v)=>setForm(f=>{const l=[...f.lignes];l[i]={...l[i],[k]:v};return{...f,lignes:l}})
  const addL = ()=>setForm(f=>({...f,lignes:[...f.lignes,{designation:'',reference:'',quantite:1,prix_unitaire:0}]}))
  const delL = i=>setForm(f=>({...f,lignes:f.lignes.filter((_,j)=>j!==i)}))
  const toggleClient = id=>setForm(f=>({...f,client_ids:f.client_ids.includes(id)?f.client_ids.filter(x=>x!==id):[...f.client_ids,id]}))
  const totalForm = ()=>(form?.lignes||[]).reduce((s,l)=>s+Number(l.quantite||0)*Number(l.prix_unitaire||0),0)

  async function save() {
    if (!form.header.fournisseur_id) return alert('Sélectionnez un fournisseur')
    const dev = fournisseurs.find(f=>f.id==form.header.fournisseur_id)?.devise || form.header.devise
    await API.saveCmdFournisseur({ header:{...form.header,devise:dev}, lignes: form.lignes.filter(l=>l.designation.trim()), client_ids: form.client_ids }, currentUser)
    setForm(null); load()
  }
  async function changeStatut(s){ await API.updateCmdFournisseurStatut(detail.id,s); setDetail(await API.getCmdFournisseurDetail(detail.id)); load() }
  async function remove(){ if(!confirm('Supprimer cette commande fournisseur ?'))return; await API.deleteCmdFournisseur(detail.id); setDetail(null); load() }

  // ---- Formulaire ----
  if (form) return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h3 style={{color:'#f8fafc',fontSize:18,margin:0}}>Nouvelle commande fournisseur</h3>
        <button className="btn btn-o btn-sm" onClick={()=>setForm(null)}><X size={14}/> Fermer</button>
      </div>
      <div className="card">
        <div className="card-title">Fournisseur</div>
        <div className="grid2">
          <div className="fg"><label>Fournisseur *</label>
            <select value={form.header.fournisseur_id} onChange={e=>setH('fournisseur_id',e.target.value)}>
              <option value="">— Sélectionner —</option>{fournisseurs.map(f=><option key={f.id} value={f.id}>{f.nom} ({f.devise})</option>)}
            </select>
          </div>
          <div className="fg"><label>Date</label><input type="date" value={form.header.date_cmd} onChange={e=>setH('date_cmd',e.target.value)}/></div>
          <div className="fg"><label>Conditions de paiement</label>
            <select value={form.header.conditions_paiement} onChange={e=>setH('conditions_paiement',e.target.value)}>
              {['Comptant','30 jours','45 jours','60 jours','90 jours','120 jours'].map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-title"><Package size={18}/> Regrouper des commandes clients (optionnel)</div>
        {cmdClients.length===0 ? <div style={{color:'#64748b',fontSize:14}}>Aucune commande client en cours.</div> :
        cmdClients.map(c=>(
          <label key={c.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'#0f172a',borderRadius:8,marginBottom:6,cursor:'pointer',fontSize:14,color:'#e2e8f0'}}>
            <input type="checkbox" checked={form.client_ids.includes(c.id)} onChange={()=>toggleClient(c.id)} style={{accentColor:'#f5c518',width:18,height:18}}/>
            <div style={{flex:1}}><span style={{color:'#f5c518'}}>{c.numero}</span> — {c.client_nom||'—'} <span style={{fontSize:13,color:'#94a3b8'}}>({c.nb_lignes} pièce(s), {fmtAr(c.total)})</span></div>
          </label>
        ))}
      </div>
      <div className="card">
        <div className="card-title">Articles à commander</div>
        <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Pièce</th><th>Réf.</th><th>Qté</th><th>PU (Ar)</th><th>Total</th><th></th></tr></thead>
          <tbody>
            {form.lignes.map((l,i)=>(
              <tr key={i}>
                <td><input value={l.designation} onChange={e=>setL(i,'designation',e.target.value)} placeholder="Nom de la pièce" style={inp}/></td>
                <td><input value={l.reference} onChange={e=>setL(i,'reference',e.target.value)} placeholder="Réf" style={{...inp,width:90}}/></td>
                <td><input type="number" value={l.quantite} onChange={e=>setL(i,'quantite',e.target.value)} style={{...inp,width:60}}/></td>
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
        <div className="fg"><label>Observations</label><textarea value={form.header.observations} onChange={e=>setH('observations',e.target.value)} rows={2} style={{width:'100%',padding:'12px 16px',background:'#0f172a',border:'1px solid #334155',borderRadius:8,color:'#f8fafc',fontSize:15,outline:'none',resize:'vertical'}}/></div>
      </div>
      <div style={{display:'flex',gap:10}}>
        <button className="btn btn-p" onClick={save}>Créer la commande</button>
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
          <div className="card-title" style={{marginBottom:0}}><ClipboardList size={18}/> {detail.numero} — {detail.fournisseur_nom}</div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}><span className={`badge ${badge(detail.statut)}`}>{detail.statut}</span><button className="btn btn-d btn-sm" onClick={remove}><Trash2 size={14}/></button></div>
        </div>
        <div className="grid2">
          <div className="fg"><label>Fournisseur</label><input readOnly value={detail.fournisseur_nom||'—'}/></div>
          <div className="fg"><label>Date</label><input readOnly value={fmtDate(detail.date_cmd)}/></div>
          <div className="fg"><label>Devise</label><input readOnly value={detail.devise||'—'}/></div>
          <div className="fg"><label>Montant</label><input readOnly value={fmtAr(detail.total)}/></div>
        </div>
      </div>
      {detail.clients.length>0 && <div className="card">
        <div className="card-title">Commandes clients regroupées</div>
        {detail.clients.map((c,i)=><div key={i} className="pay-row"><span style={{fontSize:15,color:'#f8fafc'}}><span style={{color:'#f5c518'}}>{c.numero}</span> — {c.client_nom||'—'}</span></div>)}
      </div>}
      <div className="card">
        <div className="card-title">Articles ({detail.lignes.length})</div>
        <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Pièce</th><th>Réf.</th><th>Qté</th><th>PU</th><th>Total</th></tr></thead>
          <tbody>{detail.lignes.map(l=><tr key={l.id}><td>{l.designation}</td><td>{l.reference}</td><td>{l.quantite}</td><td>{fmtAr(l.prix_unitaire)}</td><td>{fmtAr(l.montant)}</td></tr>)}</tbody>
        </table>
        </div>
      </div>
      <div style={{display:'flex',gap:10}}>
        <button className="btn btn-o" onClick={()=>changeStatut('En transit')}>Marquer en transit</button>
        <button className="btn btn-s" onClick={()=>changeStatut('Livré')}>Marquer comme reçu</button>
      </div>
    </div>
  )

  // ---- Liste ----
  return <>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap',gap:8}}>
      <div className="tabs" style={{marginBottom:0}}>{tabs.map(t=><div key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t}</div>)}</div>
      <button className="btn btn-p" onClick={openNew}><Plus size={16}/> Nouvelle cmd fournisseur</button>
    </div>
    <div className="search-bar"><Search size={16} color="#475569"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher par fournisseur, n°..."/></div>
    <div className="card">
      <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr><th>N°</th><th>Fournisseur</th><th>Date</th><th>Articles</th><th>Montant</th><th>Devise</th><th>Statut</th><th></th></tr></thead>
        <tbody>
          {list.length===0 ? <tr><td colSpan={8} style={{color:'#64748b',textAlign:'center',padding:20}}>Aucune commande fournisseur</td></tr> :
          list.map(c=>(
            <tr key={c.id}>
              <td style={{color:'#f5c518'}}>{c.numero}</td><td>{c.fournisseur_nom||'—'}</td><td>{fmtDate(c.date_cmd)}</td>
              <td>{c.nb_lignes}</td><td>{fmtAr(c.total)}</td><td>{c.devise||'—'}</td>
              <td><span className={`badge ${badge(c.statut)}`}>{c.statut}</span></td>
              <td><button className="btn btn-o btn-sm" onClick={()=>openDetail(c)}><Eye size={14}/></button></td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  </>
}
const inp = { background:'#0f172a', border:'1px solid #334155', borderRadius:6, padding:'6px 10px', color:'#f8fafc', fontSize:14, width:'100%' }
