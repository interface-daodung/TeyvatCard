/**
 * Save game cloud: gửi/nhận saveGame từ server (chỉ khi đã đăng nhập).
 */
import { ApiConfig } from './ApiConfig.js';

export async function getSaveGameFromServer(): Promise<Record<string, unknown> | null> {
  const res = await fetch(ApiConfig.saveGame, { credentials: 'include' });
  if (!res.ok) return null;
  const data = await res.json();
  const saveGame = data?.saveGame;
  if (saveGame != null && typeof saveGame === 'object' && !Array.isArray(saveGame)) {
    return saveGame as Record<string, unknown>;
  }
  return null;
}

export async function sendSaveGameToServer(payload: Record<string, unknown>): Promise<boolean> {
  const res = await fetch(ApiConfig.saveGame, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ saveGame: payload }),
  });
  return res.ok;
}
