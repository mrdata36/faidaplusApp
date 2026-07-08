import crypto from 'node:crypto'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Polyfill global.crypto for Node.js build environment
const webCrypto = crypto.webcrypto || crypto

if (typeof global !== 'undefined' && !global.crypto) {
  global.crypto = webCrypto
}

if (typeof globalThis !== 'undefined' && !globalThis.crypto) {
  globalThis.crypto = webCrypto
}

export default defineConfig({
  define: {
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
        description: 'Business management system',
        theme_color: '#1e40af',

        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
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