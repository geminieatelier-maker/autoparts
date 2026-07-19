import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, Scale, Truck, Package, FileText, Banknote, Send, Brain, Settings, Menu, X, LogOut, Car, Bell, ClipboardList, ScrollText, Users } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { hasBackend, setCurrentUser, API } from './lib/api'
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

const nav = [
  { section: 'Principal' },
  { path: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
  { path: '/commandes', icon: ShoppingCart, label: 'Commandes clients' },
  { path: '/clients', icon: Users, label: 'Clients' },
  { path: '/comparateur', icon: Scale, label: 'Comparateur prix' },
  { path: '/fournisseurs', icon: Truck, label: 'Fournisseurs' },
  { path: '/cmd-fournisseurs', icon: ClipboardList, label: 'Cmd fournisseurs' },
  { section: 'Opérations' },
  { path: '/receptions', icon: Package, label: 'Réceptions' },
  { path: '/facturation', icon: FileText, label: 'Facturation' },
  { path: '/paiements', icon: Banknote, label: 'Paiements' },
  { path: '/expeditions', icon: Send, label: 'Expéditions' },
  { section: 'Système' },
  { path: '/intelligence', icon: Brain, label: 'Intelligence' },
  { path: '/journal', icon: ScrollText, label: 'Journal' },
  { path: '/parametres', icon: Settings, label: 'Paramètres' },
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
      if (s.creances > 0) a.push({ label: `Créances clients non soldées`, path: '/paiements', color: '#ef4444' })
      setAlerts(a)
    } catch {}
  }, [])

  useEffect(() => { loadAlerts(); const t = setInterval(loadAlerts, 15000); return () => clearInterval(t) }, [loadAlerts])
  useEffect(() => { setNotifOpen(false) }, [location.pathname])

  if (!user) return <Login onLogin={u => { setCurrentUser(u); setUser(u) }} />
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
            <small>Pièces autos</small>
          </div>
          <button className="sb-close" onClick={() => setOpen(false)}><X size={20} /></button>
        </div>
        <nav className="sb-nav">
          {nav.map((item, i) =>
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
            <div className="sb-role">{user.role==='admin'?'Administrateur':(user.role||'Opérateur')}</div>
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
              {alerts.length > 0 && <span className="notif-dot">{alerts.length}</span>}
            </button>
            {notifOpen && <div className="notif-panel">
              <div className="notif-header">Notifications</div>
              {alerts.length === 0
                ? <div className="notif-empty">Rien a signaler.</div>
                : alerts.map((a, i) => (
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
            <Route path="/" element={<Dashboard onNavigate={goTo} />} />
            <Route path="/commandes" element={<Commandes onNavigate={goTo} />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/comparateur" element={<Comparateur />} />
            <Route path="/fournisseurs" element={<Fournisseurs />} />
            <Route path="/cmd-fournisseurs" element={<CmdFournisseurs />} />
            <Route path="/receptions" element={<Receptions />} />
            <Route path="/facturation" element={<Facturation />} />
            <Route path="/paiements" element={<Paiements />} />
            <Route path="/expeditions" element={<Expeditions />} />
            <Route path="/intelligence" element={<Intelligence />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/parametres" element={<Parametres />} />
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
