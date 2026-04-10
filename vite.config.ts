import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { pwaOptions } from './src/pwa/config';

// Tạm bỏ vite-plugin-remove-console: gây lỗi "(0 , w1.default)(...).find is not a function" với Vite 6.
// Có thể bật lại khi plugin đã tương thích.
export default defineConfig(({ command }) => ({
  // GitHub Pages serves this app from /TeyvatCard/ in production builds.
  base: command === 'build' ? '/TeyvatCard/' : '/',
  define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        'dev': process.env.NODE_ENV === 'development',
        __PWA_ENABLED__: true,
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    headers: {
      // same-origin-allow-popups: cho phép Google Sign-In popup dùng postMessage (không dùng "same-origin" sẽ chặn)
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Referrer-Policy': 'no-referrer-when-downgrade',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: true }, // Bỏ console.* khi build production (thay cho vite-plugin-remove-console)
    },
  },
  plugins: [
    VitePWA(pwaOptions),
    // removeConsole() — gây lỗi .find với Vite 6, dùng terserOptions.drop_console ở trên
  ],
}));

