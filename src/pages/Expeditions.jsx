import { Send, MapPin, Package, Clock, Plus, X, Printer } from 'lucide-react'
import { useState } from 'react'

const expeditions = [
  { id:'EXP-012', client:'Garage Rova', ville:'Antsirabe', date:'29/06/2026', colis:3, statut:'En préparation', badge:'b-b', transporteur:'Cotisse', facture:'F-042' },
  { id:'EXP-011', client:'Pièces Express', ville:'Mahajanga', date:'28/06/2026', colis:5, statut:'Expédié', badge:'b-y', transporteur:'First Logistics', facture:'F-040' },
  { id:'EXP-010', client:'Auto Mada', ville:'Antananarivo', date:'27/06/2026', colis:2, statut:'Livré', badge:'b-g', transporteur:'Livraison directe', facture:'F-041' },
  { id:'EXP-009', client:'Méca Service', ville:'Toamasina', date:'26/06/2026', colis:4, statut:'Livré', badge:'b-g', transporteur:'Cotisse', facture:'F-039' },
  { id:'EXP-008', client:'Garage Central', ville:'Fianarantsoa', date:'25/06/2026', colis:1, statut:'Livré', badge:'b-g', transporteur:'First Logistics', facture:'F-038' },
]

export default function Expeditions() {
  const [tab, setTab] = useState('Toutes')
  const [showForm, setShowForm] = useState(false)
  const tabs = ['Toutes','En préparation','Expédié','Livré']
  const filtered = tab === 'Toutes' ? expeditions : expeditions.filter(e => e.statut === tab)

  if (showForm) return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h3 style={{color:'#f8fafc',fontSize:18,margin:0}}>Nouvelle expédition</h3>
        <button className="btn btn-o btn-sm" onClick={()=>setShowForm(false)}><X size={14}/> Fermer</button>
      </div>
      <div className="card">
        <div className="card-title">Détails expédition</div>
        <div className="grid2">
          <div className="fg"><label>Client *</label>
            <select><option value="">— Sélectionner —</option><option>Garage Rova — Antsirabe</option><option>Pièces Express — Mahajanga</option><option>Auto Mada — Antananarivo</option></select>
          </div>
          <div className="fg"><label>Facture liée</label>
            <select><option value="">— Sélectionner —</option><option>F-042 — Garage Rova</option><option>F-040 — Pièces Express</option></select>
          </div>
          <div className="fg"><label>Mode d'expédition *</label>
            <select><option>Taxi-brousse</option><option>Transporteur (Cotisse, First...)</option><option>Livraison directe</option><option>Retrait sur place</option></select>
          </div>
          <div className="fg"><label>Transporteur</label><input placeholder="Nom du transporteur"/></div>
          <div className="fg"><label>Nombre de colis</label><input type="number" defaultValue={1}/></div>
          <div className="fg"><label>Numéro(s) de colis</label><input placeholder="Ex: COL-001, COL-002"/></div>
          <div className="fg"><label>Ville de destination</label><input placeholder="Ex: Antsirabe"/></div>
        </div>
        <div className="fg"><label>Notes</label><textarea placeholder="Instructions de livraison, poids, dimensions..." rows={2} style={{width:'100%',padding:'12px 16px',background:'#0f172a',border:'1px solid #334155',borderRadius:8,color:'#f8fafc',fontSize:15,outline:'none',resize:'vertical'}}/></div>
      </div>
      <div className="card">
        <div className="card-title">Articles à expédier</div>
        <table className="tbl">
          <thead><tr><th>Pièce</th><th>Qté</th><th>Colis</th></tr></thead>
          <tbody>
            <tr><td>Filtre à huile Toyota</td><td>10</td><td>Colis 1</td></tr>
            <tr><td>Plaquettes frein Hilux</td><td>5</td><td>Colis 1</td></tr>
            <tr><td>Courroie alternateur</td><td>8</td><td>Colis 2</td></tr>
          </tbody>
        </table>
      </div>
      <div style={{display:'flex',gap:10}}>
        <button className="btn btn-p"><Send size={16}/> Créer l'expédition</button>
        <button className="btn btn-o"><Printer size={16}/> Bordereau d'expédition</button>
        <button className="btn btn-o" onClick={()=>setShowForm(false)}>Annuler</button>
      </div>
    </div>
  )

  return <>
    <div className="stats">
      <div className="stat"><div className="label">En préparation</div><div className="value" style={{color:'#3b82f6'}}>1</div></div>
      <div className="stat"><div className="label">En transit</div><div className="value" style={{color:'#f0b429'}}>1</div></div>
      <div className="stat"><div className="label">Livrés ce mois</div><div className="value" style={{color:'#22c55e'}}>8</div></div>
    </div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:8}}>
      <div className="tabs" style={{marginBottom:0}}>
        {tabs.map(t=><div key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t}</div>)}
      </div>
      <button className="btn btn-p" onClick={()=>setShowForm(true)}><Plus size={16}/> Nouvelle expédition</button>
    </div>
    {filtered.map(e=>(
      <div key={e.id} className="card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div>
            <div style={{fontWeight:600,color:'#f8fafc',fontSize:15}}>{e.id} <span className={`badge ${e.badge}`} style={{marginLeft:6}}>{e.statut}</span></div>
            <div style={{fontSize:14,color:'#e2e8f0',marginTop:4}}>{e.client}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:13,color:'#94a3b8',display:'flex',alignItems:'center',gap:4}}><Clock size={14}/> {e.date}</div>
            <div style={{fontSize:13,color:'#64748b',marginTop:2}}>{e.facture}</div>
          </div>
        </div>
        <div style={{display:'flex',gap:16,marginTop:10,fontSize:14,color:'#94a3b8'}}>
          <span style={{display:'flex',alignItems:'center',gap:4}}><MapPin size={14} color="#f0b429"/> {e.ville}</span>
          <span style={{display:'flex',alignItems:'center',gap:4}}><Package size={14}/> {e.colis} colis</span>
          <span style={{display:'flex',alignItems:'center',gap:4}}><Send size={14}/> {e.transporteur}</span>
        </div>
      </div>
    ))}
  </>
}
