import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served under https://mikhskaz.com/crisisandcanopy/ as part of the main
// personal-website build. `base` makes every asset URL and the runtime data
// fetches (import.meta.env.BASE_URL in src/lib/useData.js) resolve under that
// subpath. The build is emitted straight into the parent site's dist/ so a
// single static host serves both the portfolio and this app.
export default defineConfig({
  plugins: [react()],
  base: '/crisisandcanopy/',
  build: {
    outDir: '../../dist/crisisandcanopy',
    emptyOutDir: true,
  },
})
