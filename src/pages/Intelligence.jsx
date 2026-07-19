import { useState, useEffect, useRef } from 'react'
import { Brain, Send, TrendingUp, Scale, AlertTriangle, Lightbulb } from 'lucide-react'
import { API } from '../lib/api'

// Les 4 analyses rapides sont calculées LOCALEMENT (hors ligne, sans internet),
// conformément au cahier des charges (Art. 9). Seule la question libre passe par le moteur IA en ligne.
const rapides = [
  { icon: Scale, label: 'Comparer les prix fournisseurs', fn: 'analyseComparerPrix' },
  { icon: Lightbulb, label: 'Conseiller le meilleur achat', fn: 'analyseConseilAchat' },
  { icon: TrendingUp, label: 'Analyser la rentabilité', fn: 'analyseRentabilite' },
  { icon: AlertTriangle, label: 'Détecter les anomalies de prix', fn: 'analyseAnomalies' },
]

function formatIA(text) {
  if (!text || typeof text !== 'string') return String(text||'')
  let html = text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/^(#{1,3})\s+(.+)$/gm, (_, h, t) => `<div style="font-weight:700;font-size:${h.length===1?'15px':'14px'};color:#f5c518;margin:10px 0 4px">${t}</div>`)
    .replace(/^([A-ZÉÈÀÊÂ\s]{5,})$/gm, '<div style="font-weight:700;font-size:14px;color:#f5c518;margin:10px 0 4px">$1</div>')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/^[•●]\s?(.+)$/gm, '<div style="padding-left:12px;margin:2px 0">• $1</div>')
    .replace(/^- (.+)$/gm, '<div style="padding-left:12px;margin:2px 0">• $1</div>')
    .replace(/^(\d+)\.\s+(.+)$/gm, '<div style="padding-left:12px;margin:2px 0">$1. $2</div>')
    .replace(/→/g, '<span style="color:#f5c518">→</span>')
    .replace(/⚠️/g, '<span style="color:#f59e0b">⚠️</span>')
    .replace(/✅/g, '<span style="color:#22c55e">✅</span>')
    .replace(/\n{2,}/g, '<div style="height:8px"></div>')
    .replace(/\n/g, '<br/>')
  return html
}

export default function Intelligence() {
  const [msgs, setMsgs] = useState([])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const scroller = useRef(null)

  useEffect(() => { if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight }, [msgs, busy])

  async function envoyer(question) {
    const texte = (question || q).trim()
    if (!texte || busy || !API) return
    setMsgs(m => [...m, { role:'user', text:texte }]); setQ(''); setBusy(true)
    try {
      const rep = await API.askIA(texte)
      setMsgs(m => [...m, { role:'ia', text:rep }])
    } catch (e) {
      setMsgs(m => [...m, { role:'err', text: e.message || String(e) }])
    } finally { setBusy(false) }
  }

  // Analyse rapide calculée hors ligne sur les données locales (aucun appel internet).
  async function analyse(r) {
    if (busy || !API) return
    setMsgs(m => [...m, { role:'user', text:r.label }]); setBusy(true)
    try {
      const rep = await API[r.fn]()
      setMsgs(m => [...m, { role:'ia', text:rep, offline:true }])
    } catch (e) {
      setMsgs(m => [...m, { role:'err', text: e.message || String(e) }])
    } finally { setBusy(false) }
  }

  return <>
    <div className="card" style={{background:'linear-gradient(135deg,#1e293b,#243447)'}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:40,height:40,borderRadius:10,background:'#f5c518',display:'flex',alignItems:'center',justifyContent:'center'}}><Brain size={22} color="#0f172a"/></div>
        <div>
          <div style={{fontSize:16,fontWeight:600,color:'#f8fafc'}}>Assistant intelligent</div>
          <div style={{fontSize:13,color:'#94a3b8'}}>4 analyses instantanées <b>hors ligne</b> · questions libres via l'IA en ligne.</div>
        </div>
      </div>
    </div>

    <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:14}}>
      {rapides.map((r,i)=>(
        <button key={i} className="btn btn-o btn-sm" disabled={busy} onClick={()=>analyse(r)}><r.icon size={14}/> {r.label}</button>
      ))}
    </div>

    <div className="card" style={{minHeight:280}}>
      <div ref={scroller} style={{maxHeight:420,overflowY:'auto',display:'flex',flexDirection:'column',gap:10}}>
        {msgs.length===0 && <div style={{color:'#64748b',fontSize:14,textAlign:'center',padding:'30px 10px'}}>
          Posez une question ou cliquez sur une analyse rapide ci-dessus.
        </div>}
        {msgs.map((m,i)=>(
          <div key={i} style={{alignSelf: m.role==='user'?'flex-end':'flex-start', maxWidth:'85%'}}>
            {m.role==='ia' ? <div style={{
              padding:'14px 16px', borderRadius:12, fontSize:13, lineHeight:1.65,
              background:'#0f172a', color:'#e2e8f0', border:'1px solid #334155'
            }} dangerouslySetInnerHTML={{__html: formatIA(m.text)}} />
            : <div style={{
              padding:'10px 14px', borderRadius:12, fontSize:14, lineHeight:1.55,
              background: m.role==='user'?'#f5c518':'#7f1d1d',
              color: m.role==='user'?'#0f172a':'#fecaca'
            }}>{m.text}</div>}
            {m.offline && <div style={{fontSize:11,color:'#64748b',marginTop:3}}>🔒 Calcul local — hors ligne</div>}
          </div>
        ))}
        {busy && <div style={{alignSelf:'flex-start',color:'#94a3b8',fontSize:14,padding:'8px 12px'}}>Analyse en cours…</div>}
      </div>
    </div>

    <div className="search-bar" style={{marginTop:12}}>
      <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')envoyer()}} placeholder="Posez votre question (ex : quel fournisseur pour les filtres Toyota ?)" style={{flex:1}}/>
      <button className="btn btn-p btn-sm" disabled={busy||!q.trim()} onClick={()=>envoyer()}><Send size={14}/> Envoyer</button>
    </div>
  </>
}
