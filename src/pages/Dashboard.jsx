import { useState, useEffect } from 'react'
import { ShoppingCart, AlertTriangle, Brain, Truck, Package } from 'lucide-react'
import { API, fmtAr, fmtDate } from '../lib/api'

const statutBadge = s => s==='Livré'?'b-g':s==='Impayé'?'b-r':s==='Devis'?'b-b':'b-y'

export default function Dashboard({ onNavigate, perms = {} }) {
  const [s, setS] = useState(null)
  const [cmds, setCmds] = useState([])

  useEffect(() => {
    if (!API) return
    const load = () => { API.getStats().then(setS); API.getCommandes({}).then(cs=>setCmds(cs.slice(0,6))) }
    load()
    const t = setInterval(load, 8000)   // rafraîchissement live
    return () => clearInterval(t)
  }, [])

  const v = (x) => s ? x : '—'

  return <>
    <div className="stats">
      <div className="stat"><div className="label">Commandes en cours</div><div className="value" style={{color:'#f5c518'}}>{v(s?.cmd_encours)}</div></div>
      <div className="stat"><div className="label">Devis en attente</div><div className="value" style={{color:'#3b82f6'}}>{v(s?.devis)}</div></div>
      <div className="stat"><div className="label">Cmd fournisseurs actives</div><div className="value" style={{color:'#8b5cf6'}}>{v(s?.cf_actives)}</div></div>
      <div className="stat"><div className="label">À réceptionner</div><div className="value" style={{color:'#22c55e'}}>{v(s?.cf_a_recevoir)}</div></div>
      <div className="stat"><div className="label">Clients</div><div className="value" style={{color:'#f8fafc'}}>{v(s?.nb_clients)}</div></div>
      <div className="stat"><div className="label">Fournisseurs</div><div className="value" style={{color:'#f8fafc'}}>{v(s?.nb_fournisseurs)}</div></div>
      <div className="stat"><div className="label">Commandes clients (mois)</div><div className="value" style={{color:'#22c55e'}}>{s?fmtAr(s.ca_mois):'—'}</div></div>
      <div className="stat"><div className="label">Achats fournisseurs (mois)</div><div className="value" style={{color:'#a855f7'}}>{s?fmtAr(s.achats_mois):'—'}</div></div>
      {perms.voir_creances !== false && <div className="stat"><div className="label">Créances clients</div><div className="value" style={{color:'#ef4444'}}>{s?fmtAr(s.creances):'—'}</div></div>}
      {perms.voir_creances !== false && <div className="stat"><div className="label">Dettes fournisseurs</div><div className="value" style={{color:'#f5c518'}}>{s?fmtAr(s.dettes):'—'}</div></div>}
      {perms.voir_benefices !== false && <div className="stat"><div className="label">Bénéfice (mois)</div><div className="value" style={{color:'#22c55e'}}>{s?fmtAr(s.benefice_mois):'—'}</div></div>}
    </div>

    <div className="grid2">
      <div className="card">
        <div className="card-title"><ShoppingCart size={18}/> Dernières commandes clients</div>
        <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>N°</th><th>Client</th><th>Montant</th><th>Statut</th></tr></thead>
          <tbody>
            {cmds.length===0 ? <tr><td colSpan={4} style={{color:'#64748b',textAlign:'center',padding:16}}>Aucune commande</td></tr> :
            cmds.map(c=>(
              <tr key={c.id} onClick={()=>onNavigate('/commandes')} style={{cursor:'pointer'}}>
                <td style={{color:'#f5c518'}}>{c.numero}</td><td>{c.client_nom||'—'}</td><td>{fmtAr(c.total)}</td>
                <td><span className={`badge ${statutBadge(c.statut)}`}>{c.statut}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <div>
        <div className="card">
          <div className="card-title"><AlertTriangle size={18}/> À suivre</div>
          {s && s.cf_a_recevoir>0 && <div className="alert alert-y"><Truck size={14}/> {s.cf_a_recevoir} commande(s) fournisseur à réceptionner</div>}
          {s && s.devis>0 && <div className="alert alert-b"><ShoppingCart size={14}/> {s.devis} devis en attente</div>}
          {s && s.cmd_encours>0 && <div className="alert alert-y"><Package size={14}/> {s.cmd_encours} commande(s) client en cours</div>}
          {s && s.cf_a_recevoir===0 && s.devis===0 && s.cmd_encours===0 && <div style={{color:'#64748b',fontSize:14}}>Rien à signaler.</div>}
        </div>
        <div className="card">
          <div className="card-title"><Brain size={18}/> Intelligence</div>
          <div className="ai-box">Comparaison des prix, conseil d'achat, rentabilité et détection d'anomalies : consultez ces analyses dans le module Intelligence.</div>
          <button className="btn btn-o btn-sm" style={{marginTop:10}} onClick={()=>onNavigate('/intelligence')}><Brain size={14}/> Ouvrir Intelligence</button>
        </div>
      </div>
    </div>
  </>
}
