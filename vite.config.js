import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import crypto from 'node:crypto'

// Polyfill global.crypto and globalThis.crypto for Node.js environments
const webCrypto = crypto.webcrypto || crypto;
if (typeof global !== 'undefined' && !global.crypto) {
  global.crypto = webCrypto;
}
if (typeof globalThis !== 'undefined' && !globalThis.crypto) {
  globalThis.crypto = webCrypto;
}

export default defineConfig({
  define: {
    // Some libraries expect 'global' to be defined in browser/build environments
    global: {},
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'FaidaPlus',
        short_name: 'FaidaPlus',
        description: 'Business management system for stores and retail operations',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    },
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {}
  }
})
