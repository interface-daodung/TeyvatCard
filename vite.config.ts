import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { pwaOptions } from './src/pwa/config';

// Tạm bỏ vite-plugin-remove-console: gây lỗi "(0 , w1.default)(...).find is not a function" với Vite 6.
// Có thể bật lại khi plugin đã tương thích.
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin; same-origin-allow-popups',
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
});

