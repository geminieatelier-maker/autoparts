import { useState } from 'react'
import { FileText, Search, Plus, Download, Printer, Eye, X, Calculator } from 'lucide-react'

const factures = [
  { id:'F-042', client:'Garage Rova', date:'28/06/2026', montant:'1.2M Ar', coutRevient:'840k Ar', marge:'30%', statut:'En attente', badge:'b-y' },
  { id:'F-041', client:'Auto Mada', date:'27/06/2026', montant:'680k Ar', coutRevient:'510k Ar', marge:'25%', statut:'Payée', badge:'b-g' },
  { id:'F-040', client:'Pièces Express', date:'25/06/2026', montant:'3.4M Ar', coutRevient:'2.38M Ar', marge:'30%', statut:'Payée', badge:'b-g' },
  { id:'F-039', client:'Méca Service', date:'15/05/2026', montant:'2.1M Ar', coutRevient:'1.47M Ar', marge:'30%', statut:'Impayée', badge:'b-r' },
  { id:'F-038', client:'Garage Central', date:'20/06/2026', montant:'890k Ar', coutRevient:'623k Ar', marge:'30%', statut:'Payée', badge:'b-g' },
  { id:'F-037', client:'Moto Plus', date:'18/06/2026', montant:'1.8M Ar', coutRevient:'1.26M Ar', marge:'30%', statut:'En attente', badge:'b-y' },
]

const tabs = ['Toutes','En attente','Payées','Impayées']

export default function Facturation() {
  const [tab, setTab] = useState('Toutes')
  const [showForm, setShowForm] = useState(false)
  const filtered = tab === 'Toutes' ? factures : factures.filter(f => {
    if (tab === 'Payées') return f.statut === 'Payée'
    if (tab === 'Impayées') return f.statut === 'Impayée'
    return f.statut === tab
  })

  if (showForm) return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h3 style={{color:'#f8fafc',fontSize:18,margin:0}}>Nouvelle facture</h3>
        <button className="btn btn-o btn-sm" onClick={()=>setShowForm(false)}><X size={14}/> Fermer</button>
      </div>
      <div className="card">
        <div className="grid2">
          <div className="fg"><label>Client *</label>
            <select><option value="">— Sélectionner —</option><option>Garage Rova</option><option>Auto Mada</option><option>Pièces Express</option></select>
          </div>
          <div className="fg"><label>Commande liée</label>
            <select><option value="">— Depuis une commande —</option><option>CMD-047 — Garage Rova</option><option>CMD-046 — Auto Mada</option></select>
          </div>
          <div className="fg"><label>Date</label><input type="date" defaultValue="2026-06-29"/></div>
          <div className="fg"><label>Échéance paiement</label><input type="date" defaultValue="2026-07-29"/></div>
        </div>
      </div>
      <div className="card">
        <div className="card-title">Lignes de facturation</div>
        <table className="tbl">
          <thead><tr><th>Pièce</th><th>Qté</th><th>Coût revient</th><th>Prix vente</th><th>Marge</th></tr></thead>
          <tbody>
            <tr>
              <td><input placeholder="Pièce" style={{background:'#0f172a',border:'1px solid #334155',borderRadius:6,padding:'6px 10px',color:'#f8fafc',fontSize:14,width:'100%'}}/></td>
              <td><input type="number" defaultValue={1} style={{background:'#0f172a',border:'1px solid #334155',borderRadius:6,padding:'6px 10px',color:'#f8fafc',fontSize:14,width:60}}/></td>
              <td style={{color:'#94a3b8'}}>25k Ar</td>
              <td><input type="number" placeholder="0" style={{background:'#0f172a',border:'1px solid #334155',borderRadius:6,padding:'6px 10px',color:'#f8fafc',fontSize:14,width:100}}/></td>
              <td style={{color:'#22c55e',fontWeight:600}}>—</td>
            </tr>
          </tbody>
        </table>
        <button className="btn btn-o btn-sm" style={{marginTop:10}}><Plus size={14}/> Ajouter ligne</button>
      </div>
      <div className="card">
        <div className="card-title"><Calculator size={14}/> Détail coût de revient</div>
        <div className="grid2">
          <div className="fg"><label>Prix d'achat fournisseur</label><input readOnly value="Auto (depuis cmd fournisseur)" style={{color:'#94a3b8'}}/></div>
          <div className="fg"><label>Frais de transport</label><input type="number" placeholder="0 Ar"/></div>
          <div className="fg"><label>Frais d'importation / douane</label><input type="number" placeholder="0 Ar"/></div>
          <div className="fg"><label>Autres frais (manutention, etc.)</label><input type="number" placeholder="0 Ar"/></div>
        </div>
        <div className="ai-box" style={{marginTop:8}}>
          <strong>Calcul automatique :</strong> Coût de revient = Prix d'achat + Transport + Import + Autres frais. La marge est calculée automatiquement sur chaque ligne.
        </div>
      </div>
      <div style={{display:'flex',gap:10,marginTop:12}}>
        <button className="btn btn-p">Créer la facture</button>
        <button className="btn btn-o" onClick={()=>setShowForm(false)}>Annuler</button>
      </div>
    </div>
  )

  return <>
    <div className="stats">
      <div className="stat"><div className="label">Total facturé</div><div className="value" style={{color:'#f8fafc'}}>10.1M</div><div className="sub" style={{color:'#94a3b8'}}>Ce mois</div></div>
      <div className="stat"><div className="label">Payé</div><div className="value" style={{color:'#22c55e'}}>4.97M</div><div className="sub" style={{color:'#22c55e'}}>49%</div></div>
      <div className="stat"><div className="label">En attente</div><div className="value" style={{color:'#f0b429'}}>3.0M</div></div>
      <div className="stat"><div className="label">Impayé</div><div className="value" style={{color:'#ef4444'}}>2.1M</div><div className="sub" style={{color:'#ef4444'}}>1 facture &gt;30j</div></div>
    </div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap',gap:8}}>
      <div className="tabs" style={{marginBottom:0}}>
        {tabs.map(t=><div key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t}</div>)}
      </div>
      <button className="btn btn-p" onClick={()=>setShowForm(true)}><Plus size={16}/> Nouvelle facture</button>
    </div>
    <div style={{display:'flex',gap:8,marginBottom:10}}>
      <button className="btn btn-o btn-sm"><Download size={14}/> Export PDF</button>
      <button className="btn btn-o btn-sm"><Download size={14}/> Export Excel</button>
    </div>
    <div className="search-bar"><Search size={16} color="#475569"/><input placeholder="Rechercher une facture..."/></div>
    <div className="card">
      <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr><th>N°</th><th>Client</th><th>Date</th><th>Montant</th><th>Coût</th><th>Marge</th><th>Statut</th><th></th></tr></thead>
        <tbody>
          {filtered.map(f=>(
            <tr key={f.id}>
              <td style={{color:'#f0b429'}}>{f.id}</td>
              <td>{f.client}</td>
              <td>{f.date}</td>
              <td>{f.montant}</td>
              <td style={{color:'#94a3b8'}}>{f.coutRevient}</td>
              <td style={{color:'#22c55e',fontWeight:600}}>{f.marge}</td>
              <td><span className={`badge ${f.badge}`}>{f.statut}</span></td>
              <td style={{display:'flex',gap:4}}>
                <button className="btn btn-o btn-sm"><Printer size={12}/></button>
                <button className="btn btn-o btn-sm"><Download size={12}/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  </>
}
