import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Phone, Mail, MapPin, Plus, Edit, Trash2, FileText, X, User, Upload, Download } from 'lucide-react'
import { API, fmtAr, fmtDate, currentUser } from '../lib/api'
import { exportExcel, importClientsExcel } from '../lib/files'

const emptyForm = { nom:'', contact:'', tel:'', contact2:'', tel2:'', email:'', adresse:'', remise:0, notes:'' }

export default function Clients() {
  const [list, setList] = useState([])
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(null)
  const [commandes, setCommandes] = useState([])
  const fileRef = useRef(null)

  const load = useCallback(async () => { if (API) setList(await API.getClients({ recherche: q })) }, [q])
  useEffect(() => { load() }, [load])

  // Import Excel
  async function onImportFile(e) {
    const file = e.target.files?.[0]; e.target.value = ''
    if (!file) return
    try {
      const rows = await importClientsExcel(file)
      if (!rows.length) return alert('Aucun client trouvé dans le fichier. Vérifiez qu\'il contient au moins une colonne « Nom du client ».')
      const res = await API.importClients(rows)
      alert(`${res.added} client(s) importé(s).` + (res.skipped ? `\n${res.skipped} déjà existant(s), ignoré(s).` : ''))
      load()
    } catch (err) { alert('Échec de l\'import : ' + (err.message || err)) }
  }
  function telechargerModele() {
    exportExcel([{
      'Nom du client':'Garage Rova (exemple)', 'Personne de contact':'Rakoto Jean',
      'Téléphone':'+261 34 12 345 67', 'Personne de contact 2':'Rasoa Marie', 'Téléphone 2':'+261 32 ...',
      'Email':'contact@exemple.mg', 'Adresse':'Antananarivo', 'Remise habituelle (%)':5, 'Notes':'À remplacer par vos clients'
    }], 'modele-clients.xlsx', 'Clients')
  }

  async function openDetail(c) {
    setSelected(c)
    if (API) setCommandes((await API.getCommandes({})).filter(x => x.client_nom === c.nom).slice(0, 8))
  }
  function openNew() { setForm({ ...emptyForm }) }
  function openEdit(c) { setForm({ ...c }); setSelected(null) }
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  async function save() {
    if (!form.nom.trim()) return alert('Le nom du client est obligatoire')
    await API.saveClient(form); setForm(null); setSelected(null); load()
  }
  async function remove(id) {
    if (!confirm('Supprimer ce client ?')) return
    await API.deleteClient(id, currentUser); setSelected(null); load()
  }

  // ---- Formulaire ----
  if (form) return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h3 style={{color:'#f8fafc',fontSize:18,margin:0}}>{form.id ? 'Modifier' : 'Nouveau'} client</h3>
        <button className="btn btn-o btn-sm" onClick={()=>setForm(null)}><X size={14}/> Fermer</button>
      </div>
      <div className="card">
        <div className="grid2">
          <div className="fg"><label>Nom du client *</label><input value={form.nom} onChange={e=>set('nom',e.target.value)} placeholder="Ex: Garage Rova"/></div>
          <div className="fg"><label>Personne de contact</label><input value={form.contact||''} onChange={e=>set('contact',e.target.value)} placeholder="Nom du contact"/></div>
          <div className="fg"><label>Téléphone</label><input value={form.tel||''} onChange={e=>set('tel',e.target.value)} placeholder="+261 34 ..."/></div>
          <div className="fg"><label>Personne de contact 2</label><input value={form.contact2||''} onChange={e=>set('contact2',e.target.value)} placeholder="2ᵉ contact (optionnel)"/></div>
          <div className="fg"><label>Téléphone 2</label><input value={form.tel2||''} onChange={e=>set('tel2',e.target.value)} placeholder="2ᵉ numéro (optionnel)"/></div>
          <div className="fg"><label>Email</label><input value={form.email||''} onChange={e=>set('email',e.target.value)} placeholder="client@email.com"/></div>
          <div className="fg"><label>Adresse</label><input value={form.adresse||''} onChange={e=>set('adresse',e.target.value)} placeholder="Adresse"/></div>
          <div className="fg"><label>Remise habituelle (%)</label><input type="number" value={form.remise||0} onChange={e=>set('remise',Number(e.target.value))} placeholder="0"/></div>
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
          <div className="card-title" style={{fontSize:18,marginBottom:0}}><User size={18}/> {selected.nom}</div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-o btn-sm" onClick={()=>openEdit(selected)}><Edit size={14}/> Modifier</button>
            <button className="btn btn-d btn-sm" onClick={()=>remove(selected.id)}><Trash2 size={14}/> Supprimer</button>
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div style={{display:'flex',alignItems:'center',gap:8,fontSize:15,color:'#e2e8f0'}}><Phone size={16} color="#f5c518"/> {selected.tel||'—'}{selected.contact?` · ${selected.contact}`:''}</div>
          {(selected.tel2||selected.contact2) && <div style={{display:'flex',alignItems:'center',gap:8,fontSize:15,color:'#94a3b8'}}><Phone size={16} color="#94a3b8"/> {selected.tel2||'—'}{selected.contact2?` · ${selected.contact2}`:''}</div>}
          <div style={{display:'flex',alignItems:'center',gap:8,fontSize:15,color:'#e2e8f0'}}><Mail size={16} color="#f5c518"/> {selected.email||'—'}</div>
          <div style={{display:'flex',alignItems:'center',gap:8,fontSize:15,color:'#e2e8f0'}}><MapPin size={16} color="#f5c518"/> {selected.adresse||'—'}</div>
          {selected.remise>0 && <div style={{fontSize:14,color:'#94a3b8'}}>Remise habituelle : <b style={{color:'#22c55e'}}>{selected.remise}%</b></div>}
          {selected.notes && <div style={{fontSize:14,color:'#94a3b8'}}>Notes : {selected.notes}</div>}
        </div>
      </div>
      <div className="card">
        <div className="card-title"><FileText size={18}/> Dernières commandes</div>
        {commandes.length===0 ? <div style={{color:'#64748b',fontSize:14}}>Aucune commande.</div> :
        <table className="tbl">
          <thead><tr><th>N°</th><th>Date</th><th>Montant</th><th>Statut</th></tr></thead>
          <tbody>{commandes.map(c=>(
            <tr key={c.id}><td style={{color:'#f5c518'}}>{c.numero}</td><td>{fmtDate(c.date_cmd)}</td><td>{fmtAr(c.total)}</td><td><span className="badge b-y">{c.statut}</span></td></tr>
          ))}</tbody>
        </table>}
      </div>
    </div>
  )

  // ---- Liste ----
  return <>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:8}}>
      <div className="search-bar" style={{marginBottom:0,flex:1,minWidth:200}}><Search size={16} color="#475569"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher un client..."/></div>
      <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{display:'none'}} onChange={onImportFile}/>
      <button className="btn btn-o" onClick={telechargerModele} title="Télécharger un fichier Excel vierge au bon format"><Download size={16}/> Modèle Excel</button>
      <button className="btn btn-o" onClick={()=>fileRef.current?.click()} title="Importer des clients depuis un fichier Excel"><Upload size={16}/> Importer Excel</button>
      <button className="btn btn-p" onClick={openNew}><Plus size={16}/> Ajouter client</button>
    </div>
    {list.length===0 ? <div className="card" style={{color:'#64748b'}}>Aucun client. Cliquez « Ajouter client ».</div> :
    <div className="grid2">
      {list.map(c=>(
        <div key={c.id} className="card" style={{cursor:'pointer'}} onClick={()=>openDetail(c)}>
          <div style={{fontWeight:600,fontSize:15,color:'#f8fafc',display:'flex',alignItems:'center',gap:8}}><User size={16} color="#f5c518"/> {c.nom}</div>
          <div style={{display:'flex',gap:14,fontSize:13,color:'#94a3b8',marginTop:6,flexWrap:'wrap'}}>
            {c.tel && <span>{c.tel}</span>}{c.contact && <span style={{color:'#cbd5e1'}}>{c.contact}</span>}{c.adresse && <span>{c.adresse}</span>}
          </div>
        </div>
      ))}
    </div>}
  </>
}
