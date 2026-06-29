import { useState } from 'react'
import { ClipboardList, Plus, Eye, Search, X, Printer, Package } from 'lucide-react'

const commandes = [
  { id:'CF-015', fournisseur:'Guangzhou Auto', date:'22/06/2026', articles:5, montant:'3.2M Ar', devise:'CNY', statut:'En transit', badge:'b-y', clients:['Garage Rova','Auto Mada'] },
  { id:'CF-014', fournisseur:'Dubai Parts', date:'20/06/2026', articles:3, montant:'1.4M Ar', devise:'USD', statut:'Préparation', badge:'b-b', clients:['Pièces Express'] },
  { id:'CF-013', fournisseur:'Local Tana', date:'25/06/2026', articles:2, montant:'450k Ar', devise:'MGA', statut:'Livré', badge:'b-g', clients:['Moto Plus'] },
  { id:'CF-012', fournisseur:'Japan Direct', date:'15/06/2026', articles:8, montant:'4.8M Ar', devise:'JPY', statut:'En transit', badge:'b-y', clients:['Garage Rova','Méca Service','Garage Central'] },
  { id:'CF-011', fournisseur:'France Import', date:'10/06/2026', articles:2, montant:'920k Ar', devise:'EUR', statut:'Livré', badge:'b-g', clients:['Auto Mada'] },
]

const tabs = ['Toutes','En transit','Préparation','Livrées']
const tabMap = { 'En transit':'En transit','Préparation':'Préparation','Livrées':'Livré' }

