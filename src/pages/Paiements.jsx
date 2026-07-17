import { useState, useEffect, useCallback } from 'react'
import { Banknote, ArrowUpRight, ArrowDownLeft, Clock, Plus, X, AlertTriangle, CheckCircle } from 'lucide-react'
import { API, currentUser, fmtAr, fmtDate } from '../lib/api'

const tabs = [{label:'Clients',type:'client'}, {label:'Fournisseurs',type:'fournisseur'}]
const modes = ['Espèces','Mvola','Virement','Chèque','Crédit']
const delais = [{label:'Comptant',jours:0},{label:'30 jours',jours:30},{label:'45 jours',jours:45},{label:'60 jours',jours:60},{label:'90 jours',jours:90},{label:'120 jours',jours:120}]
const today = () => new Date().toISOString().slice(0,10)

function addDays(d, days) {
  const x = new Date(d || today())
  x.setDate(x.getDate() + Number(days||0))
  return x.toISOString().slice(0,10)
}

export default function Paiements() {
  const [tab, setTab] = useState('client')
  const [list, setList] = useState([])
  const [clients, setClients] = useState([])
  const [fournisseurs, setFournisseurs] = useState([])
  const [factures, setFactures] = useState([])
  const [cmdFournisseurs, setCmdFournisseurs] = useState([])
  const [form, setForm] = useState(null)

  const load = useCallback(async () => {
    if (!API) return
    setList(await API.getPaiements({ type: tab }))
    setFactures(await API.getFactures({ statut:'Toutes' }))
    setCmdFournisseurs(await API.getCmdFournisseurs({ statut:'Toutes' }))
  }, [tab])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!API) return
    API.getClients({}).then(setClients)
    API.getFournisseurs({}).then(setFournisseurs)
  }, [])

  const tiers = tab==='client' ? clients : fournisseurs
  const docs = tab==='client'
    ? factures.map(f=>({ id:f.id, numero:f.numero, tiers_id:f.client_id, tiers_nom:f.client_nom, total:Number(f.total_ht||0), date:f.date_facture }))
    : cmdFournisseurs.map(c=>({ id:c.id, numero:c.numero, tiers_id:c.fournisseur_id, tiers_nom:c.fournisseur_nom, total:Number(c.total||0), date:c.date_cmd }))

  const paidByRef = list.filter(p=>p.statut==='Payé').reduce((a,p)=>{
    a[p.reference_doc] = (a[p.reference_doc]||0) + Number(p.montant||0)
    return a
  }, {})
  const restes = docs.map(d=>({ ...d, paye:paidByRef[d.numero]||0, reste:d.total-(paidByRef[d.numero]||0) })).filter(d=>d.reste>0)
  const stats = {
    paye: list.filter(p=>p.statut==='Payé').reduce((s,p)=>s+Number(p.montant||0),0),
    attente: list.filter(p=>p.statut==='En attente').reduce((s,p)=>s+Number(p.montant||0),0),
    du: restes.reduce((s,d)=>s+d.reste,0),
    retard: restes.filter(d=>new Date(d.date)<new Date(Date.now()-30*86400000)).reduce((s,d)=>s+d.reste,0)
  }

  function openNew() {
    setForm({ type:tab, tiers_id:'', tiers_nom:'', reference_doc:'', montant:0, mode:'Espèces', echeance:today(), date_paiement:today(), statut:'Payé', delai:'Comptant' })
  }
  const setF = (k,v)=>setForm(f=>({...f,[k]:v}))
  function selectTiers(id) {
    const t = tiers.find(x=>String(x.id)===String(id))
    setForm(f=>({...f,tiers_id:id,tiers_nom:t?.nom||'',reference_doc:'',montant:0}))
  }
  function selectDoc(numero) {
    const d = restes.find(x=>x.numero===numero) || docs.find(x=>x.numero===numero)
    setForm(f=>({
      ...f,
      reference_doc:numero,
      tiers_id:d?.tiers_id||f.tiers_id,
      tiers_nom:d?.tiers_nom||f.tiers_nom,
      montant:d ? Math.max(0, d.reste ?? d.total) : f.montant
    }))
  }
  function setDelai(label) {
    const d = delais.find(x=>x.label===label) || delais[0]
    setForm(f=>({...f,delai:label,echeance:addDays(f.date_paiement,d.jours)}))
  }
  function setMode(mode) {
    setForm(f=>({...f,mode,statut:mode==='Crédit'?'En attente':f.statut}))
  }
  async function save() {
    if (!form.tiers_id) return alert('Sélectionnez un tiers')
    if (!Number(form.montant||0)) return alert('Saisissez un montant')
    await API.savePaiement(form, currentUser)
    setForm(null); load()
  }
  async function markPaid(p) {
    await API.updatePaiement(p.id, { statut:'Payé', date_paiement:today() })
    load()
  }

  const docsForTiers = form?.tiers_id ? docs.filter(d=>String(d.tiers_id)===String(form.tiers_id)) : docs
  const currentDoc = form ? (restes.find(d=>d.numero===form.reference_doc) || docs.find(d=>d.numero===form.reference_doc)) : null

  if (form) return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h3 style={{color:'#f8fafc',fontSize:18,margin:0}}>Enregistrer un paiement</h3>
        <button className="btn btn-o btn-sm" onClick={()=>setForm(null)}><X size={14}/> Fermer</button>
      </div>
      <div className="card">
        <div className="grid2">
          <div className="fg"><label>Type</label><input readOnly value={form.type==='client'?'Client':'Fournisseur'}/></div>
          <div className="fg"><label>Tiers *</label>
            <select value={form.tiers_id} onChange={e=>selectTiers(e.target.value)}>
              <option value="">— Sélectionner —</option>
              {tiers.map(t=><option key={t.id} value={t.id}>{t.nom}</option>)}
            </select>
          </div>
          <div className="fg"><label>Document</label>
            <select value={form.reference_doc} onChange={e=>selectDoc(e.target.value)}>
              <option value="">— Facture / commande —</option>
              {docsForTiers.map(d=><option key={d.numero} value={d.numero}>{d.numero} — {d.tiers_nom||'—'} — {fmtAr(d.total)}</option>)}
            </select>
          </div>
          <div className="fg"><label>Montant *</label><input type="number" value={form.montant} onChange={e=>setF('montant',e.target.value)}/></div>
          <div className="fg"><label>Mode</label>
            <select value={form.mode} onChange={e=>setMode(e.target.value)}>{modes.map(m=><option key={m}>{m}</option>)}</select>
          </div>
          <div className="fg"><label>Statut</label>
            <select value={form.statut} onChange={e=>setF('statut',e.target.value)}><option>Payé</option><option>En attente</option></select>
          </div>
          <div className="fg"><label>Date paiement</label><input type="date" value={form.date_paiement} onChange={e=>setF('date_paiement',e.target.value)}/></div>
          <div className="fg"><label>Délai</label>
            <select value={form.delai} onChange={e=>setDelai(e.target.value)}>{delais.map(d=><option key={d.label}>{d.label}</option>)}</select>
          </div>
          <div className="fg"><label>Échéance</label><input type="date" value={form.echeance} onChange={e=>setF('echeance',e.target.value)}/></div>
          <div className="fg"><label>Reste estimé</label><input readOnly value={fmtAr(Math.max(0, Number((currentDoc?.reste ?? currentDoc?.total) || 0) - Number(form.montant||0)))}/></div>
        </div>
      </div>
      <div style={{display:'flex',gap:10}}>
        <button className="btn btn-p" onClick={save}><Banknote size={16}/> Enregistrer</button>
        <button className="btn btn-o" onClick={()=>setForm(null)}>Annuler</button>
      </div>
    </div>
  )

  return <>
    <div className="stats">
      <div className="stat"><div className="label">{tab==='client'?'Encaissé':'Décaissé'}</div><div className="value" style={{color:tab==='client'?'#22c55e':'#ef4444'}}>{fmtAr(stats.paye)}</div></div>
      <div className="stat"><div className="label">En attente</div><div className="value" style={{color:'#f5c518'}}>{fmtAr(stats.attente)}</div></div>
      <div className="stat"><div className="label">Reste à payer</div><div className="value" style={{color:'#f8fafc'}}>{fmtAr(stats.du)}</div></div>
      <div className="stat"><div className="label">Ancien &gt;30j</div><div className="value" style={{color:'#ef4444'}}>{fmtAr(stats.retard)}</div></div>
    </div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:8}}>
      <div className="tabs" style={{marginBottom:0}}>{tabs.map(t=><div key={t.type} className={`tab ${tab===t.type?'active':''}`} onClick={()=>setTab(t.type)}>{t.label}</div>)}</div>
      <button className="btn btn-p" onClick={openNew}><Plus size={16}/> Enregistrer un paiement</button>
    </div>

    <div className="card">
      <div className="card-title"><Banknote size={18}/> Paiements</div>
      {list.length===0 ? <div style={{color:'#64748b',fontSize:14}}>Aucun paiement enregistré.</div> :
      list.map(p=>(
        <div key={p.id} className="pay-row">
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            {p.type==='client' ? <ArrowDownLeft size={20} color="#22c55e"/> : <ArrowUpRight size={20} color="#ef4444"/>}
            <div>
              <div style={{fontWeight:600,fontSize:15,color:'#f8fafc'}}>{p.tiers_nom||'—'} <span className={`badge ${p.statut==='Payé'?'b-g':'b-y'}`} style={{marginLeft:6}}>{p.statut}</span></div>
              <div style={{fontSize:13,color:'#94a3b8'}}>{fmtDate(p.date_paiement)} · {p.mode} · {p.reference_doc||'—'} · échéance {fmtDate(p.echeance)}</div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {p.statut==='En attente' && <button className="btn btn-s btn-sm" onClick={()=>markPaid(p)}><CheckCircle size={14}/> Payé</button>}
            <div style={{fontWeight:600,fontSize:16,color:p.type==='client'?'#22c55e':'#ef4444'}}>{p.type==='client'?'+':'-'}{fmtAr(p.montant)}</div>
          </div>
        </div>
      ))}
    </div>

    <div className="card">
      <div className="card-title"><AlertTriangle size={18}/> Échéances et restes</div>
      {restes.length===0 ? <div style={{color:'#64748b',fontSize:14}}>Aucun reste à payer sur les documents connus.</div> :
      restes.map(d=>(
        <div key={d.numero} className="pay-row">
          <div>
            <div style={{fontSize:15,color:'#f8fafc'}}>{d.tiers_nom||'—'}</div>
            <div style={{fontSize:13,color:'#94a3b8'}}><Clock size={12} style={{verticalAlign:'-2px',marginRight:4}}/>{d.numero} · dû {fmtAr(d.total)} · payé {fmtAr(d.paye)}</div>
          </div>
          <div style={{color:'#f5c518',fontWeight:600,fontSize:16}}>{fmtAr(d.reste)}</div>
        </div>
      ))}
    </div>
  </>
}
