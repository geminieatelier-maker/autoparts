import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'

// Version lue depuis package.json et injectee dans l'app (affichage UI).
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)))

// base relative ('./') pour Electron (chargement file://).
// Pour redéployer la maquette sur GitHub Pages : vite build --base=/autoparts/
export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
})
