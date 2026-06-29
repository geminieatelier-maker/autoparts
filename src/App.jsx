import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, Scale, Truck, Package, FileText, Banknote, Send, Brain, Settings, Menu, X, LogOut, Car, Bell, ClipboardList, ScrollText } from 'lucide-react'
import { useState } from 'react'
import Dashboard from './pages/Dashboard'
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

const nav = [
  { section: 'Principal' },
  { path: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
  { path: '/commandes', icon: ShoppingCart, label: 'Commandes clients' },
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
  const navigate = useNavigate()
  const location = useLocation()
  const current = nav.find(n => n.path === location.pathname)

  function goTo(path) {
    navigate(path)
    setOpen(false)
  }

  return (
    <div className="app-layout">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sb-logo">
          <div className="sb-icon"><Car size={20} /></div>
          <div>
            <h1>AutoParts</h1>
            <small>ERP par Datalio</small>
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
          <div className="sb-avatar">A</div>
          <div className="sb-info">
            <div className="sb-name">Admin</div>
            <div className="sb-role">Administrateur</div>
          </div>
          <LogOut size={16} className="sb-logout" />
        </div>
      </aside>
      {open && <div className="overlay" onClick={() => setOpen(false)} />}

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-btn" onClick={() => setOpen(true)}><Menu size={22} /></button>
            <h2>{current?.label || 'Tableau de bord'}</h2>
          </div>
          <div className="topbar-right">
            <button className="notif-btn"><Bell size={20} /><span className="notif-dot" /></button>
          </div>
        </header>
        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard onNavigate={goTo} />} />
            <Route path="/commandes" element={<Commandes onNavigate={goTo} />} />
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
