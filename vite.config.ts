import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // If the backend routes don't start with /api, maybe just proxy everything that isn't a static asset?
      // Looking at backend/src/index.ts, routes are mounted at root (e.g. /auth, /patient).
      // So I should proxy those specific paths or just proxy known prefixes.
      '/auth': 'http://localhost:3000',
      '/healthcare_professional': 'http://localhost:3000',
      '/measurement': 'http://localhost:3000',
      '/patient_k': 'http://localhost:3000',
      '/patient': 'http://localhost:3000',
      '/user': 'http://localhost:3000',
      '/hospital': 'http://localhost:3000',
      '/patient_treatment': 'http://localhost:3000',
      '/growth_Data': 'http://localhost:3000',
      '/static': 'http://localhost:3000',
      '/news': 'http://localhost:3000',
    }
  }
})
