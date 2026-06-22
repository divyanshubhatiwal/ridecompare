import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'favicon.ico'],
      manifest: {
        name: 'RideCompare — Compare Ride Prices',
        short_name: 'RideCompare',
        description: 'Compare Uber, Ola, Rapido & Namma Yatri prices instantly',
        theme_color: '#6366F1',
        background_color: '#0A0A0F',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/home',
        scope: '/',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
        categories: ['travel', 'navigation', 'utilities'],
        shortcuts: [
          {
            name: 'Find a Ride',
            short_name: 'Find Ride',
            description: 'Search and compare rides',
            url: '/home',
            icons: [{ src: '/icon.svg', sizes: 'any' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^http:\/\/.*\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 300 },
            },
          },
        ],
      },
      devOptions: { enabled: true },
    }),
  ],
  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