export default function CmdFournisseurs() {
  const [tab, setTab] = useState('Toutes')
  const [showForm, setShowForm] = useState(false)
  const [detail, setDetail] = useState(null)
  const filtered = tab === 'Toutes' ? commandes : commandes.filter(c => c.statut === tabMap[tab])

  if (showForm) return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h3 style={{color:'#f8fafc',fontSize:18,margin:0}}>Nouvelle commande fournisseur</h3>
        <button className="btn btn-o btn-sm" onClick={()=>setShowForm(false)}><X size={14}/> Fermer</button>
      </div>
      <div className="card">
        <div className="card-title">Fournisseur</div>
        <div className="grid2">
          <div className="fg"><label>Fournisseur *</label>
            <select><option value="">— Sélectionner —</option><option>Guangzhou Auto Parts (CNY)</option><option>Dubai Parts Trading (USD)</option><option>Japan Direct Auto (JPY)</option><option>France Import Pièces (EUR)</option><option>Local Tana Parts (MGA)</option></select>
          </div>
          <div className="fg"><label>Date</label><input type="date" defaultValue="2026-06-29"/></div>
        </div>
      </div>
      <div className="card">
        <div className="card-title"><Package size={18}/> Regroupement des commandes clients</div>
        <p style={{fontSize:14,color:'#94a3b8',marginBottom:12}}>Sélectionnez les commandes clients à regrouper dans cette commande fournisseur :</p>
        {[
          {id:'CMD-047',client:'Garage Rova',pieces:'Filtre huile x10, Plaquettes x5'},
          {id:'CMD-046',client:'Auto Mada',pieces:'Courroie x8, Filtre x5'},
          {id:'CMD-043',client:'Garage Central',pieces:'Amortisseur x4'},
        ].map((c,i)=>(
          <label key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',background:'#0f172a',borderRadius:8,marginBottom:6,cursor:'pointer',fontSize:14,color:'#e2e8f0'}}>
            <input type="checkbox" defaultChecked={i<2} style={{accentColor:'#f0b429',width:18,height:18}}/>
            <div style={{flex:1}}>
              <div><span style={{color:'#f0b429'}}>{c.id}</span> — {c.client}</div>
              <div style={{fontSize:13,color:'#94a3b8',marginTop:2}}>{c.pieces}</div>
            </div>
          </label>
        ))}
      </div>
      <div className="card">
        <div className="card-title">Articles regroupés</div>
        <table className="tbl">
          <thead><tr><th>Pièce</th><th>Réf.</th><th>Qté totale</th><th>Prix unit.</th><th>Total</th></tr></thead>
          <tbody>
            <tr><td>Filtre à huile Toyota</td><td>FH-TOY-001</td><td>15</td><td>15k Ar</td><td>225k Ar</td></tr>
            <tr><td>Plaquettes frein Hilux</td><td>PF-HIL-003</td><td>5</td><td>65k Ar</td><td>325k Ar</td></tr>
            <tr><td>Courroie alternateur</td><td>CA-UNI-012</td><td>8</td><td>42k Ar</td><td>336k Ar</td></tr>
          </tbody>
        </table>
        <div style={{textAlign:'right',marginTop:10,fontSize:16,fontWeight:600,color:'#f0b429'}}>Total : 886k Ar</div>
      </div>
      <div className="card">
        <div className="fg"><label>Conditions de paiement</label>
          <select><option>Comptant</option><option>30 jours</option><option>45 jours</option><option>60 jours</option><option>90 jours</option><option>120 jours</option></select>
        </div>
        <div className="fg"><label>Observations</label><textarea placeholder="Notes, instructions spéciales..." rows={2} style={{width:'100%',padding:'12px 16px',background:'#0f172a',border:'1px solid #334155',borderRadius:8,color:'#f8fafc',fontSize:15,outline:'none',resize:'vertical'}}/></div>
      </div>
      <div style={{display:'flex',gap:10}}>
        <button className="btn btn-p">Créer la commande</button>
        <button className="btn btn-o"><Printer size={16}/> Bon de commande</button>
        <button className="btn btn-o" onClick={()=>setShowForm(false)}>Annuler</button>
      </div>
    </div>
  )

  if (detail) return (
    <div>
      <button className="btn btn-o btn-sm" onClick={()=>setDetail(null)} style={{marginBottom:14}}>← Retour</button>
      <div className="card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div className="card-title" style={{marginBottom:0}}><ClipboardList size={18}/> {detail.id} — {detail.fournisseur}</div>
          <span className={`badge ${detail.badge}`}>{detail.statut}</span>
        </div>
        <div className="grid2">
          <div className="fg"><label>Fournisseur</label><input readOnly value={detail.fournisseur}/></div>
          <div className="fg"><label>Date</label><input readOnly value={detail.date}/></div>
          <div className="fg"><label>Devise</label><input readOnly value={detail.devise}/></div>
          <div className="fg"><label>Montant</label><input readOnly value={detail.montant}/></div>
        </div>
      </div>
      <div className="card">
        <div className="card-title">Commandes clients regroupées</div>
        {detail.clients.map((c,i)=>(
          <div key={i} className="pay-row"><span style={{fontSize:15,color:'#f8fafc'}}>{c}</span><span className="badge b-y">En attente</span></div>
        ))}
      </div>
      <div className="card">
        <div className="card-title">Articles</div>
        <table className="tbl">
          <thead><tr><th>Pièce</th><th>Qté</th><th>PU</th><th>Total</th></tr></thead>
          <tbody>
            <tr><td>Filtre à huile Toyota</td><td>50</td><td>15k</td><td>750k Ar</td></tr>
            <tr><td>Plaquettes frein Hilux</td><td>30</td><td>65k</td><td>1.95M Ar</td></tr>
          </tbody>
        </table>
      </div>
      <div style={{display:'flex',gap:10}}>
        <button className="btn btn-p"><Printer size={16}/> Imprimer bon de commande</button>
        <button className="btn btn-s">Marquer comme reçu</button>
      </div>
    </div>
  )

  return <>
    <div className="stats">
      <div className="stat"><div className="label">En transit</div><div className="value" style={{color:'#f0b429'}}>2</div></div>
      <div className="stat"><div className="label">En préparation</div><div className="value" style={{color:'#3b82f6'}}>1</div></div>
      <div className="stat"><div className="label">Livrées ce mois</div><div className="value" style={{color:'#22c55e'}}>5</div></div>
      <div className="stat"><div className="label">Total engagé</div><div className="value" style={{color:'#f8fafc'}}>10.8M</div></div>
    </div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap',gap:8}}>
      <div className="tabs" style={{marginBottom:0}}>
        {tabs.map(t=><div key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t}</div>)}
      </div>
      <button className="btn btn-p" onClick={()=>setShowForm(true)}><Plus size={16}/> Nouvelle cmd fournisseur</button>
    </div>
    <div className="search-bar"><Search size={16} color="#475569"/><input placeholder="Rechercher par fournisseur, n°..."/></div>
    <div className="card">
      <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr><th>N°</th><th>Fournisseur</th><th>Date</th><th>Articles</th><th>Montant</th><th>Devise</th><th>Statut</th><th></th></tr></thead>
        <tbody>
          {filtered.map(c=>(
            <tr key={c.id}>
              <td style={{color:'#f0b429'}}>{c.id}</td>
              <td>{c.fournisseur}</td>
              <td>{c.date}</td>
              <td>{c.articles}</td>
              <td>{c.montant}</td>
              <td>{c.devise}</td>
              <td><span className={`badge ${c.badge}`}>{c.statut}</span></td>
              <td><button className="btn btn-o btn-sm" onClick={()=>setDetail(c)}><Eye size={14}/></button></td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  </>
}
