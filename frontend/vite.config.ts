import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'logo.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'MavunoTrust',
        short_name: 'MavunoTrust',
        description: 'Verified connections. Informed decisions. Fairer agricultural trade.',
        theme_color: '#0a2e1a',
        background_color: '#0a2e1a',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        icons: [
          { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
});
