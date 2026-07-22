import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, Scale, Truck, Package, FileText, Banknote, Send, Brain, Settings, Menu, X, LogOut, Car, Bell, ClipboardList, ScrollText, Users } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { hasBackend, setCurrentUser, API, currentUser } from './lib/api'
import { getPermissions } from './lib/permissions'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Commandes from './pages/Commandes'
import Comparateur from './pages/Comparateur'
import Fournisseurs from './pages/Fournisseurs'
import CmdFournisseurs from './pages/CmdFournisseurs'
import Receptions from './pages/Receptions'
import Facturation from './pages/Facturation'
import Paiements from './pages/Paiements'
import Expeditions from './pages/Expeditions'
import Intelligence from './pages/Intelligence'
import Journal from './pages/Journal'
import Parametres from './pages/Parametres'
import './App.css'

const logoUrl = import.meta.env.BASE_URL + 'logo.png'

function Blocked() {
  return <div className="card" style={{textAlign:'center',marginTop:60,padding:40}}>
    <div style={{fontSize:48,marginBottom:16}}>&#128274;</div>
    <div style={{fontSize:18,fontWeight:600,color:'#f8fafc',marginBottom:8}}>Accès restreint</div>
    <div style={{color:'#94a3b8'}}>Vous n'avez pas les permissions nécessaires pour accéder à cette page.<br/>Contactez votre administrateur si vous pensez qu'il s'agit d'une erreur.</div>
  </div>
}

const nav = [
  { section: 'Principal' },
  { path: '/', icon: LayoutDashboard, label: 'Tableau de bord', perm: 'dashboard' },
  { path: '/commandes', icon: ShoppingCart, label: 'Commandes clients', perm: 'commandes' },
  { path: '/clients', icon: Users, label: 'Clients', perm: 'clients' },
  { path: '/comparateur', icon: Scale, label: 'Comparateur prix', perm: 'comparateur' },
  { path: '/fournisseurs', icon: Truck, label: 'Fournisseurs', perm: 'fournisseurs' },
  { path: '/cmd-fournisseurs', icon: ClipboardList, label: 'Cmd fournisseurs', perm: 'cmd_fournisseurs' },
  { section: 'Opérations' },
  { path: '/receptions', icon: Package, label: 'Réceptions', perm: 'receptions' },
  { path: '/facturation', icon: FileText, label: 'Facturation', perm: 'facturation' },
  { path: '/paiements', icon: Banknote, label: 'Paiements', perm: 'paiements' },
  { path: '/expeditions', icon: Send, label: 'Expéditions', perm: 'expeditions' },
  { section: 'Système' },
  { path: '/intelligence', icon: Brain, label: 'Intelligence', perm: 'intelligence' },
  { path: '/journal', icon: ScrollText, label: 'Journal', perm: 'journal' },
  { path: '/parametres', icon: Settings, label: 'Paramètres', perm: 'parametres' },
]

const mobileNav = [
  { path: '/', icon: LayoutDashboard, label: 'Accueil' },
  { path: '/commandes', icon: ShoppingCart, label: 'Commandes' },
  { path: '/comparateur', icon: Scale, label: 'Comparer' },
  { path: '/paiements', icon: Banknote, label: 'Paiements' },
  { path: '/intelligence', icon: Brain, label: 'IA' },
]

