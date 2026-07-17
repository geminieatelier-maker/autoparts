import { Settings, Building2, DollarSign, Users, Shield, Palette, Download, Upload, Save, Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { API, currentUser } from '../lib/api'

export default function Parametres() {
  const [tab, setTab] = useState('Entreprise')
  const tabs = ['Entreprise','Intelligence','Devises','Utilisateurs','Sécurité','Sauvegarde']

  const [cfg, setCfg] = useState(null)
  useEffect(() => { if (API) API.getConfig().then(c => setCfg(c || {})) }, [])
  const set = (k,v) => setCfg(c => ({ ...c, [k]: v }))
  async function saveCfg() { await API.saveConfig(cfg); alert('Informations enregistrées.') }

  // Sécurité — changement de mot de passe
  const [pw, setPw] = useState({ old:'', neo:'', conf:'' })
  async function changePwd() {
    if (!pw.neo || pw.neo !== pw.conf) return alert('Les nouveaux mots de passe ne correspondent pas.')
    const ok = await API.changePassword(currentUser.id, pw.old, pw.neo)
    alert(ok ? 'Mot de passe changé.' : 'Ancien mot de passe incorrect.')
    if (ok) setPw({ old:'', neo:'', conf:'' })
  }

  // Utilisateurs — gestion des comptes (multi-utilisateurs)
  const roles = ['admin','gestionnaire','operateur']
  const [users, setUsers] = useState([])
  const [uForm, setUForm] = useState(null)
  const loadUsers = () => { if (API) API.getUtilisateurs().then(setUsers) }
  useEffect(() => { loadUsers() }, [])
  async function saveUser() {
    if (!uForm.login || !uForm.nom) return alert('Nom et identifiant sont obligatoires.')
    if (!uForm.id && !uForm.mdp) return alert('Définissez un mot de passe pour le nouveau compte.')
    await API.saveUtilisateur(uForm)
    setUForm(null); loadUsers()
  }

  // Sauvegarde / Restauration
  const [backups, setBackups] = useState([])
  const [bkBusy, setBkBusy] = useState('')
  const loadBackups = () => { if (API && API.listBackups) Promise.resolve(API.listBackups()).then(r => setBackups(r || [])) }
  useEffect(() => { loadBackups() }, [])
  async function backupNow() {
    setBkBusy('Sauvegarde en cours…')
    try { const r = await API.backupNow(currentUser); setBkBusy('✅ Sauvegarde créée : ' + r.name); loadBackups() }
    catch (e) { setBkBusy('❌ ' + (e.message || e)) }
  }
  async function restore(b) {
    if (!confirm(`Restaurer la sauvegarde « ${b.name} » ?\n\nToutes les données actuelles seront remplacées par celles de cette sauvegarde. Cette action est irréversible.`)) return
    setBkBusy('Restauration en cours…')
    try {
      await API.restoreBackup(b.path, currentUser)
      alert('Restauration terminée. L\'application va se recharger.')
      window.location.reload()
    } catch (e) { setBkBusy('❌ Échec restauration : ' + (e.message || e)) }
  }
  const fmtSize = (n) => n>1048576 ? (n/1048576).toFixed(1)+' Mo' : Math.max(1,Math.round(n/1024))+' Ko'
  const fmtWhen = (iso) => { try { return new Date(iso).toLocaleString('fr-FR') } catch { return iso } }

  return <>
    <div className="tabs">
      {tabs.map(t=><div key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t}</div>)}
    </div>

    {tab === 'Entreprise' && <div className="card">
      <div className="card-title"><Building2 size={18}/> Informations entreprise</div>
      {!cfg ? <div style={{color:'#64748b'}}>Chargement…</div> : <>
      <div className="grid2">
        <div className="fg"><label>Nom de l'entreprise</label><input value={cfg.nom||''} onChange={e=>set('nom',e.target.value)}/></div>
        <div className="fg"><label>NIF</label><input value={cfg.nif||''} onChange={e=>set('nif',e.target.value)}/></div>
        <div className="fg"><label>STAT</label><input value={cfg.stat||''} onChange={e=>set('stat',e.target.value)}/></div>
        <div className="fg"><label>RCS</label><input value={cfg.rcs||''} onChange={e=>set('rcs',e.target.value)}/></div>
        <div className="fg"><label>Adresse</label><input value={cfg.adresse||''} onChange={e=>set('adresse',e.target.value)}/></div>
        <div className="fg"><label>Téléphone</label><input value={cfg.tel||''} onChange={e=>set('tel',e.target.value)}/></div>
        <div className="fg"><label>Email</label><input value={cfg.email||''} onChange={e=>set('email',e.target.value)}/></div>
        <div className="fg"><label>Devise principale</label>
          <select value={cfg.devise||'MGA'} onChange={e=>set('devise',e.target.value)}>{['MGA','USD','EUR'].map(d=><option key={d}>{d}</option>)}</select>
        </div>
      </div>
      <div style={{marginTop:14,display:'flex',gap:8}}>
        <button className="btn btn-p" onClick={saveCfg}><Save size={16}/> Enregistrer</button>
      </div>
      </>}
    </div>}

    {tab === 'Intelligence' && <div className="card">
      <div className="card-title"><Settings size={18}/> Assistant intelligent</div>
      <p style={{fontSize:13,color:'#94a3b8',lineHeight:1.6,marginBottom:14}}>
        L'assistant est <b>intégré et prêt à l'emploi</b>, aucune configuration n'est nécessaire.
      </p>
      <div className="ai-box">
        <b>4 analyses instantanées — 100 % hors ligne</b> (aucune connexion requise) : comparaison des prix fournisseurs,
        conseil d'achat, calcul de rentabilité et détection des anomalies de prix.<br/><br/>
        <b>Questions libres</b> : la réponse en langage naturel utilise un moteur d'IA en ligne
        (nécessite internet <u>pour cette seule fonction</u>). Tout le reste du logiciel fonctionne hors ligne.<br/><br/>
        Rendez-vous dans le menu <b>Intelligence</b> pour l'utiliser.
      </div>
    </div>}

    {tab === 'Devises' && <div className="card">
      <div className="card-title"><DollarSign size={18}/> Taux de change</div>
      <p style={{fontSize:12,color:'#64748b',marginBottom:14}}>Taux du jour pour conversion automatique (à venir)</p>
      {[
        { devise:'USD', taux:'4 620 Ar' },
        { devise:'EUR', taux:'5 180 Ar' },
        { devise:'CNY', taux:'640 Ar' },
        { devise:'JPY', taux:'32 Ar' },
      ].map((d,i)=>(
        <div key={i} className="pay-row">
          <div style={{fontSize:13,color:'#f8fafc',fontWeight:600}}>1 {d.devise}</div>
          <div className="fg" style={{marginBottom:0,width:140}}><input defaultValue={d.taux} style={{textAlign:'right'}}/></div>
        </div>
      ))}
      <button className="btn btn-p" style={{marginTop:14}}>Mettre à jour</button>
    </div>}

    {tab === 'Utilisateurs' && <div>
      <div className="card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div className="card-title" style={{marginBottom:0}}><Users size={18}/> Comptes utilisateurs</div>
          {!uForm && <button className="btn btn-p btn-sm" onClick={()=>setUForm({ login:'', nom:'', role:'operateur', actif:true, mdp:'' })}><Plus size={16}/> Nouveau compte</button>}
        </div>

        {uForm && <div style={{background:'#0f172a',border:'1px solid #334155',borderRadius:8,padding:14,marginBottom:14}}>
          <div style={{fontWeight:600,color:'#f8fafc',marginBottom:10}}>{uForm.id ? 'Modifier le compte' : 'Nouveau compte'}</div>
          <div className="grid2">
            <div className="fg"><label>Nom complet</label><input value={uForm.nom} onChange={e=>setUForm(u=>({...u,nom:e.target.value}))}/></div>
            <div className="fg"><label>Identifiant (login)</label><input value={uForm.login} onChange={e=>setUForm(u=>({...u,login:e.target.value}))}/></div>
            <div className="fg"><label>Rôle</label>
              <select value={uForm.role} onChange={e=>setUForm(u=>({...u,role:e.target.value}))}>{roles.map(r=><option key={r} value={r}>{r}</option>)}</select>
            </div>
            <div className="fg"><label>Statut</label>
              <select value={uForm.actif?'1':'0'} onChange={e=>setUForm(u=>({...u,actif:e.target.value==='1'}))}><option value="1">Actif</option><option value="0">Désactivé</option></select>
            </div>
            <div className="fg"><label>{uForm.id ? 'Nouveau mot de passe (laisser vide = inchangé)' : 'Mot de passe'}</label>
              <input type="password" value={uForm.mdp} onChange={e=>setUForm(u=>({...u,mdp:e.target.value}))} placeholder={uForm.id?'••••••':''}/></div>
          </div>
          <div style={{display:'flex',gap:8,marginTop:10}}>
            <button className="btn btn-p" onClick={saveUser}><Save size={16}/> Enregistrer</button>
            <button className="btn btn-o" onClick={()=>setUForm(null)}>Annuler</button>
          </div>
        </div>}

        {users.length===0 ? <div style={{color:'#64748b',fontSize:14}}>Aucun compte.</div> :
        users.map(u=>(
          <div key={u.id} className="pay-row">
            <div>
              <div style={{fontSize:14,color:'#f8fafc',fontWeight:600}}>{u.nom} <span style={{fontSize:12,color:'#94a3b8',fontWeight:400}}>· @{u.login}</span></div>
              <div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>
                <span className="badge b-b">{u.role}</span>
                {u.actif===false ? <span className="badge b-r" style={{marginLeft:6}}>désactivé</span> : <span className="badge b-g" style={{marginLeft:6}}>actif</span>}
              </div>
            </div>
            <button className="btn btn-o btn-sm" onClick={()=>setUForm({ id:u.id, login:u.login, nom:u.nom, role:u.role, actif:u.actif!==false, mdp:'' })}>Modifier</button>
          </div>
        ))}
      </div>
    </div>}

    {tab === 'Sécurité' && <div className="card">
      <div className="card-title"><Shield size={18}/> Changer mon mot de passe</div>
      <div className="fg"><label>Mot de passe actuel</label><input type="password" value={pw.old} onChange={e=>setPw(p=>({...p,old:e.target.value}))}/></div>
      <div className="fg"><label>Nouveau mot de passe</label><input type="password" value={pw.neo} onChange={e=>setPw(p=>({...p,neo:e.target.value}))}/></div>
      <div className="fg"><label>Confirmer</label><input type="password" value={pw.conf} onChange={e=>setPw(p=>({...p,conf:e.target.value}))}/></div>
      <button className="btn btn-p" onClick={changePwd}>Changer le mot de passe</button>
    </div>}

    {tab === 'Sauvegarde' && <div>
      <div className="card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div className="card-title" style={{marginBottom:0}}><Save size={18}/> Sauvegarde &amp; restauration</div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-o btn-sm" onClick={()=>{ API.openBackupsFolder && API.openBackupsFolder() }}><Download size={16}/> Ouvrir le dossier</button>
            <button className="btn btn-p btn-sm" onClick={backupNow}><Save size={16}/> Sauvegarder maintenant</button>
          </div>
        </div>
        <div className="ai-box">Une sauvegarde <b>automatique quotidienne</b> est déjà effectuée. Vous pouvez aussi créer une sauvegarde <b>manuelle</b> à tout moment (avant une opération importante), puis copier le dossier sur une clé USB. La <b>restauration en un clic</b> remplace toutes les données actuelles par celles de la sauvegarde choisie.</div>
        {bkBusy && <div style={{marginTop:10,fontSize:13,color:'#e2e8f0'}}>{bkBusy}</div>}
      </div>

      <div className="card">
        <div className="card-title">Sauvegardes disponibles ({backups.length})</div>
        {backups.length===0 ? <div style={{color:'#64748b',fontSize:14}}>Aucune sauvegarde manuelle pour l'instant. Cliquez sur « Sauvegarder maintenant ».</div> :
        backups.map(b=>(
          <div key={b.path} className="pay-row">
            <div>
              <div style={{fontSize:14,color:'#f8fafc',fontWeight:600}}>{b.name}</div>
              <div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>{fmtWhen(b.date)} · {fmtSize(b.size)}</div>
            </div>
            <button className="btn btn-o btn-sm" onClick={()=>restore(b)}><Upload size={14}/> Restaurer</button>
          </div>
        ))}
      </div>
    </div>}
  </>
}
