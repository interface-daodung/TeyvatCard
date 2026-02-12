import type { VitePWAOptions } from 'vite-plugin-pwa';

// Centralized PWA configuration for TeyvatCard.
// This file is imported from vite.config.ts so all PWA-related
// options are in one place for easier debugging and tweaking.
export const pwaOptions: VitePWAOptions = {
  // how the service worker register script is injected
  injectRegister: 'auto',
  // general behavior
  registerType: 'prompt',
  includeAssets: [
    'icon-192.png',
    'icon-512.png',
    'apple-touch-icon.png',
  ],
  manifest: {
    name: 'Teyvat Card',
    short_name: 'TeyvatCard',
    description: 'Turn-based card combat game in Teyvat',
    theme_color: '#000000',
    background_color: '#000000',
    display: 'standalone',
    orientation: 'portrait',
    start_url: '/',
    icons: [
      {
        src: 'icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
  workbox: {
    // Cache static game assets (JS/CSS/HTML and Phaser assets).
    globPatterns: [
      '**/*.{js,css,html}',
      'assets/**/*.{png,jpg,jpeg,webp,svg,ogg,mp3}',
    ],
    navigateFallback: '/index.html',
    // TEMP: allow very large assets (up to 100 MB) to be precached while testing.
    // TODO: lower this once assets are optimized/split.
    maximumFileSizeToCacheInBytes: 100 * 1024 * 1024,
  },
  // additional global options required by VitePWAOptions type
  minify: true,
  injectManifest: undefined,
  includeManifestIcons: true,
  disable: false,
  devOptions: {
    // You can turn this off if SW in dev is annoying while debugging.
    enabled: true,
  },
};

