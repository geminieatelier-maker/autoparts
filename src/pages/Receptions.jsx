import { Package, Truck, Clock, Plus, CheckCircle, AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'

const receptions = [
  { id:'REC-018', fournisseur:'Guangzhou Auto', date:'30/06/2026', pieces:14, statut:'En transit', badge:'b-y', progress:65, commande:'CF-015' },
  { id:'REC-017', fournisseur:'Dubai Parts', date:'02/07/2026', pieces:8, statut:'Préparation', badge:'b-b', progress:30, commande:'CF-014' },
  { id:'REC-016', fournisseur:'Local Tana', date:'29/06/2026', pieces:5, statut:'Arrivé', badge:'b-g', progress:100, commande:'CF-013' },
  { id:'REC-015', fournisseur:'Japan Direct', date:'10/07/2026', pieces:22, statut:'En transit', badge:'b-y', progress:45, commande:'CF-012' },
  { id:'REC-014', fournisseur:'France Import', date:'15/07/2026', pieces:6, statut:'Préparation', badge:'b-b', progress:15, commande:'CF-011' },
]

export default function Receptions() {
  const [tab, setTab] = useState('Toutes')
  const [showReception, setShowReception] = useState(false)
  const tabs = ['Toutes','En transit','Préparation','Arrivé']
  const filtered = tab === 'Toutes' ? receptions : receptions.filter(r => r.statut === tab)

  if (showReception) return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h3 style={{color:'#f8fafc',fontSize:18,margin:0}}>Réceptionner une livraison</h3>
        <button className="btn btn-o btn-sm" onClick={()=>setShowReception(false)}><X size={14}/> Fermer</button>
      </div>
      <div className="card">
        <div className="card-title">Commande fournisseur</div>
        <div className="grid2">
          <div className="fg"><label>N° commande fournisseur</label>
            <select><option>CF-015 — Guangzhou Auto (14 pièces)</option><option>CF-014 — Dubai Parts (8 pièces)</option><option>CF-012 — Japan Direct (22 pièces)</option></select>
          </div>
          <div className="fg"><label>Date de réception</label><input type="date" defaultValue="2026-06-29"/></div>
          <div className="fg"><label>Type de réception</label>
            <select><option>Réception totale</option><option>Réception partielle</option></select>
          </div>
          <div className="fg"><label>Transitaire / Transporteur</label><input placeholder="Ex: DHL, conteneur LC-2026-045"/></div>
        </div>
      </div>
      <div className="card">
        <div className="card-title">Vérification des articles</div>
        <table className="tbl">
          <thead><tr><th>Pièce</th><th>Commandé</th><th>Reçu</th><th>Manquant</th><th>État</th></tr></thead>
          <tbody>
            <tr><td>Filtre à huile Toyota</td><td>50</td><td><input type="number" defaultValue={50} style={{background:'#0f172a',border:'1px solid #334155',borderRadius:6,padding:'4px 8px',color:'#f8fafc',fontSize:14,width:60}}/></td><td style={{color:'#22c55e'}}>0</td><td><span className="badge b-g">OK</span></td></tr>
            <tr><td>Plaquettes frein Hilux</td><td>30</td><td><input type="number" defaultValue={28} style={{background:'#0f172a',border:'1px solid #334155',borderRadius:6,padding:'4px 8px',color:'#f8fafc',fontSize:14,width:60}}/></td><td style={{color:'#ef4444'}}>2</td><td><span className="badge b-r">Manquant</span></td></tr>
            <tr><td>Courroie alternateur</td><td>20</td><td><input type="number" defaultValue={20} style={{background:'#0f172a',border:'1px solid #334155',borderRadius:6,padding:'4px 8px',color:'#f8fafc',fontSize:14,width:60}}/></td><td style={{color:'#22c55e'}}>0</td><td><span className="badge b-g">OK</span></td></tr>
          </tbody>
        </table>
      </div>
      <div className="card">
        <div className="fg"><label>Notes de réception</label><textarea placeholder="Remarques, dommages constatés..." rows={2} style={{width:'100%',padding:'12px 16px',background:'#0f172a',border:'1px solid #334155',borderRadius:8,color:'#f8fafc',fontSize:15,outline:'none',resize:'vertical'}}/></div>
      </div>
      <div style={{display:'flex',gap:10}}>
        <button className="btn btn-s"><CheckCircle size={16}/> Valider la réception</button>
        <button className="btn btn-o" onClick={()=>setShowReception(false)}>Annuler</button>
      </div>
    </div>
  )

  return <>
    <div className="stats">
      <div className="stat"><div className="label">En transit</div><div className="value" style={{color:'#f0b429'}}>3</div></div>
      <div className="stat"><div className="label">En préparation</div><div className="value" style={{color:'#3b82f6'}}>2</div></div>
      <div className="stat"><div className="label">Arrivées ce mois</div><div className="value" style={{color:'#22c55e'}}>12</div></div>
    </div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:8}}>
      <div className="tabs" style={{marginBottom:0}}>
        {tabs.map(t=><div key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t}</div>)}
      </div>
      <button className="btn btn-p" onClick={()=>setShowReception(true)}><Plus size={16}/> Réceptionner</button>
    </div>
    {filtered.map(r=>(
      <div key={r.id} className="card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
          <div>
            <div style={{fontWeight:600,color:'#f8fafc',fontSize:15}}>{r.id} <span className={`badge ${r.badge}`} style={{marginLeft:6}}>{r.statut}</span></div>
            <div style={{fontSize:14,color:'#94a3b8',marginTop:4}}><Truck size={14} style={{marginRight:4}}/>{r.fournisseur} — {r.pieces} pièces · Cmd {r.commande}</div>
          </div>
          <div style={{fontSize:13,color:'#94a3b8',display:'flex',alignItems:'center',gap:4}}><Clock size={14}/> {r.date}</div>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{width:`${r.progress}%`,background: r.progress===100?'#22c55e':'#f0b429'}}/>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
          <span style={{fontSize:12,color:'#64748b'}}>{r.progress}%</span>
          {r.statut==='Arrivé' && <button className="btn btn-s btn-sm" onClick={()=>setShowReception(true)}><CheckCircle size={12}/> Réceptionner</button>}
        </div>
      </div>
    ))}
  </>
}
