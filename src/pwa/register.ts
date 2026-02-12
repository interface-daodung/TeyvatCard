// All runtime PWA logic for TeyvatCard is centralized here
// so it is easy to enable/disable and debug separately from Phaser scenes.

// This virtual module is provided by vite-plugin-pwa.
import { registerSW } from 'virtual:pwa-register';

export function setupPWA() {
  if (import.meta.env.DEV && !('serviceWorker' in navigator)) {
    console.warn('[PWA] Service workers are not supported in this browser.');
    return;
  }

  const updateSW = registerSW({
    immediate: false,
    onNeedRefresh() {
      console.log('[PWA] New content available. Reload to update.');
      // Hook this into an in-game UI popup if you want:
      // e.g. GameEventsManager.emit('pwa:update-available');
    },
    onOfflineReady() {
      console.log('[PWA] App is ready to work offline.');
      // You can show a toast / banner in your UI here.
    },
    onRegisteredSW(swUrl, registration) {
      console.log('[PWA] Service worker registered:', swUrl, registration);
    },
    onRegisterError(error) {
      console.error('[PWA] Service worker registration error:', error);
    },
  });

  return { updateSW };
}