export default function App() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState(hasBackend ? null : { nom:'Admin', role:'admin' })
  const [notifOpen, setNotifOpen] = useState(false)
  const [alerts, setAlerts] = useState([])
  const navigate = useNavigate()
  const location = useLocation()
  const current = nav.find(n => n.path === location.pathname)

  const loadAlerts = useCallback(async () => {
    if (!API || !API.getStats) return
    try {
      const s = await API.getStats()
      const a = []
      if (s.cmd_encours > 0) a.push({ label: `${s.cmd_encours} commande(s) client en cours`, path: '/commandes', color: '#f5c518' })
      if (s.devis > 0) a.push({ label: `${s.devis} devis en attente`, path: '/commandes', color: '#3b82f6' })
      if (s.cf_a_recevoir > 0) a.push({ label: `${s.cf_a_recevoir} réception(s) attendue(s)`, path: '/receptions', color: '#8b5cf6' })
      if (s.creances > 0) a.push({ label: `Créances clients non soldées`, path: '/paiements', color: '#ef4444', perm: 'voir_creances' })
      setAlerts(a)
    } catch {}
  }, [])

  useEffect(() => { loadAlerts(); const t = setInterval(loadAlerts, 15000); return () => clearInterval(t) }, [loadAlerts])
  useEffect(() => { setNotifOpen(false) }, [location.pathname])

  if (!user) return <Login onLogin={u => { setCurrentUser(u); setUser(u) }} />
  const perms = getPermissions(user)

  const filteredNav = nav.filter(item => {
    if (item.section) return true
    if (!item.perm) return true
    return perms[item.perm]
  }).filter((item, i, arr) => {
    if (!item.section) return true
    const next = arr[i + 1]
    return next && !next.section
  })

  function logout() { setCurrentUser({ id:null, nom:'Admin', role:'admin' }); setUser(null); navigate('/') }

  function goTo(path) {
    navigate(path)
    setOpen(false)
  }

  return (
    <div className="app-layout">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sb-logo">
          <div className="sb-icon" style={{background:'transparent',overflow:'hidden',padding:0}}><img src={logoUrl} alt="ABS Store" style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>
          <div>
            <h1>ABS Store</h1>
            <small>Pièces autos · v{__APP_VERSION__}</small>
          </div>
          <button className="sb-close" onClick={() => setOpen(false)}><X size={20} /></button>
        </div>
        <nav className="sb-nav">
          {filteredNav.map((item, i) =>
            item.section
              ? <div key={i} className="sb-section">{item.section}</div>
              : <div key={i} className={`sb-item ${location.pathname === item.path ? 'active' : ''}`} onClick={() => goTo(item.path)}>
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </div>
          )}
        </nav>
        <div className="sb-user">
          <div className="sb-avatar">{(user.nom||'?').charAt(0).toUpperCase()}</div>
          <div className="sb-info">
            <div className="sb-name">{user.nom||'—'}</div>
            <div className="sb-role">{user.role==='admin'?'Administrateur':user.role==='gestionnaire'?'Gestionnaire':'Opérateur'}</div>
          </div>
          <LogOut size={16} className="sb-logout" style={{cursor:'pointer'}} onClick={logout} title="Déconnexion" />
        </div>
      </aside>
      {open && <div className="overlay" onClick={() => setOpen(false)} />}

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-btn" onClick={() => setOpen(true)}><Menu size={22} /></button>
            <h2>{current?.label || 'Tableau de bord'}</h2>
          </div>
          <div className="topbar-right" style={{position:'relative'}}>
            <button className="notif-btn" onClick={()=>setNotifOpen(o=>!o)}>
              <Bell size={20} />
              {alerts.filter(a => !a.perm || perms[a.perm]).length > 0 && <span className="notif-dot">{alerts.filter(a => !a.perm || perms[a.perm]).length}</span>}
            </button>
            {notifOpen && <div className="notif-panel">
              <div className="notif-header">Notifications</div>
              {alerts.filter(a => !a.perm || perms[a.perm]).length === 0
                ? <div className="notif-empty">Rien a signaler.</div>
                : alerts.filter(a => !a.perm || perms[a.perm]).map((a, i) => (
                  <div key={i} className="notif-item" onClick={() => { setNotifOpen(false); goTo(a.path) }}>
                    <span className="notif-indicator" style={{background: a.color}} />
                    {a.label}
                  </div>
                ))}
            </div>}
          </div>
        </header>
        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard onNavigate={goTo} perms={perms} />} />
            <Route path="/commandes" element={perms.commandes ? <Commandes onNavigate={goTo} /> : <Blocked />} />
            <Route path="/clients" element={perms.clients ? <Clients /> : <Blocked />} />
            <Route path="/comparateur" element={perms.comparateur ? <Comparateur /> : <Blocked />} />
            <Route path="/fournisseurs" element={perms.fournisseurs ? <Fournisseurs /> : <Blocked />} />
            <Route path="/cmd-fournisseurs" element={perms.cmd_fournisseurs ? <CmdFournisseurs /> : <Blocked />} />
            <Route path="/receptions" element={perms.receptions ? <Receptions perms={perms} /> : <Blocked />} />
            <Route path="/facturation" element={perms.facturation ? <Facturation perms={perms} /> : <Blocked />} />
            <Route path="/paiements" element={perms.paiements ? <Paiements perms={perms} /> : <Blocked />} />
            <Route path="/expeditions" element={perms.expeditions ? <Expeditions /> : <Blocked />} />
            <Route path="/intelligence" element={perms.intelligence ? <Intelligence /> : <Blocked />} />
            <Route path="/journal" element={perms.journal ? <Journal /> : <Blocked />} />
            <Route path="/parametres" element={<Parametres perms={perms} />} />
          </Routes>
        </div>
      </main>

      <nav className="bottom-nav">
        {mobileNav.map(item => (
          <div key={item.path} className={`bn-item ${location.pathname === item.path ? 'active' : ''}`} onClick={() => goTo(item.path)}>
            <item.icon size={20} />
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
    </div>
  )
}
