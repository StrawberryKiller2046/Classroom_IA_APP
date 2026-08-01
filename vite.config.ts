import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'Classroom Activity Generator',
        short_name: 'Classroom AI',
        description:
          'Generate curriculum-aligned exams and quizzes in seconds, then grade them in class.',
        theme_color: '#4338ca',
        background_color: '#ffffff',
        display: 'standalone',
        // Relative paths so this resolves correctly whether the app is served
        // from a domain root or a subpath (e.g. a GitHub Pages project site).
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallbackDenylist: [/^\/functions\//],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
