import { useState, useEffect, useCallback } from 'react'
import { FileText, Search, Plus, Eye, X, Calculator, Trash2, Printer } from 'lucide-react'
import { API, currentUser, fmtAr, fmtDate } from '../lib/api'
import { printDocument } from '../lib/files'

const tabs = ['Toutes','Impayée','Partielle','Payée']
const badge = s => s==='Payée'?'b-g':s==='Partielle'?'b-y':'b-r'
const today = () => new Date().toISOString().slice(0,10)
const inp = { background:'#0f172a', border:'1px solid #334155', borderRadius:6, padding:'6px 10px', color:'#f8fafc', fontSize:14, width:'100%' }

export default function Facturation() {
  const [tab, setTab] = useState('Toutes')
  const [q, setQ] = useState('')
  const [list, setList] = useState([])
  const [commandes, setCommandes] = useState([])
  const [form, setForm] = useState(null)
  const [detail, setDetail] = useState(null)
  const [cfg, setCfg] = useState({})

  const load = useCallback(async () => {
    if (!API) return
    setList(await API.getFactures({ statut: tab, recherche: q }))
  }, [tab, q])
  useEffect(() => { load() }, [load])
  useEffect(() => { if (API) { API.getCommandes({ statut:'Toutes' }).then(setCommandes); API.getConfig().then(c=>setCfg(c||{})) } }, [])

  function imprimerFacture(f) {
    const paye = (f.paiements||[]).filter(p=>p.statut==='Payé').reduce((s,p)=>s+Number(p.montant||0),0)
    const reste = Number(f.total_ht||0) - paye
    const lignes = (f.lignes||[]).map(l=>`<tr><td>${l.designation||''}</td><td>${l.reference||''}</td><td class="r">${l.quantite}</td><td class="r">${fmtAr(l.prix_unitaire)}</td><td class="r">${fmtAr(l.montant)}</td></tr>`).join('')
    printDocument('Facture '+f.numero, `
      <div class="row">
        <div class="box"><h1>${cfg.nom||'ABS STORE PIECES AUTOS'}</h1>
          <div class="sub">Distribution de pièces automobiles détachées</div>
          ${cfg.adresse?cfg.adresse+'<br>':''}${cfg.tel?'Tél : '+cfg.tel+'<br>':''}${cfg.email?cfg.email+'<br>':''}
          ${cfg.nif?'<b>NIF :</b> '+cfg.nif+'  ':''}${cfg.stat?'<b>STAT :</b> '+cfg.stat:''}
        </div>
        <div class="box" style="text-align:right">
          <div style="font-size:26px;font-weight:800;color:#b45309">FACTURE</div>
          <b>N° :</b> ${f.numero||''}<br><b>Date :</b> ${fmtDate(f.date_facture)}<br>
          ${f.commande_numero?'<b>Commande :</b> '+f.commande_numero+'<br>':''}<b>Statut :</b> ${f.statut}
        </div>
      </div>
      <div class="box" style="margin:6px 0 14px;padding:10px 14px;background:#fafafa;border-radius:8px">
        <b>Facturé à :</b> ${f.client_nom||'—'}
      </div>
      <table><thead><tr><th>Désignation</th><th>Réf.</th><th class="r">Qté</th><th class="r">Prix unit.</th><th class="r">Montant</th></tr></thead><tbody>${lignes}</tbody></table>
      <div class="tot">Total : ${fmtAr(f.total_ht)}</div>
      ${paye>0?`<div style="text-align:right;font-size:13px;color:#555;margin-top:4px">Payé : ${fmtAr(paye)} &nbsp;·&nbsp; <b style="color:#b45309">Reste à payer : ${fmtAr(reste)}</b></div>`:''}
      <div style="margin-top:34px;display:flex;justify-content:space-between">
        <div class="box">Arrêtée la présente facture à la somme de :<br><b>${fmtAr(f.total_ht)}</b></div>
        <div class="box" style="text-align:center">Signature &amp; cachet<br><br><br>____________________</div>
      </div>
      <div class="foot">${cfg.nom||'ABS STORE PIECES AUTOS'} — Merci de votre confiance</div>`)
  }

  const stats = list.reduce((a,f)=>{
    a.total += Number(f.total_ht||0)
    a.marge += Number(f.marge||0)
    if (f.statut==='Payée') a.payees += Number(f.total_ht||0)
    if (f.statut!=='Payée') a.reste += Number(f.total_ht||0)
    return a
  }, { total:0, marge:0, payees:0, reste:0 })

  function openNew() {
    setForm({ header:{ client_id:'', commande_id:'', date_facture:today(), statut:'Impayée' }, lignes:[] })
  }
  async function openDetail(f) { setDetail(await API.getFactureDetail(f.id)) }
  const setH = (k,v)=>setForm(f=>({...f,header:{...f.header,[k]:v}}))
  const setL = (i,k,v)=>setForm(f=>{const l=[...f.lignes];l[i]={...l[i],[k]:v};return{...f,lignes:l}})
  const addL = ()=>setForm(f=>({...f,lignes:[...f.lignes,{designation:'',reference:'',quantite:1,prix_unitaire:0,cout_unitaire:0}]}))
  const delL = i=>setForm(f=>({...f,lignes:f.lignes.filter((_,j)=>j!==i)}))
  const totalForm = ()=>(form?.lignes||[]).reduce((s,l)=>s+Number(l.quantite||0)*Number(l.prix_unitaire||0),0)
  const coutForm = ()=>(form?.lignes||[]).reduce((s,l)=>s+Number(l.quantite||0)*Number(l.cout_unitaire||0),0)
  const margeForm = ()=>totalForm()-coutForm()

  async function selectCommande(id) {
    setH('commande_id', id)
    if (!id) return setForm(f=>({...f,header:{...f.header,commande_id:'',client_id:''},lignes:[]}))
    const cmd = await API.getCommandeDetail(id)
    setForm(f=>({
      ...f,
      header:{...f.header,commande_id:String(id),client_id:cmd.client_id||''},
      lignes:(cmd.lignes||[]).map(l=>({
        designation:l.designation||'',
        reference:l.reference||'',
        quantite:l.quantite||1,
        prix_unitaire:l.prix_unitaire||0,
        cout_unitaire:l.prix_unitaire||0
      }))
    }))
  }

  async function save() {
    if (!form.header.commande_id) return alert('Sélectionnez une commande client')
    if (!form.lignes.some(l=>String(l.designation||'').trim())) return alert('Ajoutez au moins une ligne')
    await API.saveFacture({ header: form.header, lignes: form.lignes.filter(l=>String(l.designation||'').trim()) }, currentUser)
    setForm(null); load()
  }
  async function changeStatut(s) {
    await API.updateFactureStatut(detail.id, s)
    setDetail(await API.getFactureDetail(detail.id)); load()
  }

  if (form) return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h3 style={{color:'#f8fafc',fontSize:18,margin:0}}>Nouvelle facture</h3>
        <button className="btn btn-o btn-sm" onClick={()=>setForm(null)}><X size={14}/> Fermer</button>
      </div>
      <div className="card">
        <div className="card-title"><FileText size={18}/> Commande à facturer</div>
        <div className="grid2">
          <div className="fg"><label>Commande client *</label>
            <select value={form.header.commande_id} onChange={e=>selectCommande(e.target.value)}>
              <option value="">— Sélectionner une commande —</option>
              {commandes.map(c=><option key={c.id} value={c.id}>{c.numero} — {c.client_nom||'—'} ({fmtAr(c.total)})</option>)}
            </select>
          </div>
          <div className="fg"><label>Date facture</label><input type="date" value={form.header.date_facture} onChange={e=>setH('date_facture',e.target.value)}/></div>
          <div className="fg"><label>Statut</label>
            <select value={form.header.statut} onChange={e=>setH('statut',e.target.value)}>{tabs.filter(t=>t!=='Toutes').map(s=><option key={s}>{s}</option>)}</select>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-title"><Calculator size={18}/> Lignes et marge</div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Pièce</th><th>Réf.</th><th>Qté</th><th>Coût</th><th>Prix vente</th><th>Marge</th><th></th></tr></thead>
            <tbody>
              {form.lignes.length===0 ? <tr><td colSpan={7} style={{color:'#64748b',textAlign:'center',padding:18}}>Sélectionnez une commande pour pré-remplir les lignes</td></tr> :
              form.lignes.map((l,i)=>{
                const qte = Number(l.quantite||0)
                const marge = (Number(l.prix_unitaire||0)-Number(l.cout_unitaire||0))*qte
                return <tr key={i}>
                  <td><input value={l.designation} onChange={e=>setL(i,'designation',e.target.value)} style={inp}/></td>
                  <td><input value={l.reference} onChange={e=>setL(i,'reference',e.target.value)} style={{...inp,width:90}}/></td>
                  <td><input type="number" value={l.quantite} onChange={e=>setL(i,'quantite',e.target.value)} style={{...inp,width:70}}/></td>
                  <td><input type="number" value={l.cout_unitaire} onChange={e=>setL(i,'cout_unitaire',e.target.value)} style={{...inp,width:110}}/></td>
                  <td><input type="number" value={l.prix_unitaire} onChange={e=>setL(i,'prix_unitaire',e.target.value)} style={{...inp,width:110}}/></td>
                  <td style={{color:marge>=0?'#22c55e':'#ef4444',fontWeight:600}}>{fmtAr(marge)}</td>
                  <td><button className="btn btn-d btn-sm" onClick={()=>delL(i)}><Trash2 size={14}/></button></td>
                </tr>
              })}
            </tbody>
          </table>
        </div>
        <button className="btn btn-o btn-sm" style={{marginTop:10}} onClick={addL}><Plus size={14}/> Ajouter une ligne</button>
        <div style={{display:'flex',justifyContent:'flex-end',gap:18,marginTop:12,flexWrap:'wrap',fontWeight:600}}>
          <span style={{color:'#94a3b8'}}>Coût : {fmtAr(coutForm())}</span>
          <span style={{color:'#f5c518'}}>Total : {fmtAr(totalForm())}</span>
          <span style={{color:margeForm()>=0?'#22c55e':'#ef4444'}}>Marge : {fmtAr(margeForm())}</span>
        </div>
      </div>
      <div style={{display:'flex',gap:10}}>
        <button className="btn btn-p" onClick={save}>Créer la facture</button>
        <button className="btn btn-o" onClick={()=>setForm(null)}>Annuler</button>
      </div>
    </div>
  )

  if (detail) return (
    <div>
      <button className="btn btn-o btn-sm" onClick={()=>setDetail(null)} style={{marginBottom:14}}>← Retour</button>
      <div className="card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div className="card-title" style={{marginBottom:0}}><FileText size={18}/> {detail.numero}</div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <button className="btn btn-o btn-sm" onClick={()=>imprimerFacture(detail)}><Printer size={14}/> Imprimer / PDF</button>
            <span className={`badge ${badge(detail.statut)}`}>{detail.statut}</span>
          </div>
        </div>
        <div className="grid2">
          <div className="fg"><label>Client</label><input readOnly value={detail.client_nom||'—'}/></div>
          <div className="fg"><label>Commande</label><input readOnly value={detail.commande_numero||'—'}/></div>
          <div className="fg"><label>Date</label><input readOnly value={fmtDate(detail.date_facture)}/></div>
          <div className="fg"><label>Total HT</label><input readOnly value={fmtAr(detail.total_ht)}/></div>
          <div className="fg"><label>Marge</label><input readOnly value={fmtAr(detail.marge)}/></div>
          <div className="fg"><label>Payé</label><input readOnly value={fmtAr((detail.paiements||[]).filter(p=>p.statut==='Payé').reduce((s,p)=>s+Number(p.montant||0),0))}/></div>
        </div>
      </div>
      <div className="card">
        <div className="card-title">Articles ({detail.lignes.length})</div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Pièce</th><th>Réf.</th><th>Qté</th><th>Coût</th><th>PV</th><th>Montant</th><th>Marge</th></tr></thead>
            <tbody>{detail.lignes.map(l=><tr key={l.id}>
              <td>{l.designation}</td><td>{l.reference}</td><td>{l.quantite}</td><td>{fmtAr(l.cout_unitaire)}</td><td>{fmtAr(l.prix_unitaire)}</td><td>{fmtAr(l.montant)}</td>
              <td style={{color:'#22c55e',fontWeight:600}}>{fmtAr((Number(l.prix_unitaire||0)-Number(l.cout_unitaire||0))*Number(l.quantite||0))}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </div>
      <div style={{display:'flex',gap:10}}>
        <button className="btn btn-o" onClick={()=>changeStatut('Partielle')}>Marquer partielle</button>
        <button className="btn btn-s" onClick={()=>changeStatut('Payée')}>Marquer payée</button>
        <button className="btn btn-d" onClick={()=>changeStatut('Impayée')}>Marquer impayée</button>
      </div>
    </div>
  )

  return <>
    <div className="stats">
      <div className="stat"><div className="label">Total facturé</div><div className="value" style={{color:'#f8fafc'}}>{fmtAr(stats.total)}</div></div>
      <div className="stat"><div className="label">Marge</div><div className="value" style={{color:'#22c55e'}}>{fmtAr(stats.marge)}</div></div>
      <div className="stat"><div className="label">Payé</div><div className="value" style={{color:'#3b82f6'}}>{fmtAr(stats.payees)}</div></div>
      <div className="stat"><div className="label">À suivre</div><div className="value" style={{color:'#f5c518'}}>{fmtAr(stats.reste)}</div></div>
    </div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap',gap:8}}>
      <div className="tabs" style={{marginBottom:0}}>{tabs.map(t=><div key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t}</div>)}</div>
      <button className="btn btn-p" onClick={openNew}><Plus size={16}/> Nouvelle facture</button>
    </div>
    <div className="search-bar"><Search size={16} color="#475569"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher par facture, client, commande..."/></div>
    <div className="card">
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>N°</th><th>Client</th><th>Commande</th><th>Date</th><th>Montant</th><th>Marge</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            {list.length===0 ? <tr><td colSpan={8} style={{color:'#64748b',textAlign:'center',padding:20}}>Aucune facture</td></tr> :
            list.map(f=><tr key={f.id}>
              <td style={{color:'#f5c518'}}>{f.numero}</td><td>{f.client_nom||'—'}</td><td>{f.commande_numero||'—'}</td><td>{fmtDate(f.date_facture)}</td>
              <td>{fmtAr(f.total_ht)}</td><td style={{color:'#22c55e',fontWeight:600}}>{fmtAr(f.marge)}</td>
              <td><span className={`badge ${badge(f.statut)}`}>{f.statut}</span></td>
              <td><button className="btn btn-o btn-sm" onClick={()=>openDetail(f)}><Eye size={14}/> Voir</button></td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  </>
}
