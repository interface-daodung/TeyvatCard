import type { VitePWAOptions } from 'vite-plugin-pwa';

// Centralized PWA configuration for TeyvatCard.
// This file is imported from vite.config.ts so all PWA-related
// options are in one place for easier debugging and tweaking.
// theme_color/background_color: màu cố định để tránh import ThemeManager khi build (gây lỗi với vite-plugin-pwa).
const bgColor = '#1a1a2e';

export const pwaOptions: VitePWAOptions = {
  // how the service worker register script is injected
  injectRegister: 'auto',
  // general behavior
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
    start_url: '/TeyvatCard/',
    scope: '/TeyvatCard/',
    id: '/TeyvatCard/',
    icons: [
      {
        src: '/TeyvatCard/favicon.ico',
        sizes: '32x32',
        type: 'image/x-icon',
        purpose: 'any',
      },
      // Installability requires at least one PNG/WebP icon >= 144px. Add public/icon-192.webp (192×192).
      {
        src: '/TeyvatCard/icon-192.webp',
        sizes: '192x192',
        type: 'image/webp',
        purpose: 'any',
      },
    ],
    screenshots: [
      {
        src: '/TeyvatCard/assets/images/ui/screenshots.webp',
        sizes: '720x1280',
        label: 'Teyvat Card',
        form_factor: 'wide',
      },
      {
        src: '/TeyvatCard/assets/images/ui/screenshots.webp',
        sizes: '720x1280',
        label: 'Teyvat Card',
        form_factor: 'narrow',
      },
    ],
  },
  workbox: {
    // Precache only app shell + small shared assets.
    // Device-specific assets are cached at runtime based on actual requests from AssetManager.
    globPatterns: [
      '**/*.{js,css,html}',
      'assets/images/ui/**/*.{png,jpg,jpeg,webp,svg,json}',
    ],
    navigateFallback: '/TeyvatCard/index.html',
    runtimeCaching: [
      {
        // Cache only the variant actually requested by runtime logic (/assets/desktop or /assets/mobile).
        urlPattern: /^\/(?:TeyvatCard\/)?assets\/(desktop|mobile)\//,
        handler: 'CacheFirst',
        options: {
          cacheName: 'tcg-variant-assets',
          expiration: {
            maxEntries: 1200,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
      {
        urlPattern: /^\/(?:TeyvatCard\/)?assets\/sounds\//,
        handler: 'CacheFirst',
        options: {
          cacheName: 'tcg-sounds',
          expiration: {
            maxEntries: 300,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
    ],
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

