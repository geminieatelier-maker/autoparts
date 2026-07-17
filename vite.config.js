import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base relative ('./') pour Electron (chargement file://).
// Pour redéployer la maquette sur GitHub Pages : vite build --base=/autoparts/
export default defineConfig({
  plugins: [react()],
  base: './',
})
