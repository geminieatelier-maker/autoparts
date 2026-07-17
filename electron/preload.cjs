const { contextBridge } = require('electron');
const API = require('./api.cjs');
contextBridge.exposeInMainWorld('API', API);
