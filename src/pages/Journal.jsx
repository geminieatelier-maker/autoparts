import { useState } from 'react'
import { ScrollText, Search, Filter, Download, User, Clock, FileText, ShoppingCart, Package, Banknote, Truck, Send, Settings } from 'lucide-react'

const events = [
  { date:'29/06/2026', heure:'10:45', utilisateur:'Admin', action:'Création commande CMD-048', type:'Commande', icon:ShoppingCart, color:'#3b82f6' },
  { date:'29/06/2026', heure:'10:30', utilisateur:'Admin', action:'Paiement PAY-031 enregistré — Garage Rova 600k Ar', type:'Paiement', icon:Banknote, color:'#22c55e' },
  { date:'29/06/2026', heure:'09:15', utilisateur:'Admin', action:'Réception REC-019 validée — Guangzhou Auto 50 pièces', type:'Réception', icon:Package, color:'#8b5cf6' },
  { date:'28/06/2026', heure:'17:20', utilisateur:'Admin', action:'Facture F-042 créée — Garage Rova 1.2M Ar', type:'Facture', icon:FileText, color:'#f0b429' },
  { date:'28/06/2026', heure:'16:00', utilisateur:'Admin', action:'Expédition EXP-012 préparée — 3 colis Antsirabe', type:'Expédition', icon:Send, color:'#06b6d4' },
  { date:'28/06/2026', heure:'14:30', utilisateur:'Vendeur1', action:'Commande CMD-047 modifiée — ajout 5 plaquettes', type:'Commande', icon:ShoppingCart, color:'#3b82f6' },
  { date:'28/06/2026', heure:'11:00', utilisateur:'Admin', action:'Nouveau fournisseur ajouté — Japan Direct Auto', type:'Fournisseur', icon:Truck, color:'#f97316' },
  { date:'27/06/2026', heure:'16:45', utilisateur:'Admin', action:'Décaissement PAY-030 — Guangzhou Auto 2.4M Ar', type:'Paiement', icon:Banknote, color:'#ef4444' },
  { date:'27/06/2026', heure:'15:10', utilisateur:'Admin', action:'Commande fournisseur CF-015 créée — 5 articles CNY', type:'Cmd fournisseur', icon:Package, color:'#8b5cf6' },
  { date:'27/06/2026', heure:'10:00', utilisateur:'Admin', action:'Comparaison prix lancée — Filtre huile 4 fournisseurs', type:'Comparaison', icon:Filter, color:'#f0b429' },
  { date:'26/06/2026', heure:'09:30', utilisateur:'Admin', action:'Connexion au système', type:'Système', icon:Settings, color:'#64748b' },
  { date:'26/06/2026', heure:'14:20', utilisateur:'Vendeur1', action:'Paiement PAY-029 enregistré — Pièces Express 3.4M Ar', type:'Paiement', icon:Banknote, color:'#22c55e' },
  { date:'25/06/2026', heure:'11:40', utilisateur:'Admin', action:'Export PDF factures du mois généré', type:'Système', icon:Download, color:'#64748b' },
  { date:'25/06/2026', heure:'10:15', utilisateur:'Admin', action:'Réception REC-018 — Dubai Parts 3 articles', type:'Réception', icon:Package, color:'#8b5cf6' },
  { date:'24/06/2026', heure:'16:00', utilisateur:'Admin', action:'Modification tarif — marge Hilux passée à 35%', type:'Paramètres', icon:Settings, color:'#64748b' },
]

const typeColors = {
  'Commande':'#3b82f6','Paiement':'#22c55e','Réception':'#8b5cf6','Facture':'#f0b429',
  'Expédition':'#06b6d4','Fournisseur':'#f97316','Cmd fournisseur':'#8b5cf6',
  'Comparaison':'#f0b429','Système':'#64748b','Paramètres':'#64748b'
}

const types = ['Tous','Commande','Paiement','Réception','Facture','Expédition','Fournisseur','Système']

export default function Journal() {
  const [typeFilter, setTypeFilter] = useState('Tous')
  const [search, setSearch] = useState('')
  const filtered = events.filter(e => {
    if (typeFilter !== 'Tous' && e.type !== typeFilter) return false
    if (search && !e.action.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const grouped = {}
  filtered.forEach(e => {
    if (!grouped[e.date]) grouped[e.date] = []
    grouped[e.date].push(e)
  })

  return <>
    <div className="stats">
      <div className="stat"><div className="label">Aujourd'hui</div><div className="value" style={{color:'#f0b429'}}>3</div></div>
      <div className="stat"><div className="label">Cette semaine</div><div className="value" style={{color:'#3b82f6'}}>15</div></div>
      <div className="stat"><div className="label">Utilisateurs actifs</div><div className="value" style={{color:'#22c55e'}}>2</div></div>
    </div>

    <div className="search-bar" style={{marginBottom:10}}>
      <Search size={16} color="#475569"/>
      <input placeholder="Rechercher une action..." value={search} onChange={e=>setSearch(e.target.value)}/>
    </div>

    <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap'}}>
      {types.map(t=>(
        <button key={t} className={`btn btn-sm ${typeFilter===t?'btn-p':'btn-o'}`} onClick={()=>setTypeFilter(t)} style={{fontSize:13,padding:'6px 12px'}}>
          {t}
        </button>
      ))}
    </div>

    <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginBottom:14}}>
      <button className="btn btn-o btn-sm"><Download size={14}/> Export PDF</button>
      <button className="btn btn-o btn-sm"><Download size={14}/> Export Excel</button>
    </div>

    {Object.entries(grouped).map(([date, evts]) => (
      <div key={date}>
        <div style={{fontSize:14,fontWeight:600,color:'#f0b429',marginBottom:8,marginTop:14,display:'flex',alignItems:'center',gap:8}}>
          <Clock size={14}/> {date}
        </div>
        {evts.map((e,i) => {
          const Icon = e.icon
          return (
            <div key={i} className="pay-row" style={{marginBottom:4}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:36,height:36,borderRadius:8,background:e.color+'22',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <Icon size={18} color={e.color}/>
                </div>
                <div>
                  <div style={{fontSize:15,color:'#f8fafc'}}>{e.action}</div>
                  <div style={{fontSize:13,color:'#94a3b8',display:'flex',alignItems:'center',gap:8,marginTop:2}}>
                    <span style={{display:'flex',alignItems:'center',gap:3}}><Clock size={12}/> {e.heure}</span>
                    <span style={{display:'flex',alignItems:'center',gap:3}}><User size={12}/> {e.utilisateur}</span>
                    <span className="badge b-b" style={{fontSize:11,padding:'2px 8px',background:e.color+'22',color:e.color,borderColor:e.color+'44'}}>{e.type}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    ))}
  </>
}
