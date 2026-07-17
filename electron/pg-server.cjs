// src/pg-server.js - VERSION CORRIGEE postmaster.pid + asar + port .env
const path = require('path');
const fs = require('fs');
const os = require('os');
const net = require('net');
const { spawnSync, spawn } = require('child_process');
const { Client } = require('pg');

let selectedPort = null;
let currentMode = null;
let runtimeLogFile = null;
const PG_PWD = 'salama';
const MAX_PORT_ATTEMPTS = 12;

function getApp() {
  try { return require('electron').app; } catch { return null; }
}

function userDataDir() {
  const app = getApp();
  if (app) {
    try { const p = app.getPath('userData'); if (p) return p; } catch {}
  }
  const base = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  return path.join(base, 'SALAMA');
}

function exeDir() {
  try { return path.dirname(process.execPath); } catch { return path.join(__dirname, '..'); }
}

function pgRoot() {
  const res = process.resourcesPath || '';
  const candidates = [
    path.join(res, 'pg-portable'),
    path.join(res, 'app.asar.unpacked', 'pg-portable'),
    path.join(exeDir(), 'resources', 'pg-portable'),
    path.join(exeDir(), 'resources', 'app.asar.unpacked', 'pg-portable'),
    path.join(__dirname, '..', 'pg-portable'),
    path.join(__dirname, '..', '..', 'pg-portable'),
  ].filter(Boolean);
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return path.join(__dirname, '..', 'pg-portable');
}

function bin(name) {
  const exe = process.platform === 'win32' ? name + '.exe' : name;
  return path.join(pgRoot(), 'bin', exe);
}

function dataDir() { return path.join(userDataDir(), 'pgdata'); }

function logPath() {
  if (runtimeLogFile) return runtimeLogFile;
  runtimeLogFile = path.join(userDataDir(), `pg-${Date.now()}.log`);
  return runtimeLogFile;
}

function getCfgPort() {
  try {
    const cfg = require('./config').getDbConfig();
    if (cfg && cfg.port) return Number(cfg.port);
  } catch {}
  return Number(process.env.SALAMA_DB_PORT || 5433);
}

function getPgPort() { return selectedPort || getCfgPort(); }
function setPgPort(p) { selectedPort = Number(p); process.env.SALAMA_DB_PORT = String(p); }

function ensurePgTools() {
  const missing = ['initdb','pg_ctl','postgres'].map(n=>bin(n)).filter(f=>!fs.existsSync(f));
  if (missing.length) throw new Error(`pg-portable introuvable dans ${pgRoot()} - Manque: ${missing.join(', ')}`);
}

function portOpen(port) {
  return new Promise(res=>{
    const s=new net.Socket(); let done=false;
    const fin=ok=>{ if(!done){done=true; s.destroy(); res(ok);} };
    s.setTimeout(800);
    s.once('connect',()=>fin(true));
    s.once('timeout',()=>fin(false));
    s.once('error',()=>fin(false));
    s.connect(port,'127.0.0.1');
  });
}

async function canAccept(port){
  const c=new Client({host:'127.0.0.1',port,database:'postgres',user:'postgres',password:PG_PWD,connectionTimeoutMillis:1500});
  c.on('error',()=>{});
  try{ await c.connect(); return true; }catch{ return false; }finally{ try{await c.end();}catch{} }
}

async function clearStalePidFile(){
  const pidFile=path.join(dataDir(),'postmaster.pid');
  const optsFile=path.join(dataDir(),'postmaster.opts');
  if(!fs.existsSync(pidFile)) return false;
  const isOpen = await portOpen(getPgPort());
  if(!isOpen){ try{fs.unlinkSync(pidFile);}catch{} try{fs.unlinkSync(optsFile);}catch{} return true; }
  try{
    const pid=Number(fs.readFileSync(pidFile,'utf8').split('\n')[0].trim());
    if(!pid) throw new Error('no pid');
    process.kill(pid,0);
    return false;
  }catch{ try{fs.unlinkSync(pidFile);}catch{} try{fs.unlinkSync(optsFile);}catch{} return true; }
}

async function findUsablePort(){
  const start=getCfgPort();
  for(let i=0;i<MAX_PORT_ATTEMPTS;i++){
    const p=start+i;
    if(!(await portOpen(p))) return {port:p,mode:'free'};
    if(await canAccept(p)) return {port:p,mode:'external'};
  }
  throw new Error(`Aucun port libre entre ${start} et ${start+MAX_PORT_ATTEMPTS-1}`);
}

function initdb(){
  ensurePgTools();
  const dir=dataDir();
  fs.mkdirSync(dir,{recursive:true});
  if(fs.existsSync(path.join(dir,'PG_VERSION'))) return;
  if(fs.existsSync(dir) && fs.readdirSync(dir).length>0){
    const bak=path.join(userDataDir(),'pgdata-bak-'+Date.now());
    fs.renameSync(dir,bak);
    fs.mkdirSync(dir,{recursive:true});
  }
  const pw=path.join(userDataDir(),'pgpw.tmp');
  fs.writeFileSync(pw,PG_PWD);
  const r=spawnSync(bin('initdb'),['-D',dir,'-U','postgres','-A','scram-sha-256','--pwfile='+pw,'-E','UTF8','--locale=C'],{stdio:'pipe'});
  try{fs.unlinkSync(pw);}catch{}
  if(r.status!==0) throw new Error((r.stderr||r.stdout||'').toString());
}

function start(){
  ensurePgTools();
  fs.mkdirSync(userDataDir(),{recursive:true});
  try{ fs.writeFileSync(logPath(),'',{flag:'a'}); }catch{}
  const r=spawnSync(bin('pg_ctl'),['-D',dataDir(),'-o',`-p ${getPgPort()}`,'-l',logPath(),'start','-w','-t','20'],{stdio:'pipe'});
  if(r.status===0) return;
  const txt=((r.stderr||'')+''+(r.stdout||'')).toString();
  if(!/restricted token|code 87|EPERM/i.test(txt)) throw new Error(txt||'pg_ctl start echoue');
  const fd=fs.openSync(logPath(),'a');
  const child=spawn(bin('postgres'),['-D',dataDir(),'-p',String(getPgPort())],{detached:true,windowsHide:true,stdio:['ignore',fd,fd],env:{...process.env,PGPASSWORD:PG_PWD}});
  child.unref();
  try{fs.closeSync(fd);}catch{}
}

function stop(){ try{spawnSync(bin('pg_ctl'),['-D',dataDir(),'stop','-m','fast','-w','-t','10'],{stdio:'ignore'});}catch{} }

async function ensureRunning(){
  const chosen=await findUsablePort();
  setPgPort(chosen.port);
  if(chosen.mode==='external'){ currentMode='external'; return {mode:'external',port:chosen.port}; }
  if(!fs.existsSync(path.join(dataDir(),'PG_VERSION'))) initdb();
  await clearStalePidFile();
  try{ start(); }catch(e){ await clearStalePidFile(); start(); }
  for(let i=0;i<20;i++){
    if(await canAccept(getPgPort())){ currentMode='embedded'; return {mode:'embedded',port:getPgPort()}; }
    await new Promise(r=>setTimeout(r,300));
  }
  throw new Error(`PostgreSQL n'a pas demarre. Port ${getPgPort()} Log: ${logPath()}`);
}

module.exports={ensureRunning,stop,getPgPort,setPgPort,getMode:()=>currentMode,PG_PWD};