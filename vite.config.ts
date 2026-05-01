import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/AWS_Architecture_Simulator/',
  optimizeDeps: {
    include: ['jspdf', 'jspdf-autotable', 'html-to-image']
  }
})
