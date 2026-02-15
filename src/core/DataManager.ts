/**
 * DataManager - Đọc/ghi dữ liệu localStorage
 * - VITE_IS_DEV = true: key plain (totalCoin, equipment...), value JSON thuần (dễ debug)
 * - VITE_IS_DEV = false: key HMAC, value AES (làm rối)
 */

import CryptoJS from 'crypto-js';

const IS_DEV = import.meta.env.VITE_IS_DEV === 'true';
const SECRET_KEY = import.meta.env.VITE_STORAGE_SECRET_KEY || 'teyvat-default-obfuscation-key';
const PREFIX = 'T0vt';

/** Keys app dùng – dùng cho clear() khi dev (không có prefix) */
const KNOWN_KEYS = new Set([
  'totalCoin', 'highScores', 'characterHighScores', 'equipment', 'starterPackPurchased',
  'selectedCharacter', 'characterLevel', 'gameLanguage', 'gameVolume', 'gameBGMVolume',
  'jwt', 'refreshToken'
]);

function serialize<T>(value: T): string {
  return JSON.stringify(value);
}

function deserialize<T>(raw: string): T {
  return JSON.parse(raw) as T;
}

function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
}

function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/** Dev: key plain (totalCoin). Prod: key HMAC (T0vt + hash) */
function toStorageKey(key: string): string {
  if (IS_DEV) return key;
  const hash = CryptoJS.HmacSHA256(key, SECRET_KEY).toString(CryptoJS.enc.Hex);
  return PREFIX + hash;
}

class DataManager {
  get<T>(key: string): T | null {
    try {
      const storageKey = toStorageKey(key);
      const raw = localStorage.getItem(storageKey);
      if (raw == null || raw === '') return null;

      const text = IS_DEV ? raw : decrypt(raw);
      return deserialize<T>(text);
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    const storageKey = toStorageKey(key);
    const text = serialize(value);
    const toStore = IS_DEV ? text : encrypt(text);
    localStorage.setItem(storageKey, toStore);
  }

  remove(key: string): void {
    localStorage.removeItem(toStorageKey(key));
  }

  clear(): void {
    if (IS_DEV) {
      KNOWN_KEYS.forEach((k) => localStorage.removeItem(k));
    } else {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(PREFIX)) keysToRemove.push(k);
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    }
  }
}

export const dataManager = new DataManager();
