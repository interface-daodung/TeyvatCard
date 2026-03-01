/**
 * Log – dùng thay cho console trong TeyvatCard.
 * Chỉ gọi console khi VITE_IS_DEV=true; khi build production (VITE_IS_DEV=false)
 * khối if bị dead-code eliminate nên không còn log trong bundle.
 */
export class Log {
  static info(...args: any[]) {
    if (import.meta.env.VITE_IS_DEV === 'true') {
      console.log(...args);
    }
  }

  static warn(...args: any[]) {
    if (import.meta.env.VITE_IS_DEV === 'true') {
      console.warn(...args);
    }
  }

  static error(...args: any[]) {
    if (import.meta.env.VITE_IS_DEV === 'true') {
      console.error(...args);
    }
  }
}
