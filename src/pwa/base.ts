/**
 * Vite `base` — đường dẫn tương đối hoạt động trên GitHub Pages (project site, ví dụ /TeyvatCard/).
 * Dùng chung cho vite.config và URL public (data, assets, favicon).
 */
export const APP_BASE = './';

/** URL tới file trong public/ (data, assets, favicon, …). */
export function publicUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const base = import.meta.env.BASE_URL;
  const rel = path.replace(/^\//, '');
  return `${base}${rel}`;
}
