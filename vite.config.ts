import { defineConfig } from 'vite'

import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

import dotenv from 'dotenv'
dotenv.config({
  path: '.env.server'
})

const PORT = process.env.SERVER_PORT || 3002

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss()
  ],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: `http://localhost:${PORT}`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
