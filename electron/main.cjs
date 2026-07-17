// AUTOPARTS ERP — processus principal Electron.
// Réutilise le socle PostgreSQL portable fiabilisé de SALAMA (DLL complètes,
// port dynamique, démarrage sans blocage, sauvegarde auto, anti-crash).
const { app, BrowserWindow, dialog, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const net = require('net');
const { spawnSync } = require('child_process');

if (!app.requestSingleInstanceLock()) { app.quit(); process.exit(0); }
const isDev = !app.isPackaged;

function findBinPath(){
  const c = [
    path.join(process.resourcesPath || '', 'pg-portable', 'bin'),
    path.join(__dirname, '..', 'pg-portable', 'bin'),
  ];
  for (const p of c) { try { if (fs.existsSync(path.join(p,'initdb.exe'))) return p; } catch {} }
  return c[0];
}
const binPath  = findBinPath();
const dataPath = path.join(app.getPath('userData'), 'pg-data');
const logPath  = path.join(app.getPath('userData'), 'postgres.log');
const appLog   = path.join(app.getPath('userData'), 'autoparts.log');
const PORT_BASE = 54330;
let pgPort = PORT_BASE;
let mainWindow = null;

function ensureDir(p){ if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }
function log(m){ try { ensureDir(path.dirname(appLog)); fs.appendFileSync(appLog, new Date().toISOString()+' '+m+'\n'); } catch {} console.log(m); }

// Filet anti-crash : une erreur imprévue ne doit jamais fermer l'app.
process.on('uncaughtException', (e)=>{ try { log('[UNCAUGHT] '+(e&&e.stack||e)); } catch {} });
process.on('unhandledRejection', (e)=>{ try { log('[UNHANDLED] '+(e&&e.stack||e)); } catch {} });

function killOurStalePostgres(){
  try {
    const pf = path.join(dataPath,'postmaster.pid');
    if (!fs.existsSync(pf)) return;
    const pid = parseInt(fs.readFileSync(pf,'utf8').split('\n')[0].trim(),10);
    if (!pid) return;
    require('child_process').execSync('taskkill /F /T /PID '+pid, { stdio:'ignore', windowsHide:true });
    log('Ancien cluster postgres arrêté (PID '+pid+')');
  } catch {}
}
function cleanPid(){ ['postmaster.pid','postmaster.opts'].forEach(f=>{ const p=path.join(dataPath,f); if (fs.existsSync(p)) try{ fs.unlinkSync(p); }catch{} }); }

function ensureData(){
  const vf = path.join(dataPath,'PG_VERSION');
  if (!fs.existsSync(vf)) {
    try {
      if (fs.existsSync(dataPath) && fs.readdirSync(dataPath).length>0) {
        const aside = path.join(app.getPath('userData'),'pg-data-invalide-'+Date.now());
        fs.renameSync(dataPath, aside); log('Dossier data invalide mis de côté : '+aside);
      }
    } catch(e){ log('[ensureData] '+e.message); }
    ensureDir(dataPath);
    const initdb = path.join(binPath,'initdb.exe');
    if (!fs.existsSync(initdb)) throw new Error('initdb.exe introuvable : '+binPath);
    log('RUN initdb');
    const r = spawnSync(initdb, ['-D',dataPath,'-U','postgres','-A','trust','--no-locale','--encoding=UTF8'], { timeout:120000, windowsHide:true, encoding:'utf8' });
    if (r.status!==0) throw new Error('initdb échoué : '+(r.stderr||r.stdout||''));
    log('InitDB OK');
  }
}

function dailyBackup(){
  try {
    if (!fs.existsSync(path.join(dataPath,'PG_VERSION'))) return;
    const dir = path.join(app.getPath('userData'),'backups'); ensureDir(dir);
    const day = new Date().toISOString().slice(0,10).replace(/-/g,'');
    const dest = path.join(dir,'pg-data-'+day);
    if (fs.existsSync(dest)) return;
    const tmp = dest+'.tmp'; try{ fs.rmSync(tmp,{recursive:true,force:true}); }catch{}
    fs.cpSync(dataPath, tmp, { recursive:true }); fs.renameSync(tmp, dest);
    log('Sauvegarde du jour : '+dest);
    const b = fs.readdirSync(dir).filter(f=>/^pg-data-\d{8}$/.test(f)).sort();
    while (b.length>7){ const o=b.shift(); try{ fs.rmSync(path.join(dir,o),{recursive:true,force:true}); }catch{} }
  } catch(e){ log('[BACKUP] '+e.message); }
}

function portReady(port){
  return new Promise(res=>{
    const s=new net.Socket(); let done=false;
    const fin=ok=>{ if(!done){done=true;s.destroy();res(ok);} };
    s.setTimeout(600); s.once('connect',()=>fin(true)); s.once('timeout',()=>fin(false)); s.once('error',()=>fin(false));
    s.connect(port,'127.0.0.1');
  });
}
async function pickFreePort(){ for(let p=PORT_BASE;p<PORT_BASE+15;p++){ if(!(await portReady(p))) return p; } throw new Error('Aucun port libre'); }

async function startPostgres(){
  ensureDir(path.dirname(logPath));
  killOurStalePostgres(); cleanPid();
  pgPort = await pickFreePort();
  process.env.SALAMA_DB_PORT = String(pgPort); // db.cjs/config lisent cette variable
  ensureData();
  dailyBackup();
  const pgCtl = path.join(binPath,'pg_ctl.exe');
  if (!fs.existsSync(pgCtl)) throw new Error('pg_ctl.exe introuvable');
  try { if (fs.existsSync(logPath) && fs.statSync(logPath).size>5*1024*1024) fs.truncateSync(logPath,0); } catch {}
  log('Start port '+pgPort);
  // stdio:'ignore' CRUCIAL (sinon spawnSync attend que postgres ferme le tube → blocage 15s).
  // -c en ligne de commande = écrase postgresql.conf (robuste même si le fichier est abîmé).
  const opts = `-p ${pgPort} -c listen_addresses=127.0.0.1 -c unix_socket_directories=`;
  const r = spawnSync(pgCtl, ['-D',dataPath,'-o',opts,'-l',logPath,'start'], { timeout:15000, windowsHide:true, stdio:'ignore' });
  if (r.error && r.error.code!=='ETIMEDOUT') throw new Error('pg_ctl start : '+r.error.code);
  for (let i=0;i<40;i++){ if (await portReady(pgPort)){ log('Postgres prêt sur '+pgPort); return; } await new Promise(r=>setTimeout(r,500)); }
  throw new Error('PostgreSQL n\'a pas démarré (timeout)');
}
function stopSync(){ try{ const p=path.join(binPath,'pg_ctl.exe'); if(fs.existsSync(p)) spawnSync(p,['-D',dataPath,'stop','-m','fast','-w','-t','10'],{timeout:12000,windowsHide:true}); }catch{} }

// ---------- Mise à jour automatique ----------
// Vérifie une nouvelle version sur GitHub Releases (dépôt public) au démarrage.
// Totalement silencieux si pas d'internet : l'app continue de fonctionner hors ligne normalement.
function setupAutoUpdate(){
  if (isDev) return;
  let updater;
  try { updater = require('electron-updater').autoUpdater; } catch(e){ log('[UPDATE] module indisponible : '+e.message); return; }
  updater.autoDownload = true;
  updater.autoInstallOnAppQuit = true;
  updater.on('error', (e)=> log('[UPDATE] erreur (ignorée, app continue hors ligne) : '+(e&&e.message||e)));
  updater.on('update-available', (info)=> log('[UPDATE] nouvelle version disponible : '+info.version));
  updater.on('update-not-available', ()=> log('[UPDATE] déjà à jour'));
  updater.on('update-downloaded', (info)=>{
    log('[UPDATE] téléchargée : '+info.version);
    if (!mainWindow) return;
    dialog.showMessageBox(mainWindow, {
      type:'info', buttons:['Redémarrer maintenant','Plus tard'], defaultId:0, cancelId:1,
      title:'Mise à jour ABS Store',
      message:'Une nouvelle version ('+info.version+') a été téléchargée.',
      detail:'Redémarrez l\'application pour l\'installer. Vos données ne sont pas affectées.'
    }).then(r => { if (r.response===0){ stopSync(); updater.quitAndInstall(false, true); } });
  });
  try { updater.checkForUpdates().catch(e=>log('[UPDATE] check échoué (probablement hors ligne) : '+e.message)); }
  catch(e){ log('[UPDATE] '+e.message); }
}

function createWindow(){
  mainWindow = new BrowserWindow({
    width:1360, height:860, minWidth:1024, minHeight:700,
    title:'ABS STORE — Pièces autos', backgroundColor:'#0f172a', show:false,
    icon: path.join(__dirname,'..','build','icon.png'),
    webPreferences:{ preload: path.join(__dirname,'preload.cjs'), contextIsolation:true, nodeIntegration:false, sandbox:false }
  });
  const wc = mainWindow.webContents;
  wc.on('preload-error',(e,p,err)=>log('[PRELOAD-ERROR] '+p+' :: '+(err&&err.stack||err)));
  wc.on('did-fail-load',(e,c,d,u)=>log('[DID-FAIL-LOAD] '+c+' '+d+' '+u));
  mainWindow.once('ready-to-show',()=>mainWindow.show());
  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_URL || 'http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname,'..','dist','index.html'));
  }
}

app.whenReady().then(async ()=>{
  try { await startPostgres(); }
  catch(e){ log('FATAL PG '+e.message); dialog.showErrorBox('AUTOPARTS — Base de données', 'Erreur PostgreSQL :\n\n'+e.message+'\n\nLog : '+logPath); try{ shell.openPath(logPath); }catch{} app.quit(); return; }
  try { const db = require('./db.cjs'); await db.init(); log('db.init OK'); }
  catch(e){ log('FATAL INIT '+(e&&e.stack||e.message)); dialog.showErrorBox('AUTOPARTS — Initialisation', 'Erreur d\'initialisation :\n\n'+e.message); try{ shell.openPath(appLog); }catch{} app.quit(); return; }
  createWindow();
  setupAutoUpdate();
});
let quitting=false;
app.on('before-quit',(e)=>{ if(quitting) return; e.preventDefault(); quitting=true; stopSync(); app.quit(); });
app.on('window-all-closed',()=>{ if(process.platform!=='darwin') app.quit(); });
