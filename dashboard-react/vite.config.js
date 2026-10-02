import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// the production build is served by GitHub Pages under /hhe-labsardinia/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/hhe-labsardinia/' : '/',
  plugins: [react()],
}))
