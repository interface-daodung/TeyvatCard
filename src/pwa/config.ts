import type { VitePWAOptions } from 'vite-plugin-pwa';
import { APP_BASE } from './base';

// Centralized PWA configuration for TeyvatCard.
// Paths are relative to APP_BASE so deploy works on GitHub Pages subpaths.
const bgColor = '#1a1a2e';

export const pwaOptions: VitePWAOptions = {
  injectRegister: 'auto',
  registerType: 'prompt',
  includeAssets: ['favicon.ico', 'icon-192.webp'],
  manifest: {
    name: 'Teyvat Card',
    short_name: 'TeyvatCard',
    description: 'Turn-based card combat game in Teyvat',
    theme_color: bgColor,
    background_color: bgColor,
    display: 'standalone',
    orientation: 'portrait',
    start_url: APP_BASE,
    scope: APP_BASE,
    id: APP_BASE,
    icons: [
      {
        src: 'favicon.ico',
        sizes: '32x32',
        type: 'image/x-icon',
        purpose: 'any',
      },
      {
        src: 'icon-192.webp',
        sizes: '192x192',
        type: 'image/webp',
        purpose: 'any',
      },
    ],
    screenshots: [
      {
        src: 'assets/images/ui/screenshots.webp',
        sizes: '720x1280',
        label: 'Teyvat Card',
        form_factor: 'wide',
      },
      {
        src: 'assets/images/ui/screenshots.webp',
        sizes: '720x1280',
        label: 'Teyvat Card',
        form_factor: 'narrow',
      },
    ],
  },
  workbox: {
    globPatterns: [
      '**/*.{js,css,html}',
      'assets/images/ui/**/*.{png,jpg,jpeg,webp,svg,json}',
    ],
    navigateFallback: 'index.html',
    runtimeCaching: [
      {
        // Match /TeyvatCard/assets/desktop/... and ./assets/desktop/...
        urlPattern: /\/assets\/(desktop|mobile)\//,
        handler: 'CacheFirst',
        options: {
          cacheName: 'tcg-variant-assets',
          expiration: {
            maxEntries: 1200,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
        },
      },
      {
        urlPattern: /\/assets\/sounds\//,
        handler: 'CacheFirst',
        options: {
          cacheName: 'tcg-sounds',
          expiration: {
            maxEntries: 300,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
        },
      },
    ],
    maximumFileSizeToCacheInBytes: 100 * 1024 * 1024,
  },
  minify: true,
  injectManifest: undefined,
  includeManifestIcons: true,
  disable: false,
  devOptions: {
    enabled: true,
  },
};
