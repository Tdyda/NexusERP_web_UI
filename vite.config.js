import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ['nexus.tablefoods.com'],
    port: 4173,             // upewnij się, że to Twój port
    host: '0.0.0.0',         // żeby akceptował spoza localhost
  },
})
