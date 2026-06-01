import path from 'path';
import { defineConfig } from 'vite';
import { APP_BASE } from './src/pwa/base';

/**
 * Config build KHÔNG dùng vite-plugin-pwa và vite-plugin-remove-console.
 * Cả hai plugin đều có thể gây lỗi "(0 , w1.default)(...).find is not a function" với Vite 6.
 * Chạy: npm run build:no-pwa
 */
export default defineConfig({
  base: APP_BASE,
  server: {
    port: 3000,
    host: '0.0.0.0',
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Referrer-Policy': 'no-referrer-when-downgrade',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      'virtual:pwa-register': path.resolve(__dirname, 'src/pwa/register-stub.ts'),
    }
  },
  plugins: [],
});
