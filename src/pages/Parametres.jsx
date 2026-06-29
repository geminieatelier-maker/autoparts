import { Settings, Building2, DollarSign, Users, Shield, Palette, Download, Upload, Save, Plus } from 'lucide-react'
import { useState } from 'react'

export default function Parametres() {
  const [tab, setTab] = useState('Entreprise')
  const tabs = ['Entreprise','Devises','Utilisateurs','Sécurité','Sauvegarde']

  return <>
    <div className="tabs">
      {tabs.map(t=><div key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t}</div>)}
    </div>

    {tab === 'Entreprise' && <div className="card">
      <div className="card-title"><Building2 size={18}/> Informations entreprise</div>
      <div className="grid2">
        <div className="fg"><label>Nom de l'entreprise</label><input defaultValue="AutoParts Madagascar"/></div>
        <div className="fg"><label>NIF</label><input defaultValue="1234567890"/></div>
        <div className="fg"><label>STAT</label><input defaultValue="56789-2026"/></div>
        <div className="fg"><label>Adresse</label><input defaultValue="Lot IVG 123 Analakely, Antananarivo"/></div>
        <div className="fg"><label>Téléphone</label><input defaultValue="+261 34 00 000 00"/></div>
        <div className="fg"><label>Email</label><input defaultValue="contact@autoparts.mg"/></div>
      </div>
      <div style={{marginTop:14,display:'flex',gap:8}}>
        <button className="btn btn-p">Enregistrer</button>
        <button className="btn btn-o">Annuler</button>
      </div>
    </div>}

    {tab === 'Devises' && <div className="card">
      <div className="card-title"><DollarSign size={18}/> Taux de change</div>
      <p style={{fontSize:12,color:'#64748b',marginBottom:14}}>Taux du jour pour conversion automatique</p>
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
          <div className="card-title" style={{marginBottom:0}}><Users size={18}/> Utilisateurs</div>
          <button className="btn btn-p btn-sm"><Plus size={14}/> Ajouter utilisateur</button>
        </div>
        <table className="tbl">
          <thead><tr><th>Nom</th><th>Rôle</th><th>Droits</th><th>Statut</th></tr></thead>
          <tbody>
            <tr><td>Admin</td><td>Administrateur</td><td style={{fontSize:12,color:'#94a3b8'}}>Tous les droits</td><td><span className="badge b-g">Actif</span></td></tr>
            <tr><td>Jean</td><td>Vendeur</td><td style={{fontSize:12,color:'#94a3b8'}}>Commandes, Clients</td><td><span className="badge b-g">Actif</span></td></tr>
            <tr><td>Marie</td><td>Comptable</td><td style={{fontSize:12,color:'#94a3b8'}}>Factures, Paiements</td><td><span className="badge b-g">Actif</span></td></tr>
            <tr><td>Hery</td><td>Magasinier</td><td style={{fontSize:12,color:'#94a3b8'}}>Réceptions, Expéditions</td><td><span className="badge b-y">Inactif</span></td></tr>
          </tbody>
        </table>
      </div>
      <div className="card">
        <div className="card-title">Rôles et permissions</div>
        <div className="ai-box">Chaque utilisateur se voit attribuer un rôle qui détermine les modules accessibles. L'administrateur peut modifier les droits à tout moment.</div>
      </div>
    </div>}

    {tab === 'Sécurité' && <div className="card">
      <div className="card-title"><Shield size={18}/> Sécurité</div>
      <div className="fg"><label>Mot de passe actuel</label><input type="password"/></div>
      <div className="fg"><label>Nouveau mot de passe</label><input type="password"/></div>
      <div className="fg"><label>Confirmer</label><input type="password"/></div>
      <button className="btn btn-p">Changer le mot de passe</button>
      <div style={{marginTop:20}}>
        <div className="card-title"><Palette size={18}/> Licence</div>
        <div className="fg"><label>Clé de licence</label><input placeholder="XXXXX-XXXXX-XXXXX-XXXXX"/></div>
        <button className="btn btn-s">Activer</button>
      </div>
    </div>}

    {tab === 'Sauvegarde' && <div>
      <div className="card">
        <div className="card-title"><Save size={18}/> Sauvegarde automatique</div>
        <div className="grid2">
          <div className="fg"><label>Fréquence</label>
            <select><option>Quotidienne</option><option>Hebdomadaire</option><option>Manuelle uniquement</option></select>
          </div>
          <div className="fg"><label>Heure de sauvegarde</label><input type="time" defaultValue="02:00"/></div>
          <div className="fg"><label>Dernière sauvegarde</label><input readOnly value="29/06/2026 à 02:00" style={{color:'#22c55e'}}/></div>
          <div className="fg"><label>Taille base de données</label><input readOnly value="145 Mo" style={{color:'#94a3b8'}}/></div>
        </div>
        <button className="btn btn-p" style={{marginTop:10}}><Save size={16}/> Sauvegarder maintenant</button>
      </div>
      <div className="card">
        <div className="card-title"><Download size={18}/> Import / Export</div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <button className="btn btn-o"><Download size={16}/> Export PDF (toutes factures)</button>
          <button className="btn btn-o"><Download size={16}/> Export Excel (données)</button>
          <button className="btn btn-o"><Upload size={16}/> Import Excel (clients/articles)</button>
        </div>
        <div className="ai-box" style={{marginTop:12}}>Vous pouvez importer vos données depuis un fichier Excel (.xlsx). Le système détectera automatiquement les colonnes et vous demandera de valider la correspondance.</div>
      </div>
    </div>}
  </>
}
