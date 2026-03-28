import { ApiConfig } from './ApiConfig.js';

function serializeArg(a: unknown): string {
  if (a instanceof Error) {
    return `${a.name}: ${a.message}`;
  }
  try {
    if (typeof a === 'string') return a;
    return JSON.stringify(a);
  } catch {
    return String(a);
  }
}

async function sendClientErrorToServer(args: unknown[]): Promise<void> {
  const body = { args: args.map(serializeArg) };
  try {
    const res = await fetch(ApiConfig.clientLogError, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    });
    if (
      !res.ok &&
      import.meta.env.VITE_DEBUG_CLIENT_LOG === 'true'
    ) {
      const text = await res.text().catch(() => '');
      // eslint-disable-next-line no-console
      console.warn('[Log] client-log-error failed', res.status, text);
    }
  } catch (e) {
    if (import.meta.env.VITE_DEBUG_CLIENT_LOG === 'true') {
      // eslint-disable-next-line no-console
      console.warn('[Log] client-log-error fetch error', e);
    }
  }
}

/**
 * Log – dùng thay cho console trong TeyvatCard.
 * Dev (`VITE_IS_DEV=true`): `info`/`warn`/`error` ghi console.
 * Production: chỉ `error` gửi lên server (audit `client_game_error`) — payload chỉ là các tham số đã serialize.
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
      return;
    }
    void sendClientErrorToServer(args);
  }
}
