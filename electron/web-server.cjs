// AUTOPARTS ERP — version WEB.
// Démarre PostgreSQL portable, sert l'app React (dist/) et expose l'API en HTTP.
// Lancer : npm run web   → puis ouvrir http://localhost:8790 (ou l'IP réseau affichée).
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');
const { spawnSync } = require('child_process');
const db = require('./db.cjs');
const API = require('./api.cjs');

const PORT = Number(process.env.PORT || 8790);
const PG_PORT_BASE = 54330;
const USERDATA = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'autoparts');
const DATA = path.join(USERDATA, 'pg-data');
const LOG = path.join(USERDATA, 'postgres.log');
const DIST = path.join(__dirname, '..', 'dist');
let pgPort = PG_PORT_BASE;

function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p,{recursive:true}); }
function binPath(){
  for(const c of [path.join(process.resourcesPath||'','pg-portable','bin'), path.join(__dirname,'..','pg-portable','bin')])
    if(fs.existsSync(path.join(c,'initdb.exe'))) return c;
  return path.join(__dirname,'..','pg-portable','bin');
}
function portReady(port){ return new Promise(r=>{const s=new net.Socket();let d=0;const f=o=>{if(!d){d=1;s.destroy();r(o)}};s.setTimeout(600);s.once('connect',()=>f(true));s.once('timeout',()=>f(false));s.once('error',()=>f(false));s.connect(port,'127.0.0.1')}) }

async function startPg(){
  ensureDir(USERDATA);
  // Si PostgreSQL tourne déjà sur le port de base (app desktop ouverte), on le réutilise.
  if(await portReady(PG_PORT_BASE)){ pgPort=PG_PORT_BASE; process.env.SALAMA_DB_PORT=String(pgPort); console.log('PostgreSQL déjà actif, réutilisé sur '+pgPort); return; }
  const BIN = binPath();
  // arrêt d'un cluster résiduel
  try{ const pf=path.join(DATA,'postmaster.pid'); if(fs.existsSync(pf)){ const pid=parseInt(fs.readFileSync(pf,'utf8').split('\n')[0],10); if(pid) require('child_process').execSync('taskkill /F /T /PID '+pid,{stdio:'ignore'}); } }catch{}
  ['postmaster.pid','postmaster.opts'].forEach(f=>{ try{ fs.unlinkSync(path.join(DATA,f)); }catch{} });
  for(let p=PG_PORT_BASE;p<PG_PORT_BASE+15;p++){ if(!(await portReady(p))){ pgPort=p; break; } }
  process.env.SALAMA_DB_PORT = String(pgPort);
  if(!fs.existsSync(path.join(DATA,'PG_VERSION'))){
    ensureDir(DATA);
    const r=spawnSync(path.join(BIN,'initdb.exe'),['-D',DATA,'-U','postgres','-A','trust','--no-locale','--encoding=UTF8'],{timeout:120000,windowsHide:true});
    if(r.status!==0) throw new Error('initdb échoué');
  }
  spawnSync(path.join(BIN,'pg_ctl.exe'),['-D',DATA,'-o',`-p ${pgPort} -c listen_addresses=127.0.0.1 -c unix_socket_directories=`,'-l',LOG,'start'],{timeout:15000,windowsHide:true,stdio:'ignore'});
  for(let i=0;i<40;i++){ if(await portReady(pgPort)){ console.log('PostgreSQL prêt sur '+pgPort); return; } await new Promise(r=>setTimeout(r,500)); }
  throw new Error('PostgreSQL n\'a pas démarré');
}

const MIME={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.json':'application/json','.woff':'font/woff','.woff2':'font/woff2'};
function localIps(){ const o=[]; for(const l of Object.values(os.networkInterfaces())) for(const it of l||[]) if(it.family==='IPv4'&&!it.internal) o.push(it.address); return o; }
function readBody(req){ return new Promise((res,rej)=>{ let b=''; req.on('data',c=>{ b+=c; if(b.length>25*1024*1024){ rej(new Error('Requête trop volumineuse')); req.destroy(); } }); req.on('end',()=>res(b?JSON.parse(b):{})); req.on('error',rej); }); }

async function main(){
  await startPg();
  await db.init();
  console.log('Base initialisée.');

  const server = http.createServer(async (req,res)=>{
    const url = new URL(req.url,'http://x');
    // API
    if(req.method==='POST' && url.pathname.startsWith('/api/')){
      const name = decodeURIComponent(url.pathname.slice(5));
      res.setHeader('Content-Type','application/json; charset=utf-8');
      if(typeof API[name] !== 'function'){ res.writeHead(404); return res.end(JSON.stringify({ok:false,error:'Fonction inconnue'})); }
      try{
        const body = await readBody(req);
        const result = await API[name](...(body.args||[]));
        res.writeHead(200); res.end(JSON.stringify({ok:true,result}));
      }catch(e){ res.writeHead(500); res.end(JSON.stringify({ok:false,error:e.message||String(e)})); }
      return;
    }
    // fichiers statiques (dist), fallback SPA -> index.html
    let file = decodeURIComponent(url.pathname);
    if(file==='/'||file==='') file='/index.html';
    let full = path.join(DIST, file);
    if(!full.startsWith(DIST) || !fs.existsSync(full) || !fs.statSync(full).isFile()) full = path.join(DIST,'index.html');
    res.setHeader('Content-Type', MIME[path.extname(full).toLowerCase()]||'application/octet-stream');
    res.writeHead(200); res.end(fs.readFileSync(full));
  });

  server.listen(PORT,'0.0.0.0',()=>{
    console.log('\n=== AUTOPARTS ERP — version web prête ===');
    console.log('  Local   : http://localhost:'+PORT);
    for(const ip of localIps()) console.log('  Réseau  : http://'+ip+':'+PORT);
    console.log('  (Ctrl+C pour arrêter)\n');
  });
  const stop=()=>{ try{ spawnSync(path.join(binPath(),'pg_ctl.exe'),['-D',DATA,'stop','-m','fast'],{timeout:8000,windowsHide:true}); }catch{} process.exit(0); };
  process.on('SIGINT',stop); process.on('SIGTERM',stop);
}
main().catch(e=>{ console.error('Erreur démarrage web :', e.message); process.exit(1); });
