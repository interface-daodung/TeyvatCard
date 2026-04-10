/**
 * DataManager - Đọc/ghi dữ liệu localStorage + cờ in-memory (chỉ trong phiên)
 * - localStorage: VITE_IS_DEV = true → key plain, false → key HMAC + value AES
 * - Cờ phiên: getFlag/setFlag — không lưu disk, mất khi reload trang
 * - loadJsonFromData: đọc JSON từ public/data bằng Phaser loader/cache
 */

import CryptoJS from 'crypto-js';
import Phaser from 'phaser';

/** Đường dẫn gốc cho thư mục public/data (URL khi chạy app) */
const DATA_BASE_PATH = '/data/';
/** JSON app load từ public/data, sau khi load xong ghi vào dataManager.setFlag */
const APP_DATA_PATHS = [
  'About.json',
  'dungeonList.json',
  'libraryCards.json',
  'cardCharacterList.json',
  'items.json',
] as const;
/** Locale i18n (public/data/locales) – load xong ghi vào dataManager.setTranslations() */
const LOCALE_DATA_PATHS = [
  'locales/vi.json',
  'locales/en.json',
  'locales/ja.json',
] as const;

const IS_DEV = import.meta.env.VITE_IS_DEV === 'true';
const SECRET_KEY = import.meta.env.VITE_STORAGE_SECRET_KEY || 'teyvat-default-obfuscation-key';
const PREFIX = 'T0vt';

/** Keys app dùng – dùng cho clear() khi dev (không có prefix). Không đẩy jwt/refreshToken lên cloud. */
const KNOWN_KEYS = new Set([
  'totalCoin', 'highScores', 'characterHighScores', 'equipment', 'starterPackPurchased',
  'selectedCharacter', 'characterLevel', 'unlockedCharacters', 'itemLevel', 'gameLanguage', 'gameVolume', 'gameBGMVolume',
  'jwt', 'refreshToken', 'showCardName', 'theme'
]);

