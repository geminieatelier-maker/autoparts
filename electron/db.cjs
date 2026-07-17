// Connexion PostgreSQL locale + initialisation du schéma (AUTOPARTS ERP).
const { Pool, Client } = require('pg');
const fs = require('fs');
const path = require('path');
const config = require('./config.cjs');

let pool = null, poolKey = '';
function cfgKey(c){ return [c.host,c.port,c.database,c.user,c.password].join('|'); }
function getPool(){
  const c = config.getDbConfig();
  const k = cfgKey(c);
  if (pool && poolKey === k) return pool;
  if (pool) { try { pool.end().catch(()=>{}); } catch {} }
  pool = new Pool({ ...c, max: 10 });
  poolKey = k;
  pool.on('error', (e)=>console.error('[AUTOPARTS DB pool]', e && e.message));
  return pool;
}
async function query(text, params){ return (await getPool().query(text, params)).rows; }

async function ensureDatabase(){
  const c = config.getDbConfig();
  if (config.useExternalDb()) return;       // mode client : la base est sur le serveur
  const admin = new Client({ ...c, database: 'postgres' });
  admin.on('error', ()=>{});
  await admin.connect();
  try {
    const r = await admin.query('SELECT 1 FROM pg_database WHERE datname=$1', [c.database]);
    if (r.rowCount === 0) await admin.query('CREATE DATABASE ' + admin.escapeIdentifier(c.database));
  } finally { await admin.end(); }
}

async function init(){
  await ensureDatabase();
  const schemaPath = path.join(__dirname, '..', 'schema.sql');
  await getPool().query(fs.readFileSync(schemaPath, 'utf8'));

  const bcrypt = require('bcryptjs');
  const admins = await query('SELECT id FROM utilisateurs LIMIT 1');
  const baseFraiche = admins.length === 0;
  let adminUser = null;
  if (baseFraiche) {
    const r = await query("INSERT INTO utilisateurs (nom, login, mdp_hash, role) VALUES ($1,$2,$3,'admin') RETURNING id, nom",
      ['Administrateur', 'admin', bcrypt.hashSync('admin', 10)]);
    adminUser = r[0];
  }
  const cfg = await query('SELECT id FROM config WHERE id=1');
  if (cfg.length === 0) {
    await query("INSERT INTO config (id, nom, devise) VALUES (1, $1, 'MGA')", ['ABS STORE PIECES AUTOS']);
  }
  // Clé IA — injectée automatiquement, jamais affichée dans l'interface.
  // Chargée depuis un fichier local non versionné (voir electron/groq-key.local.cjs, exclu par .gitignore).
  let groqKey = '';
  try { groqKey = require('./groq-key.local.cjs'); } catch { console.warn('[AUTOPARTS] groq-key.local.cjs introuvable — module IA désactivé.'); }
  if (groqKey) await query("UPDATE config SET grok_key=$1, grok_model='llama-3.3-70b-versatile' WHERE id=1", [groqKey]);

  // Base fraîchement créée (première installation) : on la peuple avec des données
  // de démonstration pour que le client puisse tester tous les modules immédiatement.
  // Ne s'exécute jamais sur une base déjà utilisée (ex. après une réinitialisation).
  if (baseFraiche) {
    try { await require('./api.cjs').seedDemoData(adminUser); }
    catch (e) { console.warn('[AUTOPARTS] seedDemoData ignoré :', e.message); }
  }
}

module.exports = { getPool, query, init };
