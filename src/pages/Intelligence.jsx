import { Brain, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, BarChart3, Send, MessageCircle } from 'lucide-react'
import { useState } from 'react'

const fakeResponses = {
  'filtre':  'D\'après vos 6 derniers mois de ventes, le filtre à huile Toyota est votre pièce #1 (48 unités/mois). Dubai Parts offre le meilleur prix à 15k Ar (vs 18k Guangzhou, 25k Local). Recommandation : commander par lot de 100 pour obtenir -8% supplémentaire.',
  'marge': 'Votre marge moyenne est de 28% ce mois, en baisse de 3% par rapport à mai. Cause principale : hausse du CNY (+5.2%). Les pièces importées de Chine ont vu leur coût augmenter. Passez les filtres et freins Toyota sur Dubai Parts (USD) pour regagner 4% de marge.',
  'fournisseur': 'Vous avez 5 fournisseurs actifs. Dubai Parts a le meilleur score fiabilité (98% livraison à temps). Guangzhou Auto est le moins cher en volume mais les délais sont longs (21j). Local Tana est idéal pour le dépannage urgent (2j).',
  'default': 'J\'ai analysé vos données. Basé sur votre historique de commandes, ventes et paiements, voici ce que je constate : votre activité est en croissance de 12% ce mois. Attention à la créance Méca Service (2.1M Ar, 45j de retard) — je recommande une relance immédiate.'
}

export default function Intelligence() {
  const [messages, setMessages] = useState([
    { role:'ai', text:'Bonjour ! Je suis votre assistant IA. Posez-moi des questions sur vos données : ventes, marges, fournisseurs, tendances...' }
  ])
  const [input, setInput] = useState('')

  function handleSend() {
    if (!input.trim()) return
    const q = input.toLowerCase()
    const newMsgs = [...messages, { role:'user', text: input }]
    const key = q.includes('filtre') ? 'filtre' : q.includes('marge') ? 'marge' : q.includes('fournisseur') ? 'fournisseur' : 'default'
    setTimeout(()=> setMessages(m => [...m, { role:'ai', text: fakeResponses[key] }]), 600)
    setMessages(newMsgs)
    setInput('')
  }

  return <>
    <div className="card" style={{marginBottom:16}}>
      <div className="card-title"><MessageCircle size={18}/> Assistant IA</div>
      <div style={{maxHeight:220,overflowY:'auto',marginBottom:10}}>
        {messages.map((m,i)=>(
          <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start',marginBottom:8}}>
            <div style={{
              maxWidth:'80%',padding:'10px 14px',borderRadius:12,fontSize:13,lineHeight:1.5,
              background:m.role==='user'?'#f0b429':'#0f172a',
              color:m.role==='user'?'#0a1628':'#e2e8f0',
              borderBottomRightRadius:m.role==='user'?2:12,
              borderBottomLeftRadius:m.role==='ai'?2:12,
            }}>{m.text}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSend()}
          placeholder="Ex: Quel est mon meilleur fournisseur ?"
          style={{flex:1,padding:'10px 14px',background:'#0f172a',border:'1px solid #334155',borderRadius:8,color:'#f8fafc',fontSize:13,outline:'none'}}/>
        <button onClick={handleSend} className="btn btn-p" style={{padding:'10px 14px'}}><Send size={16}/></button>
      </div>
    </div>

    <div className="ai-box" style={{marginBottom:16}}>
      <strong>🤖 Analyse IA — Juin 2026</strong><br/><br/>
      Votre marge moyenne a baissé de 3% ce mois à cause de la hausse du CNY (+5.2%). Recommandation : diversifiez vers Dubai Parts pour les filtres et freins Toyota — délai plus court et prix compétitif en USD.
    </div>

    <div className="grid2">
      <div className="card">
        <div className="card-title"><TrendingUp size={18}/> Top ventes</div>
        {[
          { nom:'Filtre à huile Toyota', qty:48, trend:'+12%' },
          { nom:'Plaquettes frein Hilux', qty:35, trend:'+8%' },
          { nom:'Courroie alternateur', qty:28, trend:'+5%' },
          { nom:'Amortisseur Peugeot 307', qty:22, trend:'-3%' },
          { nom:'Kit embrayage Hyundai', qty:18, trend:'+15%' },
        ].map((p,i)=>(
          <div key={i} className="pay-row">
            <div>
              <div style={{fontSize:13,color:'#f8fafc'}}>{p.nom}</div>
              <div style={{fontSize:11,color:'#64748b'}}>{p.qty} vendus</div>
            </div>
            <span style={{color:p.trend.startsWith('+')?'#22c55e':'#ef4444',fontWeight:600,fontSize:13}}>{p.trend}</span>
          </div>
        ))}
      </div>

      <div>
        <div className="card">
          <div className="card-title"><BarChart3 size={18}/> Tendances prix</div>
          {[
            { nom:'CNY → MGA', val:'+5.2%', color:'#ef4444', detail:'Hausse Yuan chinois' },
            { nom:'USD → MGA', val:'+2.1%', color:'#f0b429', detail:'Dollar stable' },
            { nom:'EUR → MGA', val:'-0.8%', color:'#22c55e', detail:'Euro en baisse' },
          ].map((t,i)=>(
            <div key={i} className="pay-row">
              <div>
                <div style={{fontSize:13,color:'#f8fafc'}}>{t.nom}</div>
                <div style={{fontSize:11,color:'#64748b'}}>{t.detail}</div>
              </div>
              <span style={{color:t.color,fontWeight:600}}>{t.val}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title"><Lightbulb size={18}/> Suggestions</div>
          <div className="alert alert-y"><Lightbulb size={14}/> Commander 50 filtres Toyota chez Dubai Parts — stock bas + demande forte</div>
          <div className="alert alert-b"><Brain size={14}/> Négocier un contrat annuel Guangzhou Auto — volume suffisant pour -10% tarifaire</div>
          <div className="alert alert-r"><AlertTriangle size={14}/> Relancer Méca Service — créance 2.1M Ar échue depuis 45 jours</div>
        </div>
      </div>
    </div>
  </>
}
