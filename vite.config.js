import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://issb-ppdt-api.icyglacier-8bd82619.centralindia.azurecontainerapps.io',
        changeOrigin: true,
        secure: true,
        headers: {
          Origin: 'http://localhost:3000',
        },
      },
    },
  },
  preview: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://issb-ppdt-api.icyglacier-8bd82619.centralindia.azurecontainerapps.io',
        changeOrigin: true,
        secure: true,
        headers: {
          Origin: 'http://localhost:3000',
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
