import { useState } from 'react'
import { Banknote, ArrowUpRight, ArrowDownLeft, Clock, Plus, X, AlertTriangle } from 'lucide-react'

const paiements = [
  { id:'PAY-031', type:'Encaissement', tiers:'Garage Rova', date:'28/06/2026', montant:'+600k Ar', mode:'Mobile Money', facture:'F-042', color:'#22c55e' },
  { id:'PAY-030', type:'Décaissement', tiers:'Guangzhou Auto', date:'27/06/2026', montant:'-2.4M Ar', mode:'Virement USD', facture:'CF-015', color:'#ef4444' },
  { id:'PAY-029', type:'Encaissement', tiers:'Pièces Express', date:'26/06/2026', montant:'+3.4M Ar', mode:'Chèque', facture:'F-040', color:'#22c55e' },
  { id:'PAY-028', type:'Décaissement', tiers:'Dubai Parts', date:'25/06/2026', montant:'-1.8M Ar', mode:'Virement USD', facture:'CF-014', color:'#ef4444' },
  { id:'PAY-027', type:'Encaissement', tiers:'Auto Mada', date:'24/06/2026', montant:'+680k Ar', mode:'Espèces', facture:'F-041', color:'#22c55e' },
  { id:'PAY-026', type:'Décaissement', tiers:'Local Tana', date:'23/06/2026', montant:'-450k Ar', mode:'Espèces', facture:'CF-013', color:'#ef4444' },
]

const tabs = ['Tous','Encaissements','Décaissements']

export default function Paiements() {
  const [tab, setTab] = useState('Tous')
  const [showForm, setShowForm] = useState(false)
  const filtered = tab === 'Tous' ? paiements : paiements.filter(p => tab === 'Encaissements' ? p.type === 'Encaissement' : p.type === 'Décaissement')

  if (showForm) return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h3 style={{color:'#f8fafc',fontSize:18,margin:0}}>Enregistrer un paiement</h3>
        <button className="btn btn-o btn-sm" onClick={()=>setShowForm(false)}><X size={14}/> Fermer</button>
      </div>
      <div className="card">
        <div className="grid2">
          <div className="fg"><label>Type *</label>
            <select><option>Encaissement (client paie)</option><option>Décaissement (je paie fournisseur)</option></select>
          </div>
          <div className="fg"><label>Tiers *</label>
            <select><option value="">— Sélectionner —</option><option>Garage Rova (client)</option><option>Auto Mada (client)</option><option>Guangzhou Auto (fournisseur)</option><option>Dubai Parts (fournisseur)</option></select>
          </div>
          <div className="fg"><label>Facture liée</label>
            <select><option value="">— Sélectionner —</option><option>F-042 — Garage Rova — 1.2M Ar</option><option>F-039 — Méca Service — 2.1M Ar</option></select>
          </div>
          <div className="fg"><label>Montant *</label><input type="number" placeholder="Montant en Ariary"/></div>
          <div className="fg"><label>Mode de paiement *</label>
            <select><option>Espèces</option><option>Mobile Money (MVola)</option><option>Virement bancaire</option><option>Chèque</option><option>Virement USD</option><option>Virement EUR</option></select>
          </div>
          <div className="fg"><label>Date</label><input type="date" defaultValue="2026-06-29"/></div>
          <div className="fg"><label>Délai de paiement</label>
            <select><option>Comptant</option><option>30 jours</option><option>45 jours</option><option>60 jours</option><option>90 jours</option><option>120 jours</option></select>
          </div>
          <div className="fg"><label>Reste à payer</label><input readOnly value="Calculé automatiquement" style={{color:'#94a3b8'}}/></div>
        </div>
        <div className="fg"><label>Référence / Notes</label><input placeholder="N° chèque, réf. virement, remarques..."/></div>
        <div className="ai-box" style={{marginTop:8}}>
          <strong>Paiement partiel :</strong> Si le montant est inférieur au total de la facture, le solde restant sera automatiquement suivi. Plusieurs paiements partiels sont possibles sur une même facture.
        </div>
      </div>
      <div style={{display:'flex',gap:10}}>
        <button className="btn btn-p"><Banknote size={16}/> Enregistrer le paiement</button>
        <button className="btn btn-o" onClick={()=>setShowForm(false)}>Annuler</button>
      </div>
    </div>
  )

  return <>
    <div className="stats">
      <div className="stat"><div className="label">Encaissé ce mois</div><div className="value" style={{color:'#22c55e'}}>4.68M</div></div>
      <div className="stat"><div className="label">Décaissé ce mois</div><div className="value" style={{color:'#ef4444'}}>4.65M</div></div>
      <div className="stat"><div className="label">Solde net</div><div className="value" style={{color:'#f0b429'}}>+30k</div></div>
      <div className="stat"><div className="label">Créances &gt;30j</div><div className="value" style={{color:'#ef4444'}}>2.1M</div></div>
    </div>

    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:8}}>
      <div className="tabs" style={{marginBottom:0}}>
        {tabs.map(t=><div key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t}</div>)}
      </div>
      <button className="btn btn-p" onClick={()=>setShowForm(true)}><Plus size={16}/> Nouveau paiement</button>
    </div>

    {filtered.map(p=>(
      <div key={p.id} className="pay-row">
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          {p.type==='Encaissement' ? <ArrowDownLeft size={20} color="#22c55e"/> : <ArrowUpRight size={20} color="#ef4444"/>}
          <div>
            <div style={{fontWeight:600,fontSize:15,color:'#f8fafc'}}>{p.tiers}</div>
            <div style={{fontSize:13,color:'#94a3b8'}}>{p.date} · {p.mode} · {p.facture}</div>
          </div>
        </div>
        <div style={{fontWeight:600,fontSize:16,color:p.color}}>{p.montant}</div>
      </div>
    ))}

    <div className="card" style={{marginTop:14}}>
      <div className="card-title"><AlertTriangle size={18} color="#ef4444"/> Échéances en retard</div>
      <div className="pay-row"><div><div style={{fontSize:15,color:'#f8fafc'}}>Méca Service</div><div style={{fontSize:13,color:'#94a3b8'}}>F-039 — échue depuis 45j</div></div><div style={{color:'#ef4444',fontWeight:600,fontSize:16}}>2.1M Ar</div></div>
      <div className="pay-row"><div><div style={{fontSize:15,color:'#f8fafc'}}>Guangzhou Auto</div><div style={{fontSize:13,color:'#94a3b8'}}>Solde à régler — 05/07</div></div><div style={{color:'#f0b429',fontWeight:600,fontSize:16}}>1.6M Ar</div></div>
    </div>
  </>
}
