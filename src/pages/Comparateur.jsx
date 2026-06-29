import { useState } from 'react'
import { Scale, TrendingDown, TrendingUp, Plus, Send, CheckCircle } from 'lucide-react'

const pieces = [
  { nom:'Filtre à huile Toyota', ref:'FH-TOY-001', fournisseurs:[
    { nom:'Guangzhou Auto', prix:'18k Ar', delai:'21j', devise:'CNY', moq:50, best:false, dispo:'En stock', dateReponse:'25/06/2026', remarques:'Qualité OEM' },
    { nom:'Dubai Parts', prix:'15k Ar', delai:'14j', devise:'USD', moq:20, best:true, dispo:'En stock', dateReponse:'26/06/2026', remarques:'Livraison rapide DHL' },
    { nom:'Local Tana', prix:'25k Ar', delai:'2j', devise:'MGA', moq:1, best:false, dispo:'En stock', dateReponse:'27/06/2026', remarques:'Retrait sur place' },
  ]},
  { nom:'Plaquettes frein Hilux', ref:'PF-HIL-003', fournisseurs:[
    { nom:'Guangzhou Auto', prix:'65k Ar', delai:'21j', devise:'CNY', moq:30, best:true, dispo:'En stock', dateReponse:'25/06/2026', remarques:'Lot min 30 pcs' },
    { nom:'Dubai Parts', prix:'72k Ar', delai:'14j', devise:'USD', moq:10, best:false, dispo:'Sur commande', dateReponse:'26/06/2026', remarques:'Délai +5j si rupture' },
    { nom:'Japan Direct', prix:'95k Ar', delai:'30j', devise:'JPY', moq:5, best:false, dispo:'En stock', dateReponse:'24/06/2026', remarques:'Qualité supérieure Japon' },
  ]},
  { nom:'Courroie distribution Peugeot', ref:'CD-PEU-007', fournisseurs:[
    { nom:'Dubai Parts', prix:'42k Ar', delai:'14j', devise:'USD', moq:10, best:true, dispo:'En stock', dateReponse:'26/06/2026', remarques:'' },
    { nom:'France Import', prix:'58k Ar', delai:'25j', devise:'EUR', moq:5, best:false, dispo:'Rupture', dateReponse:'23/06/2026', remarques:'Réapprovisionnement prévu 15/07' },
  ]},
]

export default function Comparateur() {
  const [showDemande, setShowDemande] = useState(false)

  if (showDemande) return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h3 style={{color:'#f8fafc',fontSize:18,margin:0}}>Demande de prix fournisseurs</h3>
        <button className="btn btn-o btn-sm" onClick={()=>setShowDemande(false)}>← Retour</button>
      </div>
      <div className="card">
        <div className="card-title">Pièces à demander</div>
        <table className="tbl">
          <thead><tr><th>Pièce</th><th>Réf.</th><th>Qté souhaitée</th></tr></thead>
          <tbody>
            <tr>
              <td><input placeholder="Nom de la pièce" style={{background:'#0f172a',border:'1px solid #334155',borderRadius:6,padding:'6px 10px',color:'#f8fafc',fontSize:14,width:'100%'}}/></td>
              <td><input placeholder="Réf" style={{background:'#0f172a',border:'1px solid #334155',borderRadius:6,padding:'6px 10px',color:'#f8fafc',fontSize:14,width:100}}/></td>
              <td><input type="number" defaultValue={10} style={{background:'#0f172a',border:'1px solid #334155',borderRadius:6,padding:'6px 10px',color:'#f8fafc',fontSize:14,width:80}}/></td>
            </tr>
          </tbody>
        </table>
        <button className="btn btn-o btn-sm" style={{marginTop:10}}><Plus size={14}/> Ajouter une pièce</button>
      </div>
      <div className="card">
        <div className="card-title">Fournisseurs à contacter</div>
        {['Guangzhou Auto Parts','Dubai Parts Trading','Japan Direct Auto','France Import Pièces','Local Tana Parts'].map((f,i)=>(
          <label key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'#0f172a',borderRadius:8,marginBottom:6,cursor:'pointer',fontSize:15,color:'#e2e8f0'}}>
            <input type="checkbox" defaultChecked={i<3} style={{accentColor:'#f0b429',width:18,height:18}}/> {f}
          </label>
        ))}
      </div>
      <div style={{display:'flex',gap:10}}>
        <button className="btn btn-p"><Send size={16}/> Envoyer les demandes</button>
        <button className="btn btn-o" onClick={()=>setShowDemande(false)}>Annuler</button>
      </div>
    </div>
  )

  return <>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:8}}>
      <h3 style={{color:'#f8fafc',fontSize:16,margin:0}}>Comparaison des prix fournisseurs</h3>
      <button className="btn btn-p" onClick={()=>setShowDemande(true)}><Send size={16}/> Demander des prix</button>
    </div>

    <div className="ai-box" style={{marginBottom:16}}>
      <strong>Recommandation IA :</strong> Dubai Parts offre le meilleur rapport qualité/prix/délai pour 60% de vos pièces courantes. Économie estimée : 180k Ar/mois en passant les filtres Toyota chez eux.
    </div>

    {pieces.map((p,i)=>(
      <div className="card" key={i}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div className="card-title" style={{marginBottom:0}}><Scale size={18}/> {p.nom}</div>
          <span style={{fontSize:13,color:'#64748b'}}>Réf: {p.ref}</span>
        </div>
        {p.fournisseurs.map((f,j)=>(
          <div key={j} className={`cmp-row ${f.best?'cmp-best':''}`}>
            <div>
              <div style={{fontSize:15,color:'#f8fafc',fontWeight:f.best?600:400}}>
                {f.nom} {f.best && <span className="badge b-g" style={{marginLeft:6}}>Meilleur choix</span>}
              </div>
              <div style={{fontSize:13,color:'#94a3b8',marginTop:3}}>Délai: {f.delai} · Devise: {f.devise} · MOQ: {f.moq} · <span style={{color:f.dispo==='En stock'?'#22c55e':f.dispo==='Rupture'?'#ef4444':'#f0b429'}}>{f.dispo}</span></div>
              <div style={{fontSize:12,color:'#64748b',marginTop:2}}>Reçu le {f.dateReponse}{f.remarques ? ` · ${f.remarques}`:''}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:17,fontWeight:600,color:f.best?'#22c55e':'#f8fafc'}}>{f.prix}</div>
              {f.best ? <TrendingDown size={16} color="#22c55e"/> : <TrendingUp size={16} color="#ef4444"/>}
            </div>
          </div>
        ))}
        <div style={{marginTop:8,display:'flex',gap:8}}>
          <button className="btn btn-p btn-sm"><CheckCircle size={14}/> Commander chez le meilleur</button>
          <button className="btn btn-o btn-sm"><Send size={14}/> Redemander les prix</button>
        </div>
      </div>
    ))}
  </>
}