/** Keys dùng cho cloud save (loại jwt, refreshToken). */
const CLOUD_SAVE_KEYS = new Set([
  'totalCoin', 'highScores', 'characterHighScores', 'equipment', 'starterPackPurchased',
  'selectedCharacter', 'characterLevel', 'unlockedCharacters', 'itemLevel', 'gameLanguage', 'gameVolume', 'gameBGMVolume',
  'showCardName', 'theme'
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
  /** Cờ chỉ trong phiên (in-memory), mất khi reload trang */
  private sessionFlags = new Map<string, unknown>();

  getFlag<T>(key: string): T | undefined {
    return this.sessionFlags.get(key) as T | undefined;
  }

  getFlagOr<T>(key: string, defaultValue: T): T {
    const v = this.sessionFlags.get(key);
    return (v !== undefined ? v : defaultValue) as T;
  }

  setFlag<T>(key: string, value: T): void {
    this.sessionFlags.set(key, value);
  }

  hasFlag(key: string): boolean {
    return this.sessionFlags.has(key);
  }

  deleteFlag(key: string): boolean {
    return this.sessionFlags.delete(key);
  }

  clearFlags(): void {
    this.sessionFlags.clear();
  }

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

  /**
   * Đọc JSON từ thư mục public/data bằng Phaser (scene.load + cache).
   * Nếu đã có trong cache thì trả về ngay, không load lại.
   * @param scene - Phaser Scene (dùng scene.load và scene.cache.json)
   * @param dataPath - Đường dẫn tương đối trong data, ví dụ: 'About.json', 'dungeonList.json', 'atlas/character.json'
   * @param cacheKey - Key lưu trong cache (mặc định: tên file không .json, thư mục nối bằng _)
   * @returns Promise resolve với dữ liệu JSON đã parse
   */
  loadJsonFromData<T = unknown>(
    scene: Phaser.Scene,
    dataPath: string,
    cacheKey?: string
  ): Promise<T> {
    const path = dataPath.replace(/^\//, '');
    const fullUrl = DATA_BASE_PATH + path;
    const key = cacheKey ?? path.replace(/\.json$/i, '').replace(/[/\\]/g, '_');

    if (scene.cache.json.exists(key)) {
      return Promise.resolve(scene.cache.json.get(key) as T);
    }

    return new Promise<T>((resolve, reject) => {
      const onComplete = (): void => {
        try {
          if (scene.cache.json.exists(key)) {
            resolve(scene.cache.json.get(key) as T);
          } else {
            reject(new Error(`JSON not in cache: ${key}`));
          }
        } catch (e) {
          reject(e);
        }
      };

      const onError = (file: Phaser.Loader.File): void => {
        if (file.key === key) {
          reject(new Error(`Failed to load JSON: ${fullUrl}`));
        }
      };

      scene.load.once('filecomplete-json-' + key, onComplete);
      scene.load.once('loaderror', onError);
      scene.load.json(key, fullUrl);

      if (!scene.load.isLoading()) {
        scene.load.start();
      }
    });
  }

  /**
   * Lấy JSON đã load từ cache Phaser (không gọi load).
   * @param scene - Phaser Scene
   * @param cacheKey - Key đã dùng khi load (vd: 'About', 'atlas_character')
   * @returns Dữ liệu hoặc undefined nếu chưa có trong cache
   */
  getJsonFromCache<T = unknown>(scene: Phaser.Scene, cacheKey: string): T | undefined {
    if (!scene.cache.json.exists(cacheKey)) return undefined;
    return scene.cache.json.get(cacheKey) as T;
  }

  /**
   * Trả về URL đầy đủ cho file trong public/data (dùng cho loader).
   * @param dataPath - Đường dẫn tương đối, vd: 'theme.json', 'atlas/character.json'
   */
  getDataFullUrl(dataPath: string): string {
    const path = dataPath.replace(/^\//, '');
    return DATA_BASE_PATH + path;
  }

  /**
   * Trả về cache key tương ứng dataPath (giống logic trong loadJsonFromData).
   * @param dataPath - Đường dẫn tương đối, vd: 'atlas/character.json'
   * @param cacheKey - Nếu truyền thì dùng luôn
   */
  getDataCacheKey(dataPath: string, cacheKey?: string): string {
    const path = dataPath.replace(/^\//, '');
    return cacheKey ?? path.replace(/\.json$/i, '').replace(/[/\\]/g, '_');
  }

  /**
   * Chỉ thêm JSON vào queue loader, không gọi start (để batch nhiều file rồi start một lần).
   * Nếu đã có trong cache thì không queue lại.
   * @returns Cache key dùng để lấy dữ liệu sau khi load xong (getJsonFromCache)
   */
  queueJsonFromData(scene: Phaser.Scene, dataPath: string, cacheKey?: string): string {
    const path = dataPath.replace(/^\//, '');
    const fullUrl = DATA_BASE_PATH + path;
    const key = cacheKey ?? path.replace(/\.json$/i, '').replace(/[/\\]/g, '_');

    if (scene.cache.json.exists(key)) {
      return key;
    }
    scene.load.json(key, fullUrl);
    return key;
  }

  /**
   * Queue load app JSON + locales, xong thì ghi flag / setTranslations và gọi callback.
   */
  queueAppDataAndThenOnThemeLoaded(scene: Phaser.Scene, onThemeLoaded: () => void): void {
    for (const dataPath of APP_DATA_PATHS) {
      this.queueJsonFromData(scene, dataPath);
    }
    for (const dataPath of LOCALE_DATA_PATHS) {
      this.queueJsonFromData(scene, dataPath);
    }
    scene.load.once('complete', () => {
      for (const dataPath of APP_DATA_PATHS) {
        const key = this.getDataCacheKey(dataPath);
        const data = this.getJsonFromCache<unknown>(scene, key);
        if (data !== undefined) {
          this.setFlag(key, data);
        }
      }
      const vi = this.getJsonFromCache<Record<string, string>>(scene, 'locales_vi');
      const en = this.getJsonFromCache<Record<string, string>>(scene, 'locales_en');
      const ja = this.getJsonFromCache<Record<string, string>>(scene, 'locales_ja');
      this.setTranslations({
        vi: vi ?? {},
        en: en ?? {},
        ja: ja ?? {},
      });
      onThemeLoaded();
    });
    scene.load.start();
  }

  /**
   * Bảng dịch i18n (vi, en, ja) – được ghi bởi LoadingScene sau khi load public/data/locales/*.json.
   * Cấu trúc: Record<langCode, Record<key, string>> (giống TRANSLATIONS cũ trong translations.ts).
   */
  getTranslations(): Record<string, Record<string, string>> {
    return (this.getFlag<Record<string, Record<string, string>>>('translations') ?? {}) as Record<string, Record<string, string>>;
  }

  /** Ghi bảng dịch (gọi từ LoadingScene sau khi load xong locales). */
  setTranslations(translations: Record<string, Record<string, string>>): void {
    this.setFlag('translations', translations);
  }

  /** Danh sách key dùng cho cloud save (không gồm jwt, refreshToken). */
  getKnownSaveKeys(): string[] {
    return Array.from(CLOUD_SAVE_KEYS);
  }

  /**
   * Đọc toàn bộ dữ liệu lưu (cloud keys) thành một object JSON plain (đã decrypt).
   * Dùng để gửi lên server.
   */
  getAllSaveData(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const key of CLOUD_SAVE_KEYS) {
      const value = this.get<unknown>(key);
      if (value !== null && value !== undefined) {
        out[key] = value;
      }
    }
    return out;
  }

  /**
   * Áp dụng dữ liệu save từ server xuống local. Chỉ ghi các key nằm trong KNOWN_KEYS.
   */
  applySaveData(data: Record<string, unknown>): void {
    if (!data || typeof data !== 'object') return;
    for (const key of Object.keys(data)) {
      if (KNOWN_KEYS.has(key)) {
        this.set(key, data[key]);
      }
    }
  }
}

export const dataManager = new DataManager();
