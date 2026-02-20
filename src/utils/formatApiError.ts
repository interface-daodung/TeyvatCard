/**
 * Chuẩn hóa lỗi từ API (string | Zod errors array | object) thành chuỗi để hiển thị (alert/toast).
 * Tránh hiện "[object Object]" khi server trả error là object/mảng.
 */
export function formatApiError(err: unknown, fallback: string): string {
  if (err == null) return fallback;
  if (typeof err === 'string') return err || fallback;
  if (Array.isArray(err)) {
    const messages = err
      .map((e: unknown) => (e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : String(e)))
      .filter(Boolean);
    return messages.length ? messages.join('. ') : fallback;
  }
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const msg = (err as { message: unknown }).message;
    return typeof msg === 'string' ? msg : fallback;
  }
  return fallback;
}
