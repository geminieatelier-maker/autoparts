import { useState } from 'react'
import { Plus, Search, Eye, FileText, X, Edit, Trash2, Printer, Download } from 'lucide-react'

const data = [
  { id:'CMD-047', client:'Garage Rova', date:'28/06/2026', montant:'1.2M Ar', statut:'En cours', badge:'b-y', pieces:3, priorite:'Urgente', observations:'Livraison avant vendredi' },
  { id:'CMD-046', client:'Auto Mada', date:'27/06/2026', montant:'680k Ar', statut:'Devis', badge:'b-b', pieces:2, priorite:'Normale', observations:'' },
  { id:'CMD-045', client:'Pièces Express', date:'26/06/2026', montant:'3.4M Ar', statut:'Livré', badge:'b-g', pieces:5, priorite:'Normale', observations:'Client régulier - remise 5%' },
  { id:'CMD-044', client:'Méca Service', date:'25/06/2026', montant:'2.1M Ar', statut:'Impayé', badge:'b-r', pieces:4, priorite:'Normale', observations:'Relancer pour paiement' },
  { id:'CMD-043', client:'Garage Central', date:'24/06/2026', montant:'890k Ar', statut:'En cours', badge:'b-y', pieces:2, priorite:'Urgente', observations:'' },
  { id:'CMD-042', client:'Moto Plus', date:'23/06/2026', montant:'1.8M Ar', statut:'Livré', badge:'b-g', pieces:3, priorite:'Normale', observations:'' },
]

const tabs = ['Toutes','En cours','Devis','Livrées','Impayées']
const tabMap = { 'En cours':'En cours', 'Devis':'Devis', 'Livrées':'Livré', 'Impayées':'Impayé' }

