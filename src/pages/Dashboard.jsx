import { ShoppingCart, AlertTriangle, Brain, Truck, Clock, ClipboardList, TrendingUp } from 'lucide-react'

export default function Dashboard({ onNavigate }) {
  return <>
    <div className="stats">
      <div className="stat"><div className="label">Commandes clients</div><div className="value" style={{color:'#f0b429'}}>12</div><div className="sub" style={{color:'#22c55e'}}>+3 aujourd'hui</div></div>
      <div className="stat"><div className="label">Cmd fournisseurs</div><div className="value" style={{color:'#8b5cf6'}}>3</div><div className="sub" style={{color:'#94a3b8'}}>2 en transit</div></div>
      <div className="stat"><div className="label">Devis en attente</div><div className="value" style={{color:'#3b82f6'}}>5</div><div className="sub" style={{color:'#94a3b8'}}>2 expirent bientôt</div></div>
      <div className="stat"><div className="label">Réceptions prévues</div><div className="value" style={{color:'#22c55e'}}>8</div><div className="sub" style={{color:'#94a3b8'}}>3 en transit</div></div>
      <div className="stat"><div className="label">Créances clients</div><div className="value" style={{color:'#ef4444'}}>4.2M</div><div className="sub" style={{color:'#ef4444'}}>850k en retard</div></div>
      <div className="stat"><div className="label">Dettes fournisseurs</div><div className="value" style={{color:'#a855f7'}}>6.8M</div><div className="sub" style={{color:'#94a3b8'}}>2.1M à 30j</div></div>
      <div className="stat"><div className="label">CA ce mois</div><div className="value" style={{color:'#f8fafc'}}>12.5M</div><div className="sub" style={{color:'#22c55e'}}>Marge: 28%</div></div>
      <div className="stat"><div className="label">Bénéfice net</div><div className="value" style={{color:'#22c55e'}}>3.5M</div><div className="sub" style={{color:'#22c55e'}}>+12% vs mois dernier</div></div>
    </div>

    <div className="grid2">
      <div className="card">
        <div className="card-title"><ShoppingCart size={18}/> Dernières commandes</div>
        <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>N°</th><th>Client</th><th>Montant</th><th>Statut</th></tr></thead>
          <tbody>
            <tr onClick={()=>onNavigate('/commandes')} style={{cursor:'pointer'}}><td style={{color:'#f0b429'}}>CMD-047</td><td>Garage Rova</td><td>1.2M Ar</td><td><span className="badge b-y">En cours</span></td></tr>
            <tr onClick={()=>onNavigate('/commandes')} style={{cursor:'pointer'}}><td style={{color:'#f0b429'}}>CMD-046</td><td>Auto Mada</td><td>680k Ar</td><td><span className="badge b-b">Devis</span></td></tr>
            <tr onClick={()=>onNavigate('/commandes')} style={{cursor:'pointer'}}><td style={{color:'#f0b429'}}>CMD-045</td><td>Pièces Express</td><td>3.4M Ar</td><td><span className="badge b-g">Livré</span></td></tr>
            <tr onClick={()=>onNavigate('/commandes')} style={{cursor:'pointer'}}><td style={{color:'#f0b429'}}>CMD-044</td><td>Méca Service</td><td>2.1M Ar</td><td><span className="badge b-r">Impayé</span></td></tr>
          </tbody>
        </table>
        </div>
      </div>

      <div>
        <div className="card">
          <div className="card-title"><AlertTriangle size={18}/> Alertes</div>
          <div className="alert alert-r"><Clock size={14}/> Facture F-039 impayée depuis 45j — Méca Service</div>
          <div className="alert alert-y"><Truck size={14}/> Réception Guangzhou prévue demain — 14 pièces</div>
          <div className="alert alert-b"><ShoppingCart size={14}/> 3 devis fournisseurs en attente</div>
        </div>
        <div className="card">
          <div className="card-title"><Brain size={18}/> Intelligence</div>
          <div className="ai-box">Guangzhou Auto a augmenté ses prix de 12% ce mois. Envisagez Dubai Parts pour les filtres Toyota — marge supérieure de 8%.</div>
        </div>
      </div>
    </div>
  </>
}
