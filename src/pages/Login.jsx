import { useState } from 'react'
import { Car, LogIn } from 'lucide-react'
import { API } from '../lib/api'

export default function Login({ onLogin }) {
  const [login, setLogin] = useState('')
  const [mdp, setMdp] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e && e.preventDefault()
    setErr(''); setBusy(true)
    try {
      const u = await API.login(login.trim(), mdp)
      if (!u) { setErr('Identifiant ou mot de passe incorrect'); setBusy(false); return }
      onLogin(u)
    } catch (ex) { setErr('Erreur : ' + (ex && ex.message || ex)); setBusy(false) }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0f172a'}}>
      <form onSubmit={submit} style={{background:'#1e293b',border:'1px solid #334155',borderRadius:16,padding:36,width:360,textAlign:'center'}}>
        <img src={import.meta.env.BASE_URL + 'logo.png'} alt="ABS Store" style={{width:96,height:96,borderRadius:18,objectFit:'cover',margin:'0 auto 14px',display:'block',boxShadow:'0 6px 20px rgba(245,197,24,.25)'}}/>
        <h1 style={{color:'#f8fafc',fontSize:24,margin:0}}>ABS STORE</h1>
        <div style={{color:'#f5c518',fontSize:11,letterSpacing:2,textTransform:'uppercase',marginBottom:22}}>Pièces autos · ERP</div>
        <div style={{textAlign:'left',marginBottom:12}}>
          <label style={{fontSize:12,color:'#64748b',display:'block',marginBottom:4}}>Identifiant</label>
          <input value={login} onChange={e=>setLogin(e.target.value)} autoFocus placeholder="Votre identifiant" style={inp}/>
        </div>
        <div style={{textAlign:'left',marginBottom:16}}>
          <label style={{fontSize:12,color:'#64748b',display:'block',marginBottom:4}}>Mot de passe</label>
          <input type="password" value={mdp} onChange={e=>setMdp(e.target.value)} placeholder="Votre mot de passe" style={inp}/>
        </div>
        <button className="btn btn-p" type="submit" disabled={busy} style={{width:'100%',justifyContent:'center',padding:11}}>
          <LogIn size={16}/> {busy ? 'Connexion...' : 'Se connecter'}
        </button>
        {err && <div style={{color:'#ef4444',fontSize:13,marginTop:12}}>{err}</div>}
        <div style={{color:'#475569',fontSize:11,marginTop:16}}>v{__APP_VERSION__} · Powered by Datalio</div>
      </form>
    </div>
  )
}
const inp = { width:'100%', background:'#0f172a', border:'1px solid #334155', borderRadius:8, padding:'10px 12px', color:'#f8fafc', outline:'none', fontSize:15 }
