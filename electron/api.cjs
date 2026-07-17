// API AUTOPARTS ERP. Exposée au renderer via preload (contextBridge).
const bcrypt = require('bcryptjs');
const db = require('./db.cjs');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const config = require('./config.cjs');

// Formatage monétaire local (Ariary) pour les analyses hors ligne.
const _ar = (n) => Math.round(Number(n)||0).toLocaleString('fr-FR').replace(/ | /g,' ') + ' Ar';

// Dossier des sauvegardes manuelles (.json) — même racine que la sauvegarde auto.
function backupsDir(){
  const dir = path.join(config.userDataDir(), 'backups');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}
// Tables métier dans l'ordre des dépendances (parents d'abord) pour le snapshot/restauration.
const BACKUP_TABLES = [
  'utilisateurs','config','clients','fournisseurs',
  'commandes_client','commande_client_lignes',
  'cotations','cotation_offres',
  'commandes_fournisseur','commande_fournisseur_lignes','cmd_fourn_clients',
  'receptions','reception_lignes',
  'factures','facture_lignes',
  'paiements','expeditions','expedition_commandes','journal'
];
// Tables à clé série "id" dont la séquence doit être recalée après restauration.
// (Exclut config = id fixe, et les tables à clé composite sans colonne id.)
const BACKUP_NO_SERIAL = ['config','cmd_fourn_clients','expedition_commandes'];
const BACKUP_SERIAL = BACKUP_TABLES.filter(t => !BACKUP_NO_SERIAL.includes(t));

async function logEvent(userId, userNom, action){
  try { await db.query('INSERT INTO journal (utilisateur_id, utilisateur_nom, action) VALUES ($1,$2,$3)', [userId||null, userNom||null, action]); } catch {}
}