export default function Commandes() {
  const [tab, setTab] = useState('Toutes')
  const [detail, setDetail] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const filtered = tab === 'Toutes' ? data : data.filter(d => d.statut === tabMap[tab])

  if (showForm) return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h3 style={{color:'#f8fafc',fontSize:18,margin:0}}>Nouvelle commande client</h3>
        <button className="btn btn-o btn-sm" onClick={()=>setShowForm(false)}><X size={14}/> Fermer</button>
      </div>
      <div className="card">
        <div className="card-title">Informations client</div>
        <div className="grid2">
          <div className="fg"><label>Client *</label>
            <select><option value="">— Sélectionner un client —</option><option>Garage Rova</option><option>Auto Mada</option><option>Pièces Express</option><option>Méca Service</option><option>Garage Central</option><option>Moto Plus</option></select>
          </div>
          <div className="fg"><label>Date</label><input type="date" defaultValue="2026-06-29"/></div>
          <div className="fg"><label>Type</label>
            <select><option>Commande</option><option>Devis</option><option>Proforma</option></select>
          </div>
          <div className="fg"><label>Priorité</label>
            <select><option>Normale</option><option>Urgente</option></select>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-title">Articles commandés</div>
        <table className="tbl">
          <thead><tr><th>Pièce</th><th>Réf.</th><th>Qté</th><th>PU (Ar)</th><th>Total</th></tr></thead>
          <tbody>
            <tr>
              <td><input placeholder="Nom de la pièce" style={{background:'#0f172a',border:'1px solid #334155',borderRadius:6,padding:'6px 10px',color:'#f8fafc',fontSize:14,width:'100%'}}/></td>
              <td><input placeholder="Réf" style={{background:'#0f172a',border:'1px solid #334155',borderRadius:6,padding:'6px 10px',color:'#f8fafc',fontSize:14,width:80}}/></td>
              <td><input type="number" defaultValue={1} style={{background:'#0f172a',border:'1px solid #334155',borderRadius:6,padding:'6px 10px',color:'#f8fafc',fontSize:14,width:60}}/></td>
              <td><input type="number" placeholder="0" style={{background:'#0f172a',border:'1px solid #334155',borderRadius:6,padding:'6px 10px',color:'#f8fafc',fontSize:14,width:100}}/></td>
              <td style={{color:'#94a3b8'}}>0 Ar</td>
            </tr>
          </tbody>
        </table>
        <button className="btn btn-o btn-sm" style={{marginTop:10}}><Plus size={14}/> Ajouter une ligne</button>
      </div>
      <div className="card">
        <div className="fg"><label>Notes / remarques</label><textarea placeholder="Conditions, délai souhaité..." rows={2} style={{width:'100%',padding:'12px 16px',background:'#0f172a',border:'1px solid #334155',borderRadius:8,color:'#f8fafc',fontSize:15,outline:'none',resize:'vertical'}}/></div>
      </div>
      <div style={{display:'flex',gap:10}}>
        <button className="btn btn-p">Enregistrer la commande</button>
        <button className="btn btn-o">Enregistrer comme devis</button>
        <button className="btn btn-o" onClick={()=>setShowForm(false)}>Annuler</button>
      </div>
    </div>
  )

  if (detail) return (
    <div>
      <button className="btn btn-o btn-sm" onClick={()=>setDetail(null)} style={{marginBottom:14}}>← Retour</button>
      <div className="card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div className="card-title" style={{marginBottom:0}}><FileText size={18}/> Commande {detail.id}</div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-o btn-sm"><Edit size={14}/> Modifier</button>
            <button className="btn btn-o btn-sm"><Printer size={14}/> Imprimer</button>
            <button className="btn btn-d btn-sm"><Trash2 size={14}/> Supprimer</button>
          </div>
        </div>
        <div className="grid2">
          <div className="fg"><label>Client</label><input readOnly value={detail.client}/></div>
          <div className="fg"><label>Date</label><input readOnly value={detail.date}/></div>
          <div className="fg"><label>Montant total</label><input readOnly value={detail.montant}/></div>
          <div className="fg"><label>Statut</label><input readOnly value={detail.statut}/></div>
          <div className="fg"><label>Priorité</label><input readOnly value={detail.priorite}/></div>
          <div className="fg"><label>Observations</label><input readOnly value={detail.observations || '—'}/></div>
        </div>
      </div>
      <div className="card">
        <div className="card-title">Articles ({detail.pieces} pièces)</div>
        <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Pièce</th><th>Réf.</th><th>Qté</th><th>PU</th><th>Total</th></tr></thead>
          <tbody>
            <tr><td>Filtre à huile Toyota</td><td>FH-TOY-001</td><td>10</td><td>25k</td><td>250k Ar</td></tr>
            <tr><td>Plaquettes frein Hilux</td><td>PF-HIL-003</td><td>5</td><td>85k</td><td>425k Ar</td></tr>
            <tr><td>Courroie alternateur</td><td>CA-UNI-012</td><td>8</td><td>45k</td><td>360k Ar</td></tr>
          </tbody>
        </table>
        </div>
      </div>
      <div style={{display:'flex',gap:10}}>
        <button className="btn btn-s">Marquer comme livré</button>
        <button className="btn btn-p">Créer facture</button>
        <button className="btn btn-o">Demander prix fournisseurs</button>
      </div>
    </div>
  )

  return <>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap',gap:8}}>
      <div className="tabs" style={{marginBottom:0}}>
        {tabs.map(t=><div key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t}</div>)}
      </div>
      <button className="btn btn-p" onClick={()=>setShowForm(true)}><Plus size={16}/> Nouvelle commande</button>
    </div>
    <div style={{display:'flex',gap:8,marginBottom:10}}>
      <button className="btn btn-o btn-sm"><Download size={14}/> Export PDF</button>
      <button className="btn btn-o btn-sm"><Download size={14}/> Export Excel</button>
      <button className="btn btn-o btn-sm"><Plus size={14}/> Import Excel</button>
    </div>
    <div className="search-bar"><Search size={16} color="#475569"/><input placeholder="Rechercher par client, n° commande..."/></div>
    <div className="card">
      <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr><th>N°</th><th>Client</th><th>Date</th><th>Pièces</th><th>Montant</th><th>Priorité</th><th>Statut</th><th></th></tr></thead>
        <tbody>
          {filtered.map(c=>(
            <tr key={c.id}>
              <td style={{color:'#f0b429'}}>{c.id}</td>
              <td>{c.client}</td>
              <td>{c.date}</td>
              <td>{c.pieces}</td>
              <td>{c.montant}</td>
              <td><span className={`badge ${c.priorite==='Urgente'?'b-r':'b-b'}`} style={{fontSize:11}}>{c.priorite}</span></td>
              <td><span className={`badge ${c.badge}`}>{c.statut}</span></td>
              <td><button className="btn btn-o btn-sm" onClick={()=>setDetail(c)}><Eye size={14}/> Voir</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  </>
}
