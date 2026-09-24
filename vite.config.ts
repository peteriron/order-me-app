/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Served from GitHub Pages at https://peteriron.github.io/order-me-app/
const BASE = '/order-me-app/'

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      // Register with a plain script. The new service worker takes over as soon as it installs (skipWaiting +
      // clientsClaim) but never reloads the open page: everything is saved on every tap, and a surprise reload
      // while the bartender reads the Counter view would be worse than running the old version a little longer.
      // The next launch after a deploy gets the new version.
      injectRegister: 'script-defer',
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        id: BASE,
        name: 'This round is for me',
        short_name: 'OrderMe',
        description: "Collect your friends' drink and snack requests and read the Round out at the counter.",
        lang: 'en',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#0e0e10',
        background_color: '#0e0e10',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
  },
})
