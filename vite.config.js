import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' genera rutas relativas — funciona en GitHub Pages, Cloudflare Pages y cualquier subdirectorio
export default defineConfig({
  plugins: [react()],
  base: './',
})
