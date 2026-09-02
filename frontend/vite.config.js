import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Dev proxy → lokal tanpa CORS saat integrasi Apps Script
    proxy: {
      '/api': {
        target: 'https://script.google.com/macros/s/AKfycbw1r71lZLHn8SiB8va2bx_Lw7QA-qxZVNV-q6JzhXhW-Y_hPmG7pcmLL3A6a34giRXc3A',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/exec'),
      },
    },
  },
})