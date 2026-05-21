import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/lucid-frontend/' : '/lucid/',
  optimizeDeps: {
    include: ['html2pdf.js'],
  },
}))
