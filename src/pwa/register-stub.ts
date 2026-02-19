/**
 * Stub for virtual:pwa-register when building without vite-plugin-pwa
 * (to avoid "find is not a function" build error with current plugin + Vite 6).
 */
export function registerSW() {
  return () => {};
}
