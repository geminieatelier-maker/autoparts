import { useState } from 'react'
import { Search, MapPin, Star, Phone, Mail, Plus, Edit, Trash2, FileText, X } from 'lucide-react'

const fournisseurs = [
  { nom:'Guangzhou Auto Parts', pays:'Chine 🇨🇳', devise:'CNY', rating:4, delai:'18-25j', contact:'+86 20 8888 1234', email:'sales@gzauto.cn', pieces:245, commandes:18, adresse:'45 Huanshi Road, Guangzhou' },
  { nom:'Dubai Parts Trading', pays:'EAU 🇦🇪', devise:'USD', rating:5, delai:'10-16j', contact:'+971 4 555 6789', email:'info@dubaiparts.ae', pieces:180, commandes:12, adresse:'Deira, Dubai, UAE' },
  { nom:'Japan Direct Auto', pays:'Japon 🇯🇵', devise:'JPY', rating:4, delai:'25-35j', contact:'+81 3 1234 5678', email:'order@jdauto.jp', pieces:120, commandes:6, adresse:'Chiyoda, Tokyo' },
  { nom:'France Import Pièces', pays:'France 🇫🇷', devise:'EUR', rating:3, delai:'20-30j', contact:'+33 1 42 00 00 00', email:'commande@fip.fr', pieces:90, commandes:4, adresse:'12 rue du Commerce, Paris' },
  { nom:'Local Tana Parts', pays:'Madagascar 🇲🇬', devise:'MGA', rating:3, delai:'1-3j', contact:'+261 34 00 000 00', email:'vente@localparts.mg', pieces:60, commandes:25, adresse:'Analakely, Antananarivo' },
]

export default function Fournisseurs() {
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)

  if (showForm) return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h3 style={{color:'#f8fafc',fontSize:18,margin:0}}>Nouveau fournisseur</h3>
        <button className="btn btn-o btn-sm" onClick={()=>setShowForm(false)}><X size={14}/> Fermer</button>
      </div>
      <div className="card">
        <div className="grid2">
          <div className="fg"><label>Nom du fournisseur *</label><input placeholder="Ex: Guangzhou Auto Parts"/></div>
          <div className="fg"><label>Pays</label><input placeholder="Ex: Chine"/></div>
          <div className="fg"><label>Devise</label>
            <select><option>MGA - Ariary</option><option>USD - Dollar</option><option>EUR - Euro</option><option>CNY - Yuan</option><option>JPY - Yen</option></select>
          </div>
          <div className="fg"><label>Délai moyen de livraison</label><input placeholder="Ex: 15-20 jours"/></div>
          <div className="fg"><label>Téléphone</label><input placeholder="+86 20 ..."/></div>
          <div className="fg"><label>Email</label><input placeholder="contact@fournisseur.com"/></div>
          <div className="fg"><label>Adresse</label><input placeholder="Adresse complète"/></div>
          <div className="fg"><label>Personne de contact</label><input placeholder="Nom du contact"/></div>
        </div>
        <div className="fg"><label>Notes</label><textarea placeholder="Conditions de paiement, remarques..." rows={3} style={{width:'100%',padding:'12px 16px',background:'#0f172a',border:'1px solid #334155',borderRadius:8,color:'#f8fafc',fontSize:15,outline:'none',resize:'vertical'}}/></div>
        <div style={{display:'flex',gap:10,marginTop:8}}>
          <button className="btn btn-p">Enregistrer</button>
          <button className="btn btn-o" onClick={()=>setShowForm(false)}>Annuler</button>
        </div>
      </div>
    </div>
  )

  if (selected) return (
    <div>
      <button className="btn btn-o btn-sm" onClick={()=>setSelected(null)} style={{marginBottom:14}}>← Retour</button>
      <div className="card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div className="card-title" style={{fontSize:18,marginBottom:0}}>{selected.nom}</div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-o btn-sm"><Edit size={14}/> Modifier</button>
            <button className="btn btn-d btn-sm"><Trash2 size={14}/> Supprimer</button>
          </div>
        </div>
        <div className="grid2">
          <div className="fg"><label>Pays</label><input readOnly value={selected.pays}/></div>
          <div className="fg"><label>Devise</label><input readOnly value={selected.devise}/></div>
          <div className="fg"><label>Délai moyen</label><input readOnly value={selected.delai}/></div>
          <div className="fg"><label>Adresse</label><input readOnly value={selected.adresse}/></div>
        </div>
      </div>
      <div className="stats" style={{marginBottom:14}}>
        <div className="stat"><div className="label">Pièces au catalogue</div><div className="value" style={{color:'#3b82f6'}}>{selected.pieces}</div></div>
        <div className="stat"><div className="label">Commandes actives</div><div className="value" style={{color:'#22c55e'}}>{selected.commandes}</div></div>
        <div className="stat"><div className="label">Note</div><div className="value" style={{color:'#f0b429'}}>{selected.rating}/5</div></div>
      </div>
      <div className="card">
        <div className="card-title">Contact</div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div style={{display:'flex',alignItems:'center',gap:8,fontSize:15,color:'#e2e8f0'}}><Phone size={16} color="#f0b429"/> {selected.contact}</div>
          <div style={{display:'flex',alignItems:'center',gap:8,fontSize:15,color:'#e2e8f0'}}><Mail size={16} color="#f0b429"/> {selected.email}</div>
          <div style={{display:'flex',alignItems:'center',gap:8,fontSize:15,color:'#e2e8f0'}}><MapPin size={16} color="#f0b429"/> {selected.adresse}</div>
        </div>
      </div>
      <div className="card">
        <div className="card-title"><FileText size={18}/> Dernières commandes</div>
        <table className="tbl">
          <thead><tr><th>N°</th><th>Date</th><th>Montant</th><th>Statut</th></tr></thead>
          <tbody>
            <tr><td style={{color:'#f0b429'}}>CF-012</td><td>25/06/2026</td><td>2.4M Ar</td><td><span className="badge b-g">Livré</span></td></tr>
            <tr><td style={{color:'#f0b429'}}>CF-009</td><td>10/06/2026</td><td>1.8M Ar</td><td><span className="badge b-y">En transit</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )

  return <>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:8}}>
      <div className="search-bar" style={{marginBottom:0,flex:1,minWidth:200}}><Search size={16} color="#475569"/><input placeholder="Rechercher un fournisseur..."/></div>
      <button className="btn btn-p" onClick={()=>setShowForm(true)}><Plus size={16}/> Ajouter fournisseur</button>
    </div>
    <div className="grid2">
      {fournisseurs.map((f,i)=>(
        <div key={i} className="card" style={{cursor:'pointer'}} onClick={()=>setSelected(f)}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
            <div>
              <div style={{fontWeight:600,fontSize:15,color:'#f8fafc'}}>{f.nom}</div>
              <div style={{fontSize:13,color:'#94a3b8',display:'flex',alignItems:'center',gap:4,marginTop:3}}><MapPin size={14}/> {f.pays}</div>
            </div>
            <div style={{display:'flex',gap:2}}>{[...Array(f.rating)].map((_,j)=><Star key={j} size={14} color="#f0b429" fill="#f0b429"/>)}</div>
          </div>
          <div style={{display:'flex',gap:14,fontSize:13,color:'#94a3b8',marginTop:6}}>
            <span>Délai: {f.delai}</span><span>Devise: {f.devise}</span><span>{f.pieces} pièces</span>
          </div>
        </div>
      ))}
    </div>
  </>
}
