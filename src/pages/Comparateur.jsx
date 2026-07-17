import { useState, useEffect, useCallback } from 'react'
import { Scale, TrendingDown, Plus, Send, CheckCircle, X, Trash2 } from 'lucide-react'
import { API, currentUser, fmtAr } from '../lib/api'

const dispoColor = d => d==='En stock'?'#22c55e':d==='Rupture'?'#ef4444':'#f5c518'

export default function Comparateur() {
  const [cotations, setCotations] = useState([])
  const [fournisseurs, setFournisseurs] = useState([])
  const [form, setForm] = useState(null)

  const load = useCallback(async () => { if (API) setCotations(await API.getCotations()) }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => { if (API) API.getFournisseurs({}).then(setFournisseurs) }, [])

  function openNew() {
    setForm({ header:{ designation:'', reference:'', quantite:10 },
      offres:[{ fournisseur_id:'', prix:'', devise:'MGA', disponibilite:'En stock', delai:'', moq:'', remarques:'' }] })
  }
  const setH = (k,v)=>setForm(f=>({...f,header:{...f.header,[k]:v}}))
  const setO = (i,k,v)=>setForm(f=>{const o=[...f.offres];o[i]={...o[i],[k]:v};return{...f,offres:o}})
  const addO = ()=>setForm(f=>({...f,offres:[...f.offres,{fournisseur_id:'',prix:'',devise:'MGA',disponibilite:'En stock',delai:'',moq:'',remarques:''}]}))
  const delO = i=>setForm(f=>({...f,offres:f.offres.filter((_,j)=>j!==i)}))

  async function save() {
    if (!form.header.designation.trim()) return alert('Indiquez la pièce')
    const offres = form.offres.filter(o=>o.fournisseur_id).map(o=>({...o, devise:o.devise||(fournisseurs.find(f=>f.id==o.fournisseur_id)?.devise), date_reception:new Date().toISOString().slice(0,10)}))
    await API.saveCotation({ header: form.header, offres }, currentUser)
    setForm(null); load()
  }
  async function choisir(cotId, offreId) { await API.choisirOffre(cotId, offreId); load() }
  async function remove(id) { if(!confirm('Supprimer cette demande de prix ?'))return; await API.deleteCotation(id); load() }

  // ---- Formulaire demande de prix ----
  if (form) return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h3 style={{color:'#f8fafc',fontSize:18,margin:0}}>Demande de prix fournisseurs</h3>
        <button className="btn btn-o btn-sm" onClick={()=>setForm(null)}>← Retour</button>
      </div>
      <div className="card">
        <div className="card-title">Pièce demandée</div>
        <div className="grid2">
          <div className="fg"><label>Pièce *</label><input value={form.header.designation} onChange={e=>setH('designation',e.target.value)} placeholder="Nom de la pièce"/></div>
          <div className="fg"><label>Référence</label><input value={form.header.reference} onChange={e=>setH('reference',e.target.value)} placeholder="Réf"/></div>
          <div className="fg"><label>Quantité souhaitée</label><input type="number" value={form.header.quantite} onChange={e=>setH('quantite',e.target.value)}/></div>
        </div>
      </div>
      <div className="card">
        <div className="card-title">Offres reçues des fournisseurs</div>
        <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Fournisseur</th><th>Prix (Ar)</th><th>Dispo.</th><th>Délai</th><th>MOQ</th><th>Remarques</th><th></th></tr></thead>
          <tbody>
            {form.offres.map((o,i)=>(
              <tr key={i}>
                <td><select value={o.fournisseur_id} onChange={e=>setO(i,'fournisseur_id',e.target.value)} style={{...inp,minWidth:150}}>
                  <option value="">— Choisir —</option>{fournisseurs.map(f=><option key={f.id} value={f.id}>{f.nom}</option>)}</select></td>
                <td><input type="number" value={o.prix} onChange={e=>setO(i,'prix',e.target.value)} placeholder="0" style={{...inp,width:100}}/></td>
                <td><select value={o.disponibilite} onChange={e=>setO(i,'disponibilite',e.target.value)} style={{...inp,width:120}}><option>En stock</option><option>Sur commande</option><option>Rupture</option></select></td>
                <td><input value={o.delai} onChange={e=>setO(i,'delai',e.target.value)} placeholder="14j" style={{...inp,width:70}}/></td>
                <td><input type="number" value={o.moq} onChange={e=>setO(i,'moq',e.target.value)} placeholder="1" style={{...inp,width:60}}/></td>
                <td><input value={o.remarques} onChange={e=>setO(i,'remarques',e.target.value)} placeholder="—" style={{...inp,width:130}}/></td>
                <td><button className="btn btn-d btn-sm" onClick={()=>delO(i)}><Trash2 size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <button className="btn btn-o btn-sm" style={{marginTop:10}} onClick={addO}><Plus size={14}/> Ajouter une offre fournisseur</button>
      </div>
      <div style={{display:'flex',gap:10}}>
        <button className="btn btn-p" onClick={save}><Send size={16}/> Enregistrer la comparaison</button>
        <button className="btn btn-o" onClick={()=>setForm(null)}>Annuler</button>
      </div>
    </div>
  )

  // ---- Liste des comparaisons ----
  return <>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:8}}>
      <h3 style={{color:'#f8fafc',fontSize:16,margin:0}}>Comparaison des prix fournisseurs</h3>
      <button className="btn btn-p" onClick={openNew}><Send size={16}/> Demander des prix</button>
    </div>

    {cotations.length===0 && <div className="card" style={{color:'#64748b'}}>Aucune demande de prix. Cliquez « Demander des prix » pour comparer les fournisseurs sur une pièce.</div>}

    {cotations.map((p)=>{
      const best = p.offres.reduce((b,o)=> (o.prix!=null && (!b || Number(o.prix)<Number(b.prix))) ? o : b, null)
      return (
      <div className="card" key={p.id}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div className="card-title" style={{marginBottom:0}}><Scale size={18}/> {p.designation} <span style={{fontSize:13,color:'#64748b',fontWeight:400}}>· Qté {p.quantite}</span></div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            {p.reference && <span style={{fontSize:13,color:'#64748b'}}>Réf: {p.reference}</span>}
            <button className="btn btn-d btn-sm" onClick={()=>remove(p.id)}><Trash2 size={14}/></button>
          </div>
        </div>
        {p.offres.length===0 && <div style={{color:'#64748b',fontSize:14}}>Aucune offre saisie.</div>}
        {p.offres.map((o)=>{
          const isBest = best && o.id===best.id
          return (
          <div key={o.id} className={`cmp-row ${o.choisi||isBest?'cmp-best':''}`}>
            <div>
              <div style={{fontSize:15,color:'#f8fafc',fontWeight:o.choisi||isBest?600:400}}>
                {o.fournisseur_nom||'—'} {o.choisi ? <span className="badge b-g" style={{marginLeft:6}}>Choisi</span> : isBest && <span className="badge b-g" style={{marginLeft:6}}>Meilleur prix</span>}
              </div>
              <div style={{fontSize:13,color:'#94a3b8',marginTop:3}}>Délai: {o.delai||'—'} · Devise: {o.devise||'—'} · MOQ: {o.moq||'—'} · <span style={{color:dispoColor(o.disponibilite)}}>{o.disponibilite||'—'}</span></div>
              {o.remarques && <div style={{fontSize:12,color:'#64748b',marginTop:2}}>{o.remarques}</div>}
            </div>
            <div style={{textAlign:'right',display:'flex',alignItems:'center',gap:10}}>
              <div style={{fontSize:17,fontWeight:600,color:isBest?'#22c55e':'#f8fafc'}}>{fmtAr(o.prix)}</div>
              {!o.choisi && <button className="btn btn-p btn-sm" onClick={()=>choisir(p.id,o.id)}><CheckCircle size={14}/> Choisir</button>}
              {isBest && <TrendingDown size={16} color="#22c55e"/>}
            </div>
          </div>
        )})}
      </div>
    )})}
  </>
}
const inp = { background:'#0f172a', border:'1px solid #334155', borderRadius:6, padding:'6px 8px', color:'#f8fafc', fontSize:14 }
