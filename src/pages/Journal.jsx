import { useState, useEffect, useCallback } from 'react'
import { ScrollText, Search, Clock, User } from 'lucide-react'
import { API, currentUser, fmtAr, fmtDate } from '../lib/api'

export default function Journal() {
  const [q, setQ] = useState('')
  const [list, setList] = useState([])

  const load = useCallback(async () => {
    if (!API) return
    setList(await API.getJournal())
  }, [])
  useEffect(() => { load() }, [load])

  const filtered = list.filter(j => {
    const s = `${j.utilisateur_nom||''} ${j.action||''} ${fmtDate(j.created_at)}`.toLowerCase()
    return !q || s.includes(q.toLowerCase())
  })

  return <>
    <div className="stats">
      <div className="stat"><div className="label">Événements</div><div className="value" style={{color:'#f8fafc'}}>{list.length}</div></div>
      <div className="stat"><div className="label">Affichés</div><div className="value" style={{color:'#f5c518'}}>{filtered.length}</div></div>
      <div className="stat"><div className="label">Utilisateur</div><div className="value" style={{color:'#22c55e',fontSize:20}}>{currentUser.nom}</div></div>
    </div>

    <div className="search-bar">
      <Search size={16} color="#475569"/>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher par utilisateur, action, date..."/>
    </div>

    <div className="card">
      <div className="card-title"><ScrollText size={18}/> Journal système</div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Date / heure</th><th>Utilisateur</th><th>Action</th><th>Entité</th></tr></thead>
          <tbody>
            {filtered.length===0 ? <tr><td colSpan={4} style={{color:'#64748b',textAlign:'center',padding:20}}>Aucun événement</td></tr> :
            filtered.map(j=>(
              <tr key={j.id}>
                <td style={{color:'#94a3b8'}}><Clock size={12} style={{verticalAlign:'-2px',marginRight:4}}/>{fmtDate(j.created_at)} {new Date(j.created_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</td>
                <td><User size={12} style={{verticalAlign:'-2px',marginRight:4}}/>{j.utilisateur_nom||'—'}</td>
                <td style={{color:'#f8fafc'}}>{j.action||'—'} <span style={{display:'none'}}>{fmtAr(0)}</span></td>
                <td style={{color:'#94a3b8',fontSize:12}}>{j.entite_type ? <span className="badge b-b">{j.entite_type}{j.entite_id ? ' #'+j.entite_id : ''}</span> : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </>
}
