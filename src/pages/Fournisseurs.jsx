import { useState, useEffect, useCallback } from 'react'
import { Search, MapPin, Star, Phone, Mail, Plus, Edit, Trash2, FileText, X } from 'lucide-react'
import { API, fmtAr, fmtDate } from '../lib/api'

const emptyForm = { nom:'', pays:'', devise:'MGA', rating:3, delai:'', contact:'', tel:'', email:'', adresse:'', conditions_paiement:'', notes:'' }

export default function Fournisseurs() {
  const [list, setList] = useState([])
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(null)   // null | {objet}

  const load = useCallback(async () => {
    if (!API) return
    setList(await API.getFournisseurs({ recherche: q }))
  }, [q])
  useEffect(() => { load() }, [load])

  async function openDetail(f) { setSelected(API ? await API.getFournisseurDetail(f.id) : f) }
  function openNew() { setForm({ ...emptyForm }) }
  function openEdit(f) { setForm({ ...f }); setSelected(null) }
  async function save() {
    if (!form.nom.trim()) return alert('Le nom est obligatoire')
    await API.saveFournisseur(form)
    setForm(null); setSelected(null); load()
  }
  async function remove(id) {
    if (!confirm('Supprimer ce fournisseur ?')) return
    await API.deleteFournisseur(id); setSelected(null); load()
  }
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // ---- Formulaire ----
  if (form) return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h3 style={{color:'#f8fafc',fontSize:18,margin:0}}>{form.id ? 'Modifier' : 'Nouveau'} fournisseur</h3>
        <button className="btn btn-o btn-sm" onClick={()=>setForm(null)}><X size={14}/> Fermer</button>
      </div>
      <div className="card">
        <div className="grid2">
          <div className="fg"><label>Nom du fournisseur *</label><input value={form.nom} onChange={e=>set('nom',e.target.value)} placeholder="Ex: Guangzhou Auto Parts"/></div>
          <div className="fg"><label>Pays</label><input value={form.pays||''} onChange={e=>set('pays',e.target.value)} placeholder="Ex: Chine"/></div>
          <div className="fg"><label>Devise</label>
            <select value={form.devise} onChange={e=>set('devise',e.target.value)}>
              {['MGA','USD','EUR','CNY','JPY'].map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="fg"><label>Note (1 à 5)</label>
            <select value={form.rating} onChange={e=>set('rating',Number(e.target.value))}>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}</select>
          </div>
          <div className="fg"><label>Délai moyen</label><input value={form.delai||''} onChange={e=>set('delai',e.target.value)} placeholder="Ex: 15-20 jours"/></div>
          <div className="fg"><label>Conditions de paiement</label><input value={form.conditions_paiement||''} onChange={e=>set('conditions_paiement',e.target.value)} placeholder="Ex: 30 jours"/></div>
          <div className="fg"><label>Personne de contact</label><input value={form.contact||''} onChange={e=>set('contact',e.target.value)} placeholder="Nom du contact"/></div>
          <div className="fg"><label>Téléphone</label><input value={form.tel||''} onChange={e=>set('tel',e.target.value)} placeholder="+86 20 ..."/></div>
          <div className="fg"><label>Email</label><input value={form.email||''} onChange={e=>set('email',e.target.value)} placeholder="contact@fournisseur.com"/></div>
          <div className="fg"><label>Adresse</label><input value={form.adresse||''} onChange={e=>set('adresse',e.target.value)} placeholder="Adresse complète"/></div>
        </div>
        <div className="fg"><label>Notes</label><textarea value={form.notes||''} onChange={e=>set('notes',e.target.value)} rows={3} style={{width:'100%',padding:'12px 16px',background:'#0f172a',border:'1px solid #334155',borderRadius:8,color:'#f8fafc',fontSize:15,outline:'none',resize:'vertical'}}/></div>
        <div style={{display:'flex',gap:10,marginTop:8}}>
          <button className="btn btn-p" onClick={save}>Enregistrer</button>
          <button className="btn btn-o" onClick={()=>setForm(null)}>Annuler</button>
        </div>
      </div>
    </div>
  )

  // ---- Détail ----
  if (selected) return (
    <div>
      <button className="btn btn-o btn-sm" onClick={()=>setSelected(null)} style={{marginBottom:14}}>← Retour</button>
      <div className="card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div className="card-title" style={{fontSize:18,marginBottom:0}}>{selected.nom}</div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-o btn-sm" onClick={()=>openEdit(selected)}><Edit size={14}/> Modifier</button>
            <button className="btn btn-d btn-sm" onClick={()=>remove(selected.id)}><Trash2 size={14}/> Supprimer</button>
          </div>
        </div>
        <div className="grid2">
          <div className="fg"><label>Pays</label><input readOnly value={selected.pays||'—'}/></div>
          <div className="fg"><label>Devise</label><input readOnly value={selected.devise||'—'}/></div>
          <div className="fg"><label>Délai moyen</label><input readOnly value={selected.delai||'—'}/></div>
          <div className="fg"><label>Conditions paiement</label><input readOnly value={selected.conditions_paiement||'—'}/></div>
        </div>
      </div>
      <div className="card">
        <div className="card-title">Contact</div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div style={{display:'flex',alignItems:'center',gap:8,fontSize:15,color:'#e2e8f0'}}><Phone size={16} color="#f5c518"/> {selected.tel||selected.contact||'—'}</div>
          <div style={{display:'flex',alignItems:'center',gap:8,fontSize:15,color:'#e2e8f0'}}><Mail size={16} color="#f5c518"/> {selected.email||'—'}</div>
          <div style={{display:'flex',alignItems:'center',gap:8,fontSize:15,color:'#e2e8f0'}}><MapPin size={16} color="#f5c518"/> {selected.adresse||'—'}</div>
        </div>
      </div>
      <div className="card">
        <div className="card-title"><FileText size={18}/> Dernières commandes fournisseur</div>
        {(selected.commandes||[]).length===0 ? <div style={{color:'#64748b',fontSize:14}}>Aucune commande.</div> :
        <table className="tbl">
          <thead><tr><th>N°</th><th>Date</th><th>Montant</th><th>Statut</th></tr></thead>
          <tbody>
            {selected.commandes.map((c,i)=>(
              <tr key={i}><td style={{color:'#f5c518'}}>{c.numero}</td><td>{fmtDate(c.date_cmd)}</td><td>{fmtAr(c.total)}</td><td><span className="badge b-y">{c.statut}</span></td></tr>
            ))}
          </tbody>
        </table>}
      </div>
    </div>
  )

  // ---- Liste ----
  return <>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:8}}>
      <div className="search-bar" style={{marginBottom:0,flex:1,minWidth:200}}><Search size={16} color="#475569"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher un fournisseur..."/></div>
      <button className="btn btn-p" onClick={openNew}><Plus size={16}/> Ajouter fournisseur</button>
    </div>
    {list.length===0 ? <div className="card" style={{color:'#64748b'}}>Aucun fournisseur. Cliquez « Ajouter fournisseur ».</div> :
    <div className="grid2">
      {list.map((f)=>(
        <div key={f.id} className="card" style={{cursor:'pointer'}} onClick={()=>openDetail(f)}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
            <div>
              <div style={{fontWeight:600,fontSize:15,color:'#f8fafc'}}>{f.nom}</div>
              <div style={{fontSize:13,color:'#94a3b8',display:'flex',alignItems:'center',gap:4,marginTop:3}}><MapPin size={14}/> {f.pays||'—'}</div>
            </div>
            <div style={{display:'flex',gap:2}}>{[...Array(f.rating||0)].map((_,j)=><Star key={j} size={14} color="#f5c518" fill="#f5c518"/>)}</div>
          </div>
          <div style={{display:'flex',gap:14,fontSize:13,color:'#94a3b8',marginTop:6,flexWrap:'wrap'}}>
            <span>Délai: {f.delai||'—'}</span><span>Devise: {f.devise}</span>
          </div>
        </div>
      ))}
    </div>}
  </>
}
