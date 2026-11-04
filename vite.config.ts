import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';

// El repo se publica en https://<usuario>.github.io/mus-app/
const base = '/mus-app/';

// `--mode artifact`: un único HTML autocontenido (sin service worker) para la vista previa en claude.ai.
export default defineConfig(({ mode }) => ({
  base: mode === 'artifact' ? './' : base,
  build: mode === 'artifact' ? { outDir: 'dist-artifact', assetsInlineLimit: 100_000_000 } : undefined,
  plugins: [
    react(),
    ...(mode === 'artifact' ? [viteSingleFile()] : []),
    VitePWA({
      disable: mode === 'artifact',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Mus Eskola — Aprende a jugar al mus',
        short_name: 'Mus Eskola',
        description: 'Aprende a jugar al mus desde cero: lecciones, práctica y partidas contra bots.',
        lang: 'es',
        theme_color: '#1d4a33',
        background_color: '#f4ead7',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        navigateFallback: base + 'index.html',
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
}));
