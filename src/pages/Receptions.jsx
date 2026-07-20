import { useState, useEffect, useCallback } from 'react'
import { Package, Plus, Eye, Search, X, Trash2, Calculator } from 'lucide-react'
import { API, currentUser, fmtAr, fmtDate } from '../lib/api'

const badge = s => s==='Complète'?'b-g':s==='Partielle'?'b-y':'b-r'
const ligneBadge = s => s==='Reçu'?'b-g':s==='Partiel'?'b-y':'b-r'
const today = () => new Date().toISOString().slice(0,10)

export default function Receptions() {
  const [q, setQ] = useState('')
  const [list, setList] = useState([])
  const [aRecevoir, setARecevoir] = useState([])
  const [form, setForm] = useState(null)
  const [detail, setDetail] = useState(null)

  const load = useCallback(async () => { if (API) setList(await API.getReceptions({ recherche:q })) }, [q])
  useEffect(() => { load() }, [load])
  useEffect(() => { if (API) API.getCmdFournisseursARecevoir().then(setARecevoir) }, [])

  async function openNewFrom(cfId) {
    const cf = await API.getCmdFournisseurDetail(cfId)
    setForm({
      header:{ cmd_fournisseur_id:cf.id, cf_numero:cf.numero, fournisseur_nom:cf.fournisseur_nom, date_reception:today(), observations:'',
        frais:{ transport:cf.frais_transport||0, import:cf.frais_import||0, autres:cf.frais_autres||0 } },
      lignes: cf.lignes.map(l=>({ designation:l.designation, reference:l.reference, montant:Number(l.montant||0), quantite_commandee:Number(l.quantite||0), quantite_recue:Number(l.quantite||0) }))
    })
  }
  async function openDetail(r){ setDetail(await API.getReceptionDetail(r.id)) }
  const setRec = (i,v)=>setForm(f=>{const l=[...f.lignes];l[i]={...l[i],quantite_recue:v};return{...f,lignes:l}})
  const setFrais = (k,v)=>setForm(f=>({...f,header:{...f.header,frais:{...f.header.frais,[k]:v}}}))

  const totalMarch = () => (form?.lignes||[]).reduce((s,l)=>s+Number(l.montant||0),0)
  const totalFrais = () => { const fr=form?.header.frais||{}; return Number(fr.transport||0)+Number(fr.import||0)+Number(fr.autres||0) }
  const coutRevient = () => totalMarch()+totalFrais()

  async function save() {
    await API.saveReception(form, currentUser)
    setForm(null)
    setList(await API.getReceptions({ recherche:q }))
    setARecevoir(await API.getCmdFournisseursARecevoir())
  }
  async function remove(){ if(!confirm('Supprimer cette réception ?'))return; await API.deleteReception(detail.id, currentUser); setDetail(null); load() }

  // ---- Formulaire réception ----
  if (form) return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h3 style={{color:'#f8fafc',fontSize:18,margin:0}}>Réception — {form.header.cf_numero} · {form.header.fournisseur_nom}</h3>
        <button className="btn btn-o btn-sm" onClick={()=>setForm(null)}><X size={14}/> Fermer</button>
      </div>
      <div className="card">
        <div className="grid2">
          <div className="fg"><label>Date de réception</label><input type="date" value={form.header.date_reception} onChange={e=>setForm(f=>({...f,header:{...f.header,date_reception:e.target.value}}))}/></div>
        </div>
      </div>
      <div className="card">
        <div className="card-title"><Package size={18}/> Articles reçus</div>
        <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Pièce</th><th>Réf.</th><th>Qté commandée</th><th>Qté reçue</th><th>État</th></tr></thead>
          <tbody>
            {form.lignes.map((l,i)=>{
              const rec=Number(l.quantite_recue||0), cmd=Number(l.quantite_commandee||0)
              const st = rec<=0?'Manquant':(rec<cmd?'Partiel':'Reçu')
              return (
              <tr key={i}>
                <td>{l.designation}</td><td>{l.reference}</td><td>{cmd}</td>
                <td><input type="number" value={l.quantite_recue} onChange={e=>setRec(i,e.target.value)} style={{background:'#0f172a',border:'1px solid #334155',borderRadius:6,padding:'6px 10px',color:'#f8fafc',fontSize:14,width:80}}/></td>
                <td><span className={`badge ${ligneBadge(st)}`}>{st}</span></td>
              </tr>
            )})}
          </tbody>
        </table>
        </div>
      </div>
      <div className="card">
        <div className="card-title"><Calculator size={18}/> Frais &amp; coût de revient</div>
        <div className="grid2">
          <div className="fg"><label>Frais de transport (Ar)</label><input type="number" value={form.header.frais.transport} onChange={e=>setFrais('transport',e.target.value)}/></div>
          <div className="fg"><label>Frais d'importation / douane (Ar)</label><input type="number" value={form.header.frais.import} onChange={e=>setFrais('import',e.target.value)}/></div>
          <div className="fg"><label>Autres frais (Ar)</label><input type="number" value={form.header.frais.autres} onChange={e=>setFrais('autres',e.target.value)}/></div>
        </div>
        <div style={{display:'flex',gap:20,justifyContent:'flex-end',marginTop:8,flexWrap:'wrap'}}>
          <div style={{color:'#94a3b8',fontSize:14}}>Marchandise : <b style={{color:'#f8fafc'}}>{fmtAr(totalMarch())}</b></div>
          <div style={{color:'#94a3b8',fontSize:14}}>Frais : <b style={{color:'#f8fafc'}}>{fmtAr(totalFrais())}</b></div>
          <div style={{color:'#94a3b8',fontSize:15}}>Coût de revient : <b style={{color:'#f5c518',fontSize:17}}>{fmtAr(coutRevient())}</b></div>
        </div>
      </div>
      <div className="card">
        <div className="fg"><label>Observations</label><textarea value={form.header.observations} onChange={e=>setForm(f=>({...f,header:{...f.header,observations:e.target.value}}))} rows={2} style={{width:'100%',padding:'12px 16px',background:'#0f172a',border:'1px solid #334155',borderRadius:8,color:'#f8fafc',fontSize:15,outline:'none',resize:'vertical'}}/></div>
      </div>
      <div style={{display:'flex',gap:10}}>
        <button className="btn btn-p" onClick={save}>Valider la réception</button>
        <button className="btn btn-o" onClick={()=>setForm(null)}>Annuler</button>
      </div>
    </div>
  )

  // ---- Détail ----
  if (detail) return (
    <div>
      <button className="btn btn-o btn-sm" onClick={()=>setDetail(null)} style={{marginBottom:14}}>← Retour</button>
      <div className="card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div className="card-title" style={{marginBottom:0}}><Package size={18}/> {detail.numero} — {detail.fournisseur_nom}</div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}><span className={`badge ${badge(detail.statut)}`}>{detail.statut}</span><button className="btn btn-d btn-sm" onClick={remove}><Trash2 size={14}/></button></div>
        </div>
        <div className="grid2">
          <div className="fg"><label>Commande fournisseur</label><input readOnly value={detail.cf_numero||'—'}/></div>
          <div className="fg"><label>Date</label><input readOnly value={fmtDate(detail.date_reception)}/></div>
          <div className="fg"><label>Observations</label><input readOnly value={detail.observations||'—'}/></div>
        </div>
      </div>
      <div className="card">
        <div className="card-title">Articles ({detail.lignes.length})</div>
        <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Pièce</th><th>Réf.</th><th>Commandé</th><th>Reçu</th><th>État</th></tr></thead>
          <tbody>{detail.lignes.map(l=>(
            <tr key={l.id}><td>{l.designation}</td><td>{l.reference}</td><td>{l.quantite_commandee}</td><td>{l.quantite_recue}</td><td><span className={`badge ${ligneBadge(l.statut)}`}>{l.statut}</span></td></tr>
          ))}</tbody>
        </table>
        </div>
      </div>
    </div>
  )

  // ---- Liste ----
  return <>
    {aRecevoir.length>0 && <div className="card">
      <div className="card-title"><Package size={18}/> Commandes fournisseur à réceptionner</div>
      {aRecevoir.map(cf=>(
        <div key={cf.id} className="pay-row">
          <span style={{fontSize:15,color:'#f8fafc'}}><span style={{color:'#f5c518'}}>{cf.numero}</span> — {cf.fournisseur_nom} <span style={{fontSize:13,color:'#94a3b8'}}>({fmtAr(cf.total)}, {cf.statut})</span></span>
          <button className="btn btn-p btn-sm" onClick={()=>openNewFrom(cf.id)}><Plus size={14}/> Réceptionner</button>
        </div>
      ))}
    </div>}

    <div className="search-bar"><Search size={16} color="#475569"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher une réception..."/></div>
    <div className="card">
      <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr><th>N°</th><th>Cmd fourn.</th><th>Fournisseur</th><th>Date</th><th>Articles</th><th>Statut</th><th></th></tr></thead>
        <tbody>
          {list.length===0 ? <tr><td colSpan={7} style={{color:'#64748b',textAlign:'center',padding:20}}>Aucune réception. Réceptionnez une commande fournisseur ci-dessus.</td></tr> :
          list.map(r=>(
            <tr key={r.id}>
              <td style={{color:'#f5c518'}}>{r.numero}</td><td>{r.cf_numero||'—'}</td><td>{r.fournisseur_nom||'—'}</td>
              <td>{fmtDate(r.date_reception)}</td><td>{r.nb_lignes}</td>
              <td><span className={`badge ${badge(r.statut)}`}>{r.statut}</span></td>
              <td><button className="btn btn-o btn-sm" onClick={()=>openDetail(r)}><Eye size={14}/></button></td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  </>
}