const API = {
  // ---------- Authentification ----------
  login: async (login, mdp) => {
    const u = (await db.query('SELECT * FROM utilisateurs WHERE login=$1 AND actif=true', [login]))[0];
    if (!u || !bcrypt.compareSync(mdp, u.mdp_hash)) return null;
    await logEvent(u.id, u.nom, 'Connexion');
    return { id: u.id, nom: u.nom, login: u.login, role: u.role };
  },
  changePassword: async (userId, oldPwd, newPwd) => {
    const u = (await db.query('SELECT mdp_hash FROM utilisateurs WHERE id=$1', [userId]))[0];
    if (!u || !bcrypt.compareSync(oldPwd, u.mdp_hash)) return false;
    await db.query('UPDATE utilisateurs SET mdp_hash=$1 WHERE id=$2', [bcrypt.hashSync(newPwd,10), userId]);
    return true;
  },
  getUtilisateurs: () => db.query('SELECT id, login, nom, role, actif FROM utilisateurs ORDER BY nom'),
  saveUtilisateur: async (u) => {
    if (u.id) {
      if (u.mdp) await db.query('UPDATE utilisateurs SET login=$1,nom=$2,role=$3,actif=$4,mdp_hash=$5 WHERE id=$6',
        [u.login,u.nom,u.role,u.actif!==false,bcrypt.hashSync(u.mdp,10),u.id]);
      else await db.query('UPDATE utilisateurs SET login=$1,nom=$2,role=$3,actif=$4 WHERE id=$5',
        [u.login,u.nom,u.role,u.actif!==false,u.id]);
      return u.id;
    }
    const r = await db.query('INSERT INTO utilisateurs (login,nom,role,mdp_hash) VALUES ($1,$2,$3,$4) RETURNING id',
      [u.login,u.nom,u.role||'operateur',bcrypt.hashSync(u.mdp||'1234',10)]);
    return r[0].id;
  },

  // ---------- Config ----------
  getConfig: async () => (await db.query('SELECT * FROM config WHERE id=1'))[0] || {},
  saveConfig: (c) => db.query('UPDATE config SET nom=$1,adresse=$2,tel=$3,email=$4,nif=$5,stat=$6,rcs=$7,devise=$8 WHERE id=1',
    [c.nom,c.adresse,c.tel,c.email,c.nif,c.stat,c.rcs,c.devise||'MGA']),

  // ---------- Clients ----------
  getClients: (f={}) => {
    if (f.recherche) return db.query('SELECT * FROM clients WHERE actif=true AND lower(nom) LIKE $1 ORDER BY nom',
      ['%'+String(f.recherche).toLowerCase()+'%']);
    return db.query('SELECT * FROM clients WHERE actif=true ORDER BY nom');
  },
  saveClient: async (c) => {
    if (c.id) { await db.query('UPDATE clients SET nom=$1,contact=$2,tel=$3,email=$4,adresse=$5,remise=$6,notes=$7 WHERE id=$8',
      [c.nom,c.contact,c.tel,c.email,c.adresse,c.remise||0,c.notes,c.id]); return c.id; }
    const r = await db.query('INSERT INTO clients (nom,contact,tel,email,adresse,remise,notes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
      [c.nom,c.contact,c.tel,c.email,c.adresse,c.remise||0,c.notes]);
    return r[0].id;
  },
  deleteClient: (id) => db.query('UPDATE clients SET actif=false WHERE id=$1', [id]),

  // ---------- Fournisseurs ----------
  getFournisseurs: (f={}) => {
    if (f.recherche) return db.query('SELECT * FROM fournisseurs WHERE actif=true AND lower(nom) LIKE $1 ORDER BY nom',
      ['%'+String(f.recherche).toLowerCase()+'%']);
    return db.query('SELECT * FROM fournisseurs WHERE actif=true ORDER BY nom');
  },
  getFournisseurDetail: async (id) => {
    const f = (await db.query('SELECT * FROM fournisseurs WHERE id=$1', [id]))[0];
    if (!f) return null;
    f.commandes = await db.query('SELECT numero, date_cmd, total, devise, statut FROM commandes_fournisseur WHERE fournisseur_id=$1 ORDER BY date_cmd DESC LIMIT 8', [id]);
    return f;
  },
  saveFournisseur: async (f) => {
    if (f.id) { await db.query('UPDATE fournisseurs SET nom=$1,pays=$2,devise=$3,rating=$4,delai=$5,contact=$6,tel=$7,email=$8,adresse=$9,conditions_paiement=$10,notes=$11 WHERE id=$12',
      [f.nom,f.pays,f.devise,f.rating||3,f.delai,f.contact,f.tel,f.email,f.adresse,f.conditions_paiement,f.notes,f.id]); return f.id; }
    const r = await db.query('INSERT INTO fournisseurs (nom,pays,devise,rating,delai,contact,tel,email,adresse,conditions_paiement,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id',
      [f.nom,f.pays,f.devise||'MGA',f.rating||3,f.delai,f.contact,f.tel,f.email,f.adresse,f.conditions_paiement,f.notes]);
    return r[0].id;
  },
  deleteFournisseur: (id) => db.query('UPDATE fournisseurs SET actif=false WHERE id=$1', [id]),

  // ---------- Module 1&2 : Commandes client / Devis ----------
  getCommandes: (f={}) => {
    const params=[]; let sql = `SELECT cc.*, c.nom AS client_nom,
        (SELECT count(*)::int FROM commande_client_lignes l WHERE l.commande_id=cc.id) AS nb_lignes
      FROM commandes_client cc LEFT JOIN clients c ON c.id=cc.client_id WHERE 1=1`;
    if (f.statut && f.statut!=='Toutes') { params.push(f.statut); sql+=` AND cc.statut=$${params.length}`; }
    if (f.recherche) { params.push('%'+String(f.recherche).toLowerCase()+'%'); sql+=` AND (lower(c.nom) LIKE $${params.length} OR lower(cc.numero) LIKE $${params.length})`; }
    sql += ' ORDER BY cc.date_cmd DESC, cc.id DESC LIMIT 300';
    return db.query(sql, params);
  },
  getCommandeDetail: async (id) => {
    const cc = (await db.query(`SELECT cc.*, c.nom AS client_nom FROM commandes_client cc LEFT JOIN clients c ON c.id=cc.client_id WHERE cc.id=$1`, [id]))[0];
    if (!cc) return null;
    cc.lignes = await db.query('SELECT * FROM commande_client_lignes WHERE commande_id=$1 ORDER BY id', [id]);
    return cc;
  },
  saveCommande: async ({ header, lignes }, user) => {
    await db.query('BEGIN');
    try {
      const total = (lignes||[]).reduce((s,l)=>s + Number(l.quantite||0)*Number(l.prix_unitaire||0), 0);
      let id = header.id;
      if (id) {
        await db.query('UPDATE commandes_client SET client_id=$1,date_cmd=$2,type=$3,priorite=$4,statut=$5,observations=$6,total=$7 WHERE id=$8',
          [header.client_id||null,header.date_cmd||null,header.type||'Commande',header.priorite||'Normale',header.statut||'En cours',header.observations||'',total,id]);
        await db.query('DELETE FROM commande_client_lignes WHERE commande_id=$1', [id]);
      } else {
        const r = await db.query('INSERT INTO commandes_client (client_id,date_cmd,type,priorite,statut,observations,total,utilisateur_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
          [header.client_id||null,header.date_cmd||null,header.type||'Commande',header.priorite||'Normale',header.statut||'En cours',header.observations||'',total,user?user.id:null]);
        id = r[0].id;
        await db.query("UPDATE commandes_client SET numero=$1 WHERE id=$2", ['CMD-'+String(id).padStart(3,'0'), id]);
      }
      for (const l of (lignes||[])) {
        await db.query('INSERT INTO commande_client_lignes (commande_id,designation,reference,marque,quantite,prix_unitaire,montant) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [id,l.designation||'',l.reference||'',l.marque||'',Number(l.quantite||0),Number(l.prix_unitaire||0),Number(l.quantite||0)*Number(l.prix_unitaire||0)]);
      }
      await db.query('COMMIT');
      await logEvent(user?user.id:null, user?user.nom:null, (header.id?'Modif':'Création')+' commande client '+('CMD-'+String(id).padStart(3,'0')));
      return { id, numero: 'CMD-'+String(id).padStart(3,'0') };
    } catch(e){ await db.query('ROLLBACK'); throw e; }
  },
  updateCommandeStatut: (id, statut) => db.query('UPDATE commandes_client SET statut=$1 WHERE id=$2', [statut, id]),
  deleteCommande: (id) => db.query('DELETE FROM commandes_client WHERE id=$1', [id]),

  // ---------- Module 3 : Comparateur (cotations + offres) ----------
  getCotations: async () => {
    const cots = await db.query('SELECT * FROM cotations ORDER BY created_at DESC, id DESC LIMIT 200');
    for (const c of cots) {
      c.offres = await db.query(`SELECT o.*, f.nom AS fournisseur_nom FROM cotation_offres o LEFT JOIN fournisseurs f ON f.id=o.fournisseur_id WHERE o.cotation_id=$1 ORDER BY o.prix ASC NULLS LAST`, [c.id]);
    }
    return cots;
  },
  saveCotation: async ({ header, offres }, user) => {
    await db.query('BEGIN');
    try {
      let id = header.id;
      if (id) {
        await db.query('UPDATE cotations SET designation=$1,reference=$2,quantite=$3,statut=$4 WHERE id=$5',
          [header.designation,header.reference,Number(header.quantite||1),header.statut||'En cours',id]);
        await db.query('DELETE FROM cotation_offres WHERE cotation_id=$1', [id]);
      } else {
        const r = await db.query('INSERT INTO cotations (designation,reference,quantite,statut) VALUES ($1,$2,$3,$4) RETURNING id',
          [header.designation,header.reference,Number(header.quantite||1),header.statut||'En cours']);
        id = r[0].id;
      }
      for (const o of (offres||[])) {
        await db.query('INSERT INTO cotation_offres (cotation_id,fournisseur_id,prix,devise,disponibilite,delai,moq,date_reception,remarques,choisi) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
          [id,o.fournisseur_id||null,o.prix!=null?Number(o.prix):null,o.devise||null,o.disponibilite||null,o.delai||null,o.moq!=null?Number(o.moq):null,o.date_reception||null,o.remarques||null,!!o.choisi]);
      }
      await db.query('COMMIT');
      await logEvent(user?user.id:null, user?user.nom:null, 'Demande de prix : '+header.designation);
      return { id };
    } catch(e){ await db.query('ROLLBACK'); throw e; }
  },
  choisirOffre: async (cotationId, offreId) => {
    await db.query('BEGIN');
    try {
      await db.query('UPDATE cotation_offres SET choisi=false WHERE cotation_id=$1', [cotationId]);
      await db.query('UPDATE cotation_offres SET choisi=true WHERE id=$1', [offreId]);
      await db.query("UPDATE cotations SET statut='Choisi' WHERE id=$1", [cotationId]);
      await db.query('COMMIT');
    } catch(e){ await db.query('ROLLBACK'); throw e; }
    return true;
  },
  deleteCotation: (id) => db.query('DELETE FROM cotations WHERE id=$1', [id]),

  // ---------- Module 4 : Commandes fournisseur ----------
  getCmdFournisseurs: (f={}) => {
    const params=[]; let sql = `SELECT cf.*, fo.nom AS fournisseur_nom,
        (SELECT count(*)::int FROM commande_fournisseur_lignes l WHERE l.commande_id=cf.id) AS nb_lignes
      FROM commandes_fournisseur cf LEFT JOIN fournisseurs fo ON fo.id=cf.fournisseur_id WHERE 1=1`;
    if (f.statut && f.statut!=='Toutes') { params.push(f.statut); sql+=` AND cf.statut=$${params.length}`; }
    if (f.recherche) { params.push('%'+String(f.recherche).toLowerCase()+'%'); sql+=` AND (lower(fo.nom) LIKE $${params.length} OR lower(cf.numero) LIKE $${params.length})`; }
    sql += ' ORDER BY cf.date_cmd DESC, cf.id DESC LIMIT 300';
    return db.query(sql, params);
  },
  getCmdFournisseurDetail: async (id) => {
    const cf = (await db.query(`SELECT cf.*, fo.nom AS fournisseur_nom FROM commandes_fournisseur cf LEFT JOIN fournisseurs fo ON fo.id=cf.fournisseur_id WHERE cf.id=$1`, [id]))[0];
    if (!cf) return null;
    cf.lignes = await db.query('SELECT * FROM commande_fournisseur_lignes WHERE commande_id=$1 ORDER BY id', [id]);
    cf.clients = await db.query(`SELECT cc.numero, c.nom AS client_nom FROM cmd_fourn_clients l JOIN commandes_client cc ON cc.id=l.commande_client_id LEFT JOIN clients c ON c.id=cc.client_id WHERE l.cmd_fournisseur_id=$1`, [id]);
    return cf;
  },
  saveCmdFournisseur: async ({ header, lignes, client_ids }, user) => {
    await db.query('BEGIN');
    try {
      const total = (lignes||[]).reduce((s,l)=>s + Number(l.quantite||0)*Number(l.prix_unitaire||0), 0);
      let id = header.id;
      if (id) {
        await db.query('UPDATE commandes_fournisseur SET fournisseur_id=$1,date_cmd=$2,devise=$3,statut=$4,conditions_paiement=$5,observations=$6,total=$7 WHERE id=$8',
          [header.fournisseur_id||null,header.date_cmd||null,header.devise||null,header.statut||'Préparation',header.conditions_paiement||null,header.observations||'',total,id]);
        await db.query('DELETE FROM commande_fournisseur_lignes WHERE commande_id=$1', [id]);
        await db.query('DELETE FROM cmd_fourn_clients WHERE cmd_fournisseur_id=$1', [id]);
      } else {
        const r = await db.query('INSERT INTO commandes_fournisseur (fournisseur_id,date_cmd,devise,statut,conditions_paiement,observations,total,utilisateur_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
          [header.fournisseur_id||null,header.date_cmd||null,header.devise||null,header.statut||'Préparation',header.conditions_paiement||null,header.observations||'',total,user?user.id:null]);
        id = r[0].id;
        await db.query("UPDATE commandes_fournisseur SET numero=$1 WHERE id=$2", ['CF-'+String(id).padStart(3,'0'), id]);
      }
      for (const l of (lignes||[])) {
        await db.query('INSERT INTO commande_fournisseur_lignes (commande_id,designation,reference,quantite,prix_unitaire,montant) VALUES ($1,$2,$3,$4,$5,$6)',
          [id,l.designation||'',l.reference||'',Number(l.quantite||0),Number(l.prix_unitaire||0),Number(l.quantite||0)*Number(l.prix_unitaire||0)]);
      }
      for (const cid of (client_ids||[])) {
        await db.query('INSERT INTO cmd_fourn_clients (cmd_fournisseur_id, commande_client_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, cid]);
      }
      await db.query('COMMIT');
      await logEvent(user?user.id:null, user?user.nom:null, (header.id?'Modif':'Création')+' commande fournisseur '+('CF-'+String(id).padStart(3,'0')));
      return { id, numero: 'CF-'+String(id).padStart(3,'0') };
    } catch(e){ await db.query('ROLLBACK'); throw e; }
  },
  updateCmdFournisseurStatut: (id, statut) => db.query('UPDATE commandes_fournisseur SET statut=$1 WHERE id=$2', [statut, id]),
  deleteCmdFournisseur: (id) => db.query('DELETE FROM commandes_fournisseur WHERE id=$1', [id]),

  // ---------- Module 5 : Réceptions ----------
  // Commandes fournisseur pas encore reçues (à réceptionner)
  getCmdFournisseursARecevoir: () => db.query(
    `SELECT cf.id, cf.numero, cf.date_cmd, cf.statut, cf.devise, cf.total, fo.nom AS fournisseur_nom
     FROM commandes_fournisseur cf LEFT JOIN fournisseurs fo ON fo.id=cf.fournisseur_id
     WHERE cf.statut <> 'Livré' ORDER BY cf.date_cmd DESC`),
  getReceptions: (f={}) => {
    const p=[]; let sql=`SELECT r.*, cf.numero AS cf_numero, fo.nom AS fournisseur_nom,
        (SELECT count(*)::int FROM reception_lignes l WHERE l.reception_id=r.id) AS nb_lignes
      FROM receptions r LEFT JOIN commandes_fournisseur cf ON cf.id=r.cmd_fournisseur_id
      LEFT JOIN fournisseurs fo ON fo.id=cf.fournisseur_id WHERE 1=1`;
    if (f.recherche){ p.push('%'+String(f.recherche).toLowerCase()+'%'); sql+=` AND (lower(r.numero) LIKE $${p.length} OR lower(fo.nom) LIKE $${p.length})`; }
    sql+=' ORDER BY r.date_reception DESC, r.id DESC LIMIT 300';
    return db.query(sql, p);
  },
  getReceptionDetail: async (id) => {
    const r = (await db.query(`SELECT r.*, cf.numero AS cf_numero, fo.nom AS fournisseur_nom
      FROM receptions r LEFT JOIN commandes_fournisseur cf ON cf.id=r.cmd_fournisseur_id
      LEFT JOIN fournisseurs fo ON fo.id=cf.fournisseur_id WHERE r.id=$1`, [id]))[0];
    if (!r) return null;
    r.lignes = await db.query('SELECT * FROM reception_lignes WHERE reception_id=$1 ORDER BY id', [id]);
    return r;
  },
  saveReception: async ({ header, lignes }, user) => {
    await db.query('BEGIN');
    try {
      const ls = (lignes||[]).map(l=>{
        const cmd=Number(l.quantite_commandee||0), rec=Number(l.quantite_recue||0);
        const st = rec<=0 ? 'Manquant' : (rec<cmd ? 'Partiel' : 'Reçu');
        return { ...l, quantite_commandee:cmd, quantite_recue:rec, statut:st };
      });
      const nbRecu = ls.filter(l=>l.statut==='Reçu').length;
      const nbRecuOuPartiel = ls.filter(l=>l.quantite_recue>0).length;
      const statut = ls.length && nbRecu===ls.length ? 'Complète' : (nbRecuOuPartiel>0 ? 'Partielle' : 'En attente');
      const r = await db.query('INSERT INTO receptions (cmd_fournisseur_id,date_reception,statut,observations,utilisateur_id) VALUES ($1,$2,$3,$4,$5) RETURNING id',
        [header.cmd_fournisseur_id||null, header.date_reception||null, statut, header.observations||'', user?user.id:null]);
      const id = r[0].id;
      await db.query("UPDATE receptions SET numero=$1 WHERE id=$2", ['REC-'+String(id).padStart(3,'0'), id]);
      for (const l of ls) {
        await db.query('INSERT INTO reception_lignes (reception_id,designation,reference,quantite_commandee,quantite_recue,statut) VALUES ($1,$2,$3,$4,$5,$6)',
          [id, l.designation||'', l.reference||'', l.quantite_commandee, l.quantite_recue, l.statut]);
      }
      // Frais (coût de revient) sur la commande fournisseur + statut Livré si complète
      if (header.cmd_fournisseur_id) {
        if (header.frais) await db.query('UPDATE commandes_fournisseur SET frais_transport=$1,frais_import=$2,frais_autres=$3 WHERE id=$4',
          [Number(header.frais.transport||0),Number(header.frais.import||0),Number(header.frais.autres||0),header.cmd_fournisseur_id]);
        if (statut==='Complète') await db.query("UPDATE commandes_fournisseur SET statut='Livré' WHERE id=$1", [header.cmd_fournisseur_id]);
        else if (statut==='Partielle') await db.query("UPDATE commandes_fournisseur SET statut='En transit' WHERE id=$1", [header.cmd_fournisseur_id]);
      }
      await db.query('COMMIT');
      await logEvent(user?user.id:null, user?user.nom:null, 'Réception '+('REC-'+String(id).padStart(3,'0'))+' ('+statut+')');
      return { id, numero:'REC-'+String(id).padStart(3,'0'), statut };
    } catch(e){ await db.query('ROLLBACK'); throw e; }
  },
  deleteReception: (id) => db.query('DELETE FROM receptions WHERE id=$1', [id]),

  // ---------- Module 6 : Coût de revient ----------
  // Répartit les frais (transport/import/autres) au prorata de la valeur des lignes
  // et renvoie le coût de revient unitaire par article.
  getCoutRevient: async (cmdFournisseurId) => {
    const cf = (await db.query(`SELECT cf.*, fo.nom AS fournisseur_nom FROM commandes_fournisseur cf LEFT JOIN fournisseurs fo ON fo.id=cf.fournisseur_id WHERE cf.id=$1`, [cmdFournisseurId]))[0];
    if (!cf) return null;
    const lignes = await db.query('SELECT * FROM commande_fournisseur_lignes WHERE commande_id=$1 ORDER BY id', [cmdFournisseurId]);
    const totalMarchandise = lignes.reduce((s,l)=>s+Number(l.montant||0),0);
    const totalFrais = Number(cf.frais_transport||0)+Number(cf.frais_import||0)+Number(cf.frais_autres||0);
    lignes.forEach(l=>{
      const part = totalMarchandise>0 ? (Number(l.montant||0)/totalMarchandise) : 0;
      const fraisLigne = totalFrais*part;
      const qte = Number(l.quantite||0)||1;
      l.frais_reparti = Math.round(fraisLigne);
      l.cout_revient_total = Math.round(Number(l.montant||0)+fraisLigne);
      l.cout_revient_unitaire = Math.round((Number(l.montant||0)+fraisLigne)/qte);
    });
    return { commande: cf, lignes, totalMarchandise, totalFrais, coutRevientTotal: totalMarchandise+totalFrais };
  },
  saveFraisCoutRevient: (cmdFournisseurId, frais) => db.query(
    'UPDATE commandes_fournisseur SET frais_transport=$1,frais_import=$2,frais_autres=$3 WHERE id=$4',
    [Number(frais.transport||0),Number(frais.import||0),Number(frais.autres||0),cmdFournisseurId]),

    // ---------- Module 7 : Facturation ----------
    getFactures: (f={}) => {
      const params=[]; let sql = `SELECT fa.*, c.nom AS client_nom, cc.numero AS commande_numero,
          (SELECT count(*)::int FROM facture_lignes l WHERE l.facture_id=fa.id) AS nb_lignes
        FROM factures fa
        LEFT JOIN clients c ON c.id=fa.client_id
        LEFT JOIN commandes_client cc ON cc.id=fa.commande_id
        WHERE 1=1`;
      if (f.statut && f.statut!=='Toutes') { params.push(f.statut); sql+=` AND fa.statut=$${params.length}`; }
      if (f.recherche) { params.push('%'+String(f.recherche).toLowerCase()+'%'); sql+=` AND (lower(c.nom) LIKE $${params.length} OR lower(fa.numero) LIKE $${params.length} OR lower(COALESCE(cc.numero,'')) LIKE $${params.length})`; }
      sql += ' ORDER BY fa.date_facture DESC, fa.id DESC LIMIT 300';
      return db.query(sql, params);
    },
    getFactureDetail: async (id) => {
      const fa = (await db.query(`SELECT fa.*, c.nom AS client_nom, cc.numero AS commande_numero
        FROM factures fa
        LEFT JOIN clients c ON c.id=fa.client_id
        LEFT JOIN commandes_client cc ON cc.id=fa.commande_id
        WHERE fa.id=$1`, [id]))[0];
      if (!fa) return null;
      fa.lignes = await db.query('SELECT * FROM facture_lignes WHERE facture_id=$1 ORDER BY id', [id]);
      fa.paiements = await db.query("SELECT * FROM paiements WHERE type='client' AND reference_doc=$1 ORDER BY date_paiement DESC, id DESC", [fa.numero]);
      return fa;
    },
    saveFacture: async ({ header, lignes }, user) => {
      await db.query('BEGIN');
      try {
        const total = (lignes||[]).reduce((s,l)=>s + Number(l.quantite||0)*Number(l.prix_unitaire||0), 0);
        const marge = (lignes||[]).reduce((s,l)=>s + (Number(l.prix_unitaire||0)-Number(l.cout_unitaire||0))*Number(l.quantite||0), 0);
        const r = await db.query('INSERT INTO factures (client_id,commande_id,date_facture,total_ht,marge,statut) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
          [header.client_id||null,header.commande_id||null,header.date_facture||null,total,marge,header.statut||'Impayée']);
        const id = r[0].id;
        const numero = 'FA-'+String(id).padStart(3,'0');
        await db.query('UPDATE factures SET numero=$1 WHERE id=$2', [numero, id]);
        for (const l of (lignes||[])) {
          const q = Number(l.quantite||0);
          const pu = Number(l.prix_unitaire||0);
          await db.query('INSERT INTO facture_lignes (facture_id,designation,reference,quantite,prix_unitaire,cout_unitaire,montant) VALUES ($1,$2,$3,$4,$5,$6,$7)',
            [id,l.designation||'',l.reference||'',q,pu,Number(l.cout_unitaire||0),q*pu]);
        }
        await db.query('COMMIT');
        await logEvent(user?user.id:null, user?user.nom:null, 'Création facture '+numero);
        return { id, numero };
      } catch(e){ await db.query('ROLLBACK'); throw e; }
    },
    updateFactureStatut: (id, statut) => db.query('UPDATE factures SET statut=$1 WHERE id=$2', [statut, id]),
  
    // ---------- Module 8 : Paiements ----------
    getPaiements: (f={}) => {
      const params=[]; let sql = 'SELECT * FROM paiements WHERE 1=1';
      if (f.type && f.type!=='Tous') { params.push(f.type); sql+=` AND type=$${params.length}`; }
      sql += ' ORDER BY COALESCE(date_paiement,echeance) DESC NULLS LAST, id DESC LIMIT 300';
      return db.query(sql, params);
    },
    savePaiement: async (p, user) => {
      const r = await db.query('INSERT INTO paiements (type,tiers_id,tiers_nom,reference_doc,montant,mode,echeance,date_paiement,statut) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id',
        [p.type||'client',p.tiers_id||null,p.tiers_nom||'',p.reference_doc||'',Number(p.montant||0),p.mode||'Espèces',p.echeance||null,p.date_paiement||null,p.statut||'Payé']);
      await logEvent(user?user.id:null, user?user.nom:null, 'Paiement '+(p.type==='fournisseur'?'fournisseur ':'client ')+(p.reference_doc||'')+' '+Number(p.montant||0)+' Ar');
      return { id: r[0].id };
    },
    updatePaiement: async (id, champs) => {
      const allowed = ['type','tiers_id','tiers_nom','reference_doc','montant','mode','echeance','date_paiement','statut'];
      const keys = Object.keys(champs||{}).filter(k=>allowed.includes(k));
      if (!keys.length) return true;
      const values = keys.map(k => k==='montant' ? Number(champs[k]||0) : champs[k]);
      const set = keys.map((k,i)=>`${k}=$${i+1}`).join(',');
      values.push(id);
      await db.query(`UPDATE paiements SET ${set} WHERE id=$${values.length}`, values);
      return true;
    },
  
    // ---------- Module 9 : Expéditions ----------
    getExpeditions: (f={}) => {
      const params=[]; let sql = `SELECT e.*, c.nom AS client_nom,
          (SELECT count(*)::int FROM expedition_commandes ec WHERE ec.expedition_id=e.id) AS nb_commandes,
          (SELECT COALESCE(sum(cc.total),0)::float FROM expedition_commandes ec JOIN commandes_client cc ON cc.id=ec.commande_client_id WHERE ec.expedition_id=e.id) AS total_commandes
        FROM expeditions e
        LEFT JOIN clients c ON c.id=e.client_id
        WHERE 1=1`;
      if (f.statut && f.statut!=='Toutes') { params.push(f.statut); sql+=` AND e.statut=$${params.length}`; }
      if (f.recherche) { params.push('%'+String(f.recherche).toLowerCase()+'%'); sql+=` AND (lower(c.nom) LIKE $${params.length} OR lower(e.numero) LIKE $${params.length} OR lower(e.transport) LIKE $${params.length})`; }
      sql += ' ORDER BY e.date_exp DESC, e.id DESC LIMIT 300';
      return db.query(sql, params);
    },
    getExpeditionDetail: async (id) => {
      const e = (await db.query(`SELECT e.*, c.nom AS client_nom
        FROM expeditions e LEFT JOIN clients c ON c.id=e.client_id WHERE e.id=$1`, [id]))[0];
      if (!e) return null;
      e.commandes = await db.query(`SELECT cc.*, c.nom AS client_nom
        FROM expedition_commandes ec
        JOIN commandes_client cc ON cc.id=ec.commande_client_id
        LEFT JOIN clients c ON c.id=cc.client_id
        WHERE ec.expedition_id=$1
        ORDER BY cc.date_cmd DESC, cc.id DESC`, [id]);
      e.lignes = await db.query(`SELECT l.*, cc.numero AS commande_numero
        FROM expedition_commandes ec
        JOIN commandes_client cc ON cc.id=ec.commande_client_id
        JOIN commande_client_lignes l ON l.commande_id=cc.id
        WHERE ec.expedition_id=$1
        ORDER BY cc.numero, l.id`, [id]);
      return e;
    },
    saveExpedition: async ({ header, commande_ids }, user) => {
      await db.query('BEGIN');
      try {
        const r = await db.query('INSERT INTO expeditions (client_id,transport,date_exp,statut,no_colis,observations) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
          [header.client_id||null,header.transport||'Taxi-brousse',header.date_exp||null,header.statut||'Préparée',header.no_colis||null,header.observations||'']);
        const id = r[0].id;
        const numero = 'EXP-'+String(id).padStart(3,'0');
        await db.query('UPDATE expeditions SET numero=$1 WHERE id=$2', [numero, id]);
        for (const cid of (commande_ids||[])) {
          await db.query('INSERT INTO expedition_commandes (expedition_id, commande_client_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, cid]);
        }
        await db.query('COMMIT');
        await logEvent(user?user.id:null, user?user.nom:null, 'Création expédition '+numero);
        return { id, numero };
      } catch(e){ await db.query('ROLLBACK'); throw e; }
    },
    updateExpeditionStatut: (id, statut) => db.query('UPDATE expeditions SET statut=$1 WHERE id=$2', [statut, id]),

  // ---------- Tableau de bord (basique) ----------
  getStats: async () => {
    const q = async (s)=> (await db.query(s))[0];
    const a = await q(`SELECT
      (SELECT count(*)::int FROM commandes_client WHERE statut='En cours') cmd_encours,
      (SELECT count(*)::int FROM commandes_client WHERE type='Devis' OR statut='Devis') devis,
      (SELECT count(*)::int FROM commandes_fournisseur WHERE statut IN ('Préparation','En transit')) cf_actives,
      (SELECT count(*)::int FROM commandes_fournisseur WHERE statut='En transit') cf_a_recevoir,
      (SELECT count(*)::int FROM receptions WHERE date_trunc('month',date_reception)=date_trunc('month',current_date)) receptions_mois,
      (SELECT count(*)::int FROM clients WHERE actif=true) nb_clients,
      (SELECT count(*)::int FROM fournisseurs WHERE actif=true) nb_fournisseurs,
      (SELECT COALESCE(sum(total),0)::float FROM commandes_client WHERE date_trunc('month',date_cmd)=date_trunc('month',current_date)) ca_mois,
      (SELECT COALESCE(sum(total),0)::float FROM commandes_fournisseur WHERE date_trunc('month',date_cmd)=date_trunc('month',current_date)) achats_mois,
      (SELECT COALESCE(sum(total_ht),0)::float FROM factures WHERE statut<>'Payée')
        - (SELECT COALESCE(sum(montant),0)::float FROM paiements WHERE type='client' AND statut='Payé') creances,
      (SELECT COALESCE(sum(total),0)::float FROM commandes_fournisseur)
        - (SELECT COALESCE(sum(montant),0)::float FROM paiements WHERE type='fournisseur' AND statut='Payé') dettes,
      (SELECT COALESCE(sum(marge),0)::float FROM factures WHERE date_trunc('month',date_facture)=date_trunc('month',current_date)) benefice_mois`);
    return a;
  },

  // ---------- Journal ----------
  getJournal: () => db.query('SELECT * FROM journal ORDER BY created_at DESC LIMIT 300'),

  // ---------- Module 12 : Intelligence (Grok / xAI) ----------
  saveGrokConfig: (key, model) => db.query('UPDATE config SET grok_key=$1, grok_model=$2 WHERE id=1', [key||null, model||'grok-2-latest']),
  getGrokConfig: async () => {
    const c = (await db.query('SELECT grok_key, grok_model FROM config WHERE id=1'))[0] || {};
    return { configured: !!c.grok_key, model: c.grok_model || 'grok-2-latest' };
  },
  // Rassemble un instantané des données pour donner le contexte à l'IA.
  _contexteIA: async () => {
    const stats = (await db.query(`SELECT
      (SELECT count(*)::int FROM commandes_client) nb_commandes,
      (SELECT count(*)::int FROM commandes_client WHERE statut='En cours') cmd_encours,
      (SELECT count(*)::int FROM fournisseurs WHERE actif=true) nb_fournisseurs,
      (SELECT count(*)::int FROM clients WHERE actif=true) nb_clients,
      (SELECT COALESCE(sum(total),0)::float FROM commandes_client WHERE date_trunc('month',date_cmd)=date_trunc('month',current_date)) ca_mois,
      (SELECT COALESCE(sum(marge),0)::float FROM factures WHERE date_trunc('month',date_facture)=date_trunc('month',current_date)) marge_mois`))[0];
    const cotations = await db.query(`SELECT c.designation, c.reference, c.quantite,
        json_agg(json_build_object('fournisseur',f.nom,'prix',o.prix,'devise',o.devise,'delai',o.delai,'dispo',o.disponibilite) ORDER BY o.prix) AS offres
      FROM cotations c LEFT JOIN cotation_offres o ON o.cotation_id=c.id LEFT JOIN fournisseurs f ON f.id=o.fournisseur_id
      GROUP BY c.id ORDER BY c.created_at DESC LIMIT 15`);
    const factures = await db.query(`SELECT numero, total_ht, marge, statut FROM factures ORDER BY date_facture DESC LIMIT 15`);
    const fournisseurs = await db.query('SELECT nom, pays, devise, rating, delai FROM fournisseurs WHERE actif=true LIMIT 20');
    return { stats, cotations, factures, fournisseurs };
  },
  askIA: async (question) => {
    const c = (await db.query('SELECT grok_key, grok_model FROM config WHERE id=1'))[0] || {};
    if (!c.grok_key) { const e = new Error('Clé API Grok non configurée. Allez dans Paramètres → Intelligence pour la saisir.'); e.code='NO_KEY'; throw e; }
    const ctx = await API._contexteIA();
    const sys = "Tu es l'assistant intelligent de l'ERP « ABS STORE PIECES AUTOS », un distributeur de pièces automobiles à Madagascar (devise Ariary/Ar). "
      + "Tu aides à comparer les prix fournisseurs, conseiller le meilleur achat, calculer la rentabilité et détecter les anomalies de prix. "
      + "Réponds en FRANÇAIS, de façon concise, concrète et chiffrée. Base-toi uniquement sur les données fournies ci-dessous. "
      + "Si une donnée manque, dis-le simplement.\n\nDONNÉES ACTUELLES (JSON):\n" + JSON.stringify(ctx);
    let res;
    try {
      res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+c.grok_key },
        body: JSON.stringify({ model: c.grok_model || 'llama-3.3-70b-versatile', temperature:0.3,
          messages:[ {role:'system',content:sys}, {role:'user',content:question} ] })
      });
    } catch(e){ throw new Error('Connexion à Groq impossible (vérifiez internet) : '+e.message); }
    const data = await res.json().catch(()=>({}));
    if (!res.ok) throw new Error((data && data.error && (data.error.message||data.error)) || ('Erreur Groq ('+res.status+')'));
    const txt = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    return txt || '(réponse vide)';
  },
  testGrok: async () => {
    try { const r = await API.askIA('Réponds juste OK pour tester la connexion.'); return { ok:true, reponse:r }; }
    catch(e){ return { ok:false, erreur:e.message }; }
  },

  // ---------- Analyses intelligentes HORS LIGNE (cahier des charges Art. 9) ----------
  // Ces 4 analyses sont calculées localement sur la base PostgreSQL, sans aucune
  // connexion internet. Seule la Q&A en langage naturel (askIA) passe par Groq.

  // 1) Comparer les prix fournisseurs : meilleure offre par demande de prix.
  analyseComparerPrix: async () => {
    const cots = await db.query(`SELECT c.designation, c.reference, c.quantite,
        json_agg(json_build_object('f',COALESCE(f.nom,'Fournisseur ?'),'prix',o.prix,'devise',o.devise,'delai',o.delai,'dispo',o.disponibilite,'choisi',o.choisi)
          ORDER BY o.prix ASC NULLS LAST) FILTER (WHERE o.id IS NOT NULL) AS offres
      FROM cotations c LEFT JOIN cotation_offres o ON o.cotation_id=c.id LEFT JOIN fournisseurs f ON f.id=o.fournisseur_id
      GROUP BY c.id ORDER BY c.created_at DESC LIMIT 30`);
    if (!cots.length) return "Aucune demande de prix enregistrée pour le moment.";
    const out = [];
    for (const c of cots) {
      const offres = (c.offres||[]).filter(o=>o.prix!=null);
      const titre = `• ${c.designation||'(sans nom)'}${c.reference?' ['+c.reference+']':''} — qté ${c.quantite||1}`;
      if (!offres.length) { out.push(titre + "\n   Aucune offre chiffrée."); continue; }
      const best = offres[0];
      const lignes = offres.map(o => `   - ${o.f} : ${_ar(o.prix)}${o.delai?' · '+o.delai:''}${o.dispo?' · '+o.dispo:''}${o.choisi?'  ✅ choisi':''}`);
      let concl = `   → Meilleur prix : ${best.f} à ${_ar(best.prix)}`;
      if (offres.length>1) { const eco = offres[offres.length-1].prix - best.prix; if (eco>0) concl += ` (économie ${_ar(eco)} vs le plus cher)`; }
      out.push(titre + "\n" + lignes.join("\n") + "\n" + concl);
    }
    return "COMPARAISON DES PRIX FOURNISSEURS\n\n" + out.join("\n\n");
  },

  // 2) Conseiller le meilleur achat : demandes non encore tranchées + offre la moins chère.
  analyseConseilAchat: async () => {
    const rows = await db.query(`SELECT c.designation, c.reference, c.quantite,
        (array_agg(f.nom ORDER BY o.prix ASC NULLS LAST))[1] AS fournisseur,
        min(o.prix) AS prix,
        (array_agg(o.delai ORDER BY o.prix ASC NULLS LAST))[1] AS delai
      FROM cotations c JOIN cotation_offres o ON o.cotation_id=c.id LEFT JOIN fournisseurs f ON f.id=o.fournisseur_id
      WHERE COALESCE(c.statut,'') <> 'Choisi' AND o.prix IS NOT NULL
      GROUP BY c.id ORDER BY c.created_at DESC LIMIT 25`);
    if (!rows.length) return "Aucun achat en attente de décision : toutes les demandes de prix ont déjà un fournisseur choisi, ou aucune offre n'est chiffrée.";
    const out = rows.map(r => `• ${r.designation||'(sans nom)'}${r.reference?' ['+r.reference+']':''} — qté ${r.quantite||1}\n   → Commander chez ${r.fournisseur||'?'} à ${_ar(r.prix)}${r.delai?' (délai '+r.delai+')':''}`);
    return "CONSEIL D'ACHAT — à commander en priorité\n\n" + out.join("\n\n") + "\n\nCes recommandations retiennent le fournisseur le moins cher pour chaque pièce non encore commandée.";
  },

  // 3) Rentabilité : marge du mois + factures à plus faible marge.
  analyseRentabilite: async () => {
    const g = (await db.query(`SELECT COALESCE(sum(total_ht),0)::float ca, COALESCE(sum(marge),0)::float marge, count(*)::int n
      FROM factures WHERE date_trunc('month',date_facture)=date_trunc('month',current_date)`))[0];
    const pct = g.ca>0 ? (g.marge/g.ca*100) : 0;
    const faibles = await db.query(`SELECT numero, total_ht::float, marge::float,
        CASE WHEN total_ht>0 THEN round((marge/total_ht*100)::numeric,1) ELSE 0 END AS pct
      FROM factures WHERE total_ht>0 ORDER BY (marge/NULLIF(total_ht,0)) ASC, id DESC LIMIT 5`);
    let txt = "ANALYSE DE RENTABILITÉ (mois en cours)\n\n"
      + `• Chiffre d'affaires facturé : ${_ar(g.ca)} sur ${g.n} facture(s)\n`
      + `• Marge totale : ${_ar(g.marge)}\n`
      + `• Taux de marge moyen : ${pct.toFixed(1)} %`;
    if (faibles.length) {
      txt += "\n\nFactures à plus faible marge (à surveiller) :\n"
        + faibles.map(f => `   - ${f.numero||'?'} : marge ${_ar(f.marge)} (${f.pct} %)`).join("\n");
      const bas = faibles.filter(f=>Number(f.pct)<10);
      if (bas.length) txt += "\n\n⚠️ " + bas.length + " facture(s) sous 10 % de marge : renégocier l'achat ou revoir le prix de vente.";
    }
    return txt;
  },

  // 4) Détecter les anomalies de prix : offres nettement au-dessus du meilleur prix.
  analyseAnomalies: async () => {
    const rows = await db.query(`SELECT c.designation, c.reference, COALESCE(f.nom,'Fournisseur ?') fournisseur, o.prix::float prix,
        min(o.prix) OVER (PARTITION BY o.cotation_id)::float AS min_prix
      FROM cotation_offres o JOIN cotations c ON c.id=o.cotation_id LEFT JOIN fournisseurs f ON f.id=o.fournisseur_id
      WHERE o.prix IS NOT NULL`);
    const anomalies = rows.filter(r => r.min_prix>0 && r.prix > r.min_prix*1.5)
      .map(r => ({ ...r, ecart: (r.prix/r.min_prix-1)*100 }))
      .sort((a,b)=>b.ecart-a.ecart).slice(0,15);
    if (!anomalies.length) return "Aucune anomalie de prix détectée : les offres des fournisseurs restent cohérentes entre elles (écarts inférieurs à 50 % sur chaque pièce).";
    const out = anomalies.map(a => `• ${a.designation||'(sans nom)'}${a.reference?' ['+a.reference+']':''}\n   ${a.fournisseur} : ${_ar(a.prix)} — soit +${a.ecart.toFixed(0)} % au-dessus du meilleur prix (${_ar(a.min_prix)})`);
    return "ANOMALIES DE PRIX DÉTECTÉES (offre à +50 % ou plus du meilleur prix)\n\n" + out.join("\n\n");
  },

  // ---------- Sauvegarde / Restauration locale (contrat Art. 7) ----------
  // Snapshot JSON de toutes les tables métier via le pool PostgreSQL (aucun binaire externe requis).
  listBackups: () => {
    try {
      const dir = backupsDir();
      return fs.readdirSync(dir).filter(f=>/\.json$/i.test(f)).map(f => {
        const st = fs.statSync(path.join(dir,f));
        return { name:f, path:path.join(dir,f), size:st.size, date:st.mtime.toISOString() };
      }).sort((a,b)=>b.date.localeCompare(a.date));
    } catch { return []; }
  },
  backupNow: async (user) => {
    const data = {};
    for (const t of BACKUP_TABLES) { try { data[t] = await db.query('SELECT * FROM '+t); } catch { data[t] = []; } }
    const stamp = new Date().toISOString().slice(0,16).replace('T','-').replace(/:/g,'');
    const file = path.join(backupsDir(), `abs-store-${stamp}.json`);
    fs.writeFileSync(file, JSON.stringify({ app:'ABS Store', format:1, date:new Date().toISOString(), tables:data }), 'utf8');
    await logEvent(user?user.id:null, user?user.nom:null, 'Sauvegarde manuelle : '+path.basename(file));
    return { ok:true, name:path.basename(file), path:file };
  },
  restoreBackup: async (file, user) => {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    const tables = raw.tables || {};
    const conv = (v) => (v!==null && typeof v==='object') ? JSON.stringify(v) : v;
    const client = await db.getPool().connect();
    try {
      await client.query('BEGIN');
      // SET LOCAL : désactive les contraintes FK uniquement le temps de cette transaction
      // (revient automatiquement à la normale au COMMIT/ROLLBACK).
      await client.query("SET LOCAL session_replication_role = replica");
      for (const t of [...BACKUP_TABLES].reverse()) await client.query('DELETE FROM '+t);
      for (const t of BACKUP_TABLES) {
        for (const row of (tables[t]||[])) {
          const cols = Object.keys(row);
          if (!cols.length) continue;
          const ph = cols.map((_,i)=>'$'+(i+1)).join(',');
          const names = cols.map(c=>'"'+c+'"').join(',');
          await client.query(`INSERT INTO ${t} (${names}) VALUES (${ph})`, cols.map(c=>conv(row[c])));
        }
      }
      for (const t of BACKUP_SERIAL) {
        const seq = (await client.query(`SELECT pg_get_serial_sequence('${t}','id') AS s`)).rows[0];
        if (seq && seq.s) await client.query(`SELECT setval($1, GREATEST(COALESCE((SELECT max(id) FROM ${t}),1),1))`, [seq.s]);
      }
      await client.query('COMMIT');
    } catch(e){ try{ await client.query('ROLLBACK'); }catch{} throw e; }
    finally { client.release(); }
    await logEvent(user?user.id:null, user?user.nom:null, 'Restauration depuis '+path.basename(file));
    return { ok:true };
  },
  openBackupsFolder: () => {
    const dir = backupsDir();
    try { require('child_process').spawn('explorer.exe', [dir], { detached:true, stdio:'ignore' }).unref(); } catch {}
    return dir;
  },

  // ---------- Données de démonstration / Réinitialisation ----------
  // Jeu de données fictives réaliste (clients, fournisseurs, commandes, devis, factures,
  // paiements, expéditions) pour permettre au client de tester tous les modules.
  seedDemoData: async (user) => {
    const uid = user ? user.id : null, unom = user ? user.nom : null;
    const days = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0,10); };
    const rnd = (arr) => arr[Math.floor(Math.random()*arr.length)];

    const PIECES = [
      { designation:'Filtre à huile', reference:'FH-2201', marque:'Toyota', prix:18000 },
      { designation:'Plaquettes de frein avant', reference:'PF-4410', marque:'Nissan', prix:65000 },
      { designation:'Amortisseur avant droit', reference:'AM-3301', marque:'Mitsubishi', prix:120000 },
      { designation:'Courroie de distribution', reference:'CD-1102', marque:'Toyota', prix:85000 },
      { designation:"Bougies d'allumage (jeu de 4)", reference:'BG-5501', marque:'Renault', prix:32000 },
      { designation:'Disque de frein avant', reference:'DF-2209', marque:'Peugeot', prix:78000 },
      { designation:'Rotule de direction', reference:'RD-6602', marque:'Toyota', prix:45000 },
      { designation:'Radiateur moteur', reference:'RM-7701', marque:'Nissan', prix:210000 },
      { designation:'Alternateur 12V', reference:'AL-8801', marque:'Mitsubishi', prix:280000 },
      { designation:'Démarreur', reference:'DM-9901', marque:'Toyota', prix:195000 },
      { designation:"Kit d'embrayage complet", reference:'KE-1203', marque:'Renault', prix:165000 },
      { designation:'Pare-choc avant', reference:'PC-3405', marque:'Toyota', prix:250000 },
      { designation:'Filtre à air', reference:'FA-2202', marque:'Nissan', prix:15000 },
      { designation:'Filtre à carburant', reference:'FC-2203', marque:'Toyota', prix:22000 },
      { designation:'Batterie 12V 60Ah', reference:'BAT-1001', marque:'Mitsubishi', prix:135000 },
      { designation:'Durite de radiateur', reference:'DR-4501', marque:'Toyota', prix:19000 },
    ];

    // ---- Clients ----
    const clientsData = [
      { nom:'Garage Rakotoarivelo', contact:'Jean Rakotoarivelo', tel:'034 12 345 67', email:'rakoto.garage@gmail.com', adresse:'Ankorondrano, Antananarivo', remise:5 },
      { nom:'Ets Randriamampionona', contact:'Herimanana Randriamampionona', tel:'033 45 678 90', email:'ets.randria@gmail.com', adresse:'Analakely, Antananarivo', remise:0 },
      { nom:'Taxi-Be Andrianina', contact:'Solofo Andrianina', tel:'032 11 222 33', email:'', adresse:'Antsirabe', remise:10 },
      { nom:'Garage Miora Auto', contact:'Miora Rasoanaivo', tel:'034 98 765 43', email:'miora.auto@yahoo.fr', adresse:'Toamasina', remise:0 },
      { nom:'SOMACOA Transport', contact:'Njaka Rabe', tel:'033 22 111 00', email:'contact@somacoa.mg', adresse:'Tanjombato, Antananarivo', remise:8 },
      { nom:'Auto Pièces Fenosoa', contact:'Fenosoa Ravelojaona', tel:'032 55 666 77', email:'', adresse:'Mahajanga', remise:0 },
      { nom:'Garage Tsara Kanto', contact:'Tsiory Rakotondrabe', tel:'034 33 444 55', email:'tsarakanto@gmail.com', adresse:'Fianarantsoa', remise:5 },
      { nom:'Ranarison Transport', contact:'Hery Ranarison', tel:'033 66 777 88', email:'', adresse:'Ivato, Antananarivo', remise:0 },
    ];
    const clientIds = [];
    for (const c of clientsData) clientIds.push(await API.saveClient(c));

    // ---- Fournisseurs ----
    const fournisseursData = [
      { nom:'China Auto Parts Trading', pays:'Chine', devise:'USD', rating:4, delai:'35-45j', contact:'Li Wei', tel:'+86 138 0000 0001', conditions_paiement:'30% acompte, solde à l\'expédition' },
      { nom:'Dubai Motors Import', pays:'Émirats Arabes Unis', devise:'USD', rating:4, delai:'20-30j', contact:'Ahmed Khalil', tel:'+971 50 123 4567', conditions_paiement:'Paiement à la commande' },
      { nom:'Japan Parts Direct', pays:'Japon', devise:'USD', rating:5, delai:'40-50j', contact:'Tanaka Hiroshi', tel:'+81 90 1234 5678', conditions_paiement:'50% acompte, solde à réception' },
      { nom:'Pièces Réunion Import', pays:'La Réunion', devise:'EUR', rating:5, delai:'10-15j', contact:'Marc Payet', tel:'+262 692 12 34 56', conditions_paiement:'30 jours' },
      { nom:'Somaco Fournitures Auto', pays:'Madagascar', devise:'MGA', rating:3, delai:'2-5j', contact:'Rivo Andriamahefa', tel:'034 20 111 22', conditions_paiement:'Comptant' },
      { nom:'Gulf Auto Spares', pays:'Émirats Arabes Unis', devise:'USD', rating:3, delai:'25-35j', contact:'Omar Saeed', tel:'+971 55 987 6543', conditions_paiement:'Paiement à la commande' },
    ];
    const fournIds = [];
    for (const f of fournisseursData) fournIds.push(await API.saveFournisseur(f));

    // ---- Commandes clients (+ 2 devis) ----
    const commandes = [];
    for (let i=0; i<12; i++) {
      const nbLignes = 1 + Math.floor(Math.random()*3);
      const lignes = Array.from({length:nbLignes}, () => { const p = rnd(PIECES); return { designation:p.designation, reference:p.reference, marque:p.marque, quantite:1+Math.floor(Math.random()*4), prix_unitaire:p.prix }; });
      const isDevis = i>=10;
      const header = {
        client_id: clientIds[i % clientIds.length],
        date_cmd: days(90 - i*6),
        type: isDevis ? 'Devis' : 'Commande',
        priorite: Math.random()>0.75 ? 'Urgente' : 'Normale',
        statut: isDevis ? 'Devis' : rnd(['En cours','En cours','Livré','Livré','Impayé']),
        observations: Math.random()>0.6 ? 'Client à rappeler avant expédition' : '',
      };
      const r = await API.saveCommande({ header, lignes }, user);
      commandes.push({ ...r, client_id: header.client_id, lignes });
    }

    // ---- Cotations (demandes de prix) avec offres, certaines choisies ----
    for (let i=0; i<8; i++) {
      const p = rnd(PIECES);
      const nbOffres = 2 + Math.floor(Math.random()*2);
      const offreFourns = [...fournIds].sort(()=>Math.random()-0.5).slice(0, nbOffres);
      const offres = offreFourns.map((fid, idx) => ({
        fournisseur_id: fid,
        prix: Math.round(p.prix*0.55*(0.85+Math.random()*0.4)),
        devise: rnd(['USD','EUR','MGA']),
        disponibilite: rnd(['En stock','Sur commande','En stock']),
        delai: rnd(['10j','15j','25j','30j','45j']),
        remarques: idx===0 ? 'Prix négociable en gros volume' : '',
      }));
      const { id } = await API.saveCotation({ header:{ designation:p.designation, reference:p.reference, quantite:5+Math.floor(Math.random()*20), statut:'En cours' }, offres }, user);
      if (Math.random()>0.3) {
        const cot = (await db.query('SELECT id FROM cotation_offres WHERE cotation_id=$1 ORDER BY prix ASC LIMIT 1', [id]))[0];
        if (cot) await API.choisirOffre(id, cot.id);
      }
    }

    // ---- Commandes fournisseur (regroupant des commandes clients) + réceptions ----
    const cmdFournisseurs = [];
    for (let i=0; i<6; i++) {
      const nbLignes = 2 + Math.floor(Math.random()*3);
      const lignes = Array.from({length:nbLignes}, () => { const p = rnd(PIECES); return { designation:p.designation, reference:p.reference, quantite:2+Math.floor(Math.random()*6), prix_unitaire:Math.round(p.prix*0.55) }; });
      const clientIdsForCf = commandes.filter(c=>c.numero).slice(i*2, i*2+2).map(c=>c.id);
      const header = {
        fournisseur_id: fournIds[i % fournIds.length],
        date_cmd: days(70 - i*8),
        devise: rnd(['USD','EUR','MGA']),
        statut: rnd(['Préparation','En transit','En transit','Livré']),
        conditions_paiement: rnd(['Comptant','30 jours','50% acompte']),
        observations:'',
      };
      const r = await API.saveCmdFournisseur({ header, lignes, client_ids: clientIdsForCf }, user);
      cmdFournisseurs.push({ ...r, statut: header.statut, lignes });
    }
    for (let i=0; i<5; i++) {
      const cf = cmdFournisseurs[i];
      if (!cf) continue;
      const complet = i<3;
      const lignesRec = cf.lignes.map(l => ({ designation:l.designation, reference:l.reference, quantite_commandee:l.quantite, quantite_recue: complet ? l.quantite : Math.max(0, l.quantite-1) }));
      await API.saveReception({ header:{ cmd_fournisseur_id: cf.id, date_reception: days(60-i*8), observations:'', frais:{ transport: 80000+Math.floor(Math.random()*120000), import: complet?60000:0, autres: 15000 } }, lignes: lignesRec }, user);
    }

    // ---- Factures + paiements ----
    for (let i=0; i<8; i++) {
      const cmd = commandes[i];
      if (!cmd || !cmd.lignes) continue;
      const lignesFacture = cmd.lignes.map(l => ({ designation:l.designation, reference:l.reference, quantite:l.quantite, prix_unitaire:l.prix_unitaire, cout_unitaire:Math.round(l.prix_unitaire*0.65) }));
      const statut = rnd(['Payée','Payée','Impayée','Partiellement payée']);
      const { id, numero } = await API.saveFacture({ header:{ client_id: cmd.client_id, commande_id: cmd.id, date_facture: days(80-i*7), statut } }, user);
      const totalFacture = lignesFacture.reduce((s,l)=>s+l.quantite*l.prix_unitaire,0);
      if (statut==='Payée') {
        await API.savePaiement({ type:'client', tiers_id:cmd.client_id, reference_doc:numero, montant:totalFacture, mode:rnd(['Espèces','Mvola','Virement']), date_paiement:days(75-i*7), statut:'Payé' }, user);
      } else if (statut==='Partiellement payée') {
        await API.savePaiement({ type:'client', tiers_id:cmd.client_id, reference_doc:numero, montant:Math.round(totalFacture*0.5), mode:'Mvola', date_paiement:days(70-i*7), statut:'Payé' }, user);
      }
    }
    // Paiements fournisseurs (échéances)
    for (let i=0; i<5; i++) {
      const cf = cmdFournisseurs[i];
      if (!cf) continue;
      const delai = rnd([0,30,45,60]);
      const echeance = new Date(); echeance.setDate(echeance.getDate() + (delai - (10+i*5)));
      await API.savePaiement({ type:'fournisseur', tiers_nom: fournisseursData[i % fournisseursData.length].nom, reference_doc: cf.numero, montant: 400000+Math.floor(Math.random()*800000), mode:rnd(['Virement','Chèque','Crédit']), echeance: echeance.toISOString().slice(0,10), statut: i<3 ? 'Payé' : 'En attente' }, user);
    }

    // ---- Expéditions ----
    const transports = ['Taxi-brousse','Transporteur','Retrait sur place'];
    for (let i=0; i<6; i++) {
      const cid = clientIds[i % clientIds.length];
      const cmdIds = commandes.filter(c=>c.client_id===cid).map(c=>c.id);
      if (!cmdIds.length) continue;
      await API.saveExpedition({ header:{ client_id:cid, transport:rnd(transports), date_exp:days(40-i*6), statut:rnd(['Préparée','Expédiée','Livrée']), no_colis:'COL-'+(2000+i*17), observations:'' }, commande_ids: cmdIds.slice(0,2) }, user);
    }

    await logEvent(uid, unom, 'Chargement des données de démonstration');
    return { ok:true };
  },

  // Réinitialisation : supprime toutes les données métier (clients, commandes, factures, ...).
  // Conserve les comptes utilisateurs et la configuration entreprise.
  resetData: async (user) => {
    const RESET_TABLES = BACKUP_TABLES.filter(t => t!=='utilisateurs' && t!=='config');
    const client = await db.getPool().connect();
    try {
      await client.query('BEGIN');
      await client.query('SET LOCAL session_replication_role = replica');
      for (const t of [...RESET_TABLES].reverse()) await client.query('DELETE FROM '+t);
      for (const t of RESET_TABLES) {
        if (t==='cmd_fourn_clients' || t==='expedition_commandes') continue;
        const seq = (await client.query(`SELECT pg_get_serial_sequence('${t}','id') AS s`)).rows[0];
        if (seq && seq.s) await client.query(`SELECT setval($1, 1, false)`, [seq.s]);
      }
      await client.query('COMMIT');
    } catch(e){ try{ await client.query('ROLLBACK'); }catch{} throw e; }
    finally { client.release(); }
    await logEvent(user?user.id:null, user?user.nom:null, 'Réinitialisation des données');
    return { ok:true };
  },

  // ---------- Import / Export ----------
  // Construit un fichier Excel à partir d'un tableau de lignes (objets) → renvoie du base64.
  // Le front le télécharge (voir src/lib/files.js).
  excelDepuisLignes: (rows, sheetName='Feuille1') => {
    const ws = XLSX.utils.json_to_sheet(rows && rows.length ? rows : [{}]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, String(sheetName).slice(0,31));
    return XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  },
  // Lit un fichier Excel envoyé par le front (Uint8Array/Array de bytes) → tableau d'objets.
  lireExcel: (bytes) => {
    const data = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes || []);
    const wb = XLSX.read(data, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(ws, { defval: '' });
  },
  // Import de lignes d'articles (pour pré-remplir une commande) : reconnait les colonnes courantes.
  lireArticlesExcel: (bytes) => {
    const data = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes || []);
    const wb = XLSX.read(data, { type: 'array' });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
    if (!rows.length) return [];
    const keys = Object.keys(rows[0]);
    const find = (re) => keys.find(k => k.toLowerCase().match(re)) || null;
    const kDes = find(/des|pi[eè]ce|article|produit|nom/);
    const kRef = find(/r[eé]f|code/);
    const kQte = find(/qt|qté|quantit/);
    const kPU  = find(/pu|prix|montant.?unit/);
    return rows.map(r => ({
      designation: kDes ? String(r[kDes]).trim() : '',
      reference:   kRef ? String(r[kRef]).trim() : '',
      quantite:    kQte ? (Number(String(r[kQte]).replace(/\s/g,'')) || 0) : 0,
      prix_unitaire: kPU ? (Number(String(r[kPU]).replace(/\s/g,'')) || 0) : 0,
    })).filter(l => l.designation || l.reference);
  },
};

module.exports = API;
