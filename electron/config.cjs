const fs = require('fs');
const os = require('os');
const path = require('path');

let electronApp = null;
try {
  const electron = require('electron');
  if (electron && typeof electron === 'object' && electron.app) electronApp = electron.app;
} catch {}

function userDataDir() {
  if (electronApp) return electronApp.getPath('userData');
  const base = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  return path.join(base, 'autoparts');
}

function appRoot() {
  return path.join(__dirname, '..');
}

function exeDir() {
  try {
    return path.dirname(process.execPath);
  } catch {
    return appRoot();
  }
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function candidatePaths(name) {
  return uniq([
    path.join(userDataDir(), name),
    path.join(exeDir(), name),
    path.join(process.cwd(), name),
    path.join(appRoot(), name),
  ]);
}

function parseEnvText(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function readEnvFiles() {
  const out = {};
  for (const file of candidatePaths('.env').reverse()) {
    if (!fs.existsSync(file)) continue;
    Object.assign(out, parseEnvText(fs.readFileSync(file, 'utf8')));
  }
  return out;
}

function flattenJson(prefix, value, out) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  for (const [key, child] of Object.entries(value)) {
    const next = prefix ? prefix + '_' + key.toUpperCase() : key.toUpperCase();
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      flattenJson(next, child, out);
      continue;
    }
    out[next] = child;
  }
}

function readJsonFiles() {
  const out = {};
  for (const file of candidatePaths('salama.config.json').reverse()) {
    if (!fs.existsSync(file)) continue;
    try {
      const json = JSON.parse(fs.readFileSync(file, 'utf8'));
      flattenJson('', json, out);
    } catch {}
  }
  return out;
}

const fileEnv = readEnvFiles();
const fileJson = readJsonFiles();

function getRaw(key, fallback = '') {
  const env = process.env[key];
  if (env !== undefined && env !== null && String(env).trim() !== '') return String(env).trim();
  if (fileEnv[key] !== undefined && String(fileEnv[key]).trim() !== '') return String(fileEnv[key]).trim();
  if (fileJson[key] !== undefined && String(fileJson[key]).trim() !== '') return String(fileJson[key]).trim();
  return fallback;
}

function asBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
  return fallback;
}

function isLocalHost(host) {
  const normalized = String(host || '').trim().toLowerCase();
  return !normalized ||
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized === '0.0.0.0';
}

function firstClientUrlFromFile() {
  for (const file of candidatePaths('salama-client-url.txt')) {
    if (!fs.existsSync(file)) continue;
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      return trimmed;
    }
  }
  return '';
}

function normalizeUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : ('http://' + trimmed);
  return withProto.replace(/\/+$/, '');
}

function getClientUrl() {
  return normalizeUrl(getRaw('SALAMA_CLIENT_URL', '') || firstClientUrlFromFile());
}

function getDbConfig() {
  const connectionString = getRaw('DATABASE_URL', '') || getRaw('SALAMA_DB_URL', '');
  const sslEnabled = asBool(getRaw('SALAMA_DB_SSL', ''), false) ||
    ['require', 'prefer', 'verify-ca', 'verify-full'].includes(getRaw('PGSSLMODE', '').toLowerCase());
  const ssl = sslEnabled ? { rejectUnauthorized: false } : undefined;
  if (connectionString) {
    return {
      connectionString,
      ssl,
      host: '',
      port: 0,
      database: '',
      user: '',
      password: '',
    };
  }
  return {
    host: getRaw('SALAMA_DB_HOST', 'localhost'),
    port: Number(getRaw('SALAMA_DB_PORT', '54321')),
    database: getRaw('SALAMA_DB_NAME', 'autoparts'),
    user: getRaw('SALAMA_DB_USER', 'postgres'),
    password: getRaw('SALAMA_DB_PASSWORD', 'salama'),
    ssl,
  };
}

function getWebConfig() {
  return {
    host: getRaw('SALAMA_WEB_HOST', '0.0.0.0'),
    port: Number(getRaw('PORT', getRaw('SALAMA_WEB_PORT', '8787'))),
  };
}

function isClientMode() {
  return !!getClientUrl();
}

function useExternalDb(options = {}) {
  const ignoreClientMode = !!options.ignoreClientMode;
  if (!ignoreClientMode && isClientMode()) return false;
  if (asBool(getRaw('SALAMA_USE_EXTERNAL_DB', ''), false)) return true;
  if (asBool(getRaw('SALAMA_DISABLE_EMBEDDED_PG', ''), false)) return true;
  return !isLocalHost(getDbConfig().host);
}

function useEmbeddedPg(options = {}) {
  const ignoreClientMode = !!options.ignoreClientMode;
  return (ignoreClientMode || !isClientMode()) && !useExternalDb(options);
}

module.exports = {
  userDataDir,
  candidatePaths,
  getRaw,
  getClientUrl,
  getDbConfig,
  getWebConfig,
  isClientMode,
  useExternalDb,
  useEmbeddedPg,
  isLocalHost,
};
