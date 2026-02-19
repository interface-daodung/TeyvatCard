/**
 * LocalizationManager - Quản lý đa ngôn ngữ. Bảng dịch lấy từ DataManager (load public/data/locales/*.json trong LoadingScene).
 * Thêm ngôn ngữ: tạo xx.json trong public/data/locales/, thêm vào LOCALE_DATA_PATHS (LoadingScene) và LANGUAGE_NAMES bên dưới.
 */
import type Phaser from 'phaser';
import { dataManager } from './DataManager.js';

export type GameLanguageCode = 'vi' | 'en' | 'ja';

export const LANGUAGE_NAMES: Record<GameLanguageCode, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  ja: '日本語',
};

export class LocalizationManager {
  /** Ngôn ngữ hiện tại (vi, en, ja) */
  currentLanguage: GameLanguageCode;

  /** Bảng dịch từ DataManager (public/data/locales) */
  private get translations(): Record<GameLanguageCode, Record<string, string>> {
    return dataManager.getTranslations() as Record<GameLanguageCode, Record<string, string>>;
  }

  constructor() {
    const saved = dataManager.get<GameLanguageCode>('gameLanguage');
    const codes: GameLanguageCode[] = ['vi', 'en', 'ja'];
    this.currentLanguage =
      saved && codes.includes(saved) ? saved : ('vi' as GameLanguageCode);
  }

  /**
   * Lấy text đã dịch theo key
   * @param key - Key trong file locale (vd: 'settings', 'back', 'language')
   * @param params - Thay thế {name} trong text (vd: { score: '100' } cho "Score: {score}")
   * @returns Chuỗi đã dịch, fallback: locale hiện tại → vi → key gốc
   */
  t(key: string, params: Record<string, string | number> = {}): string {
    const tbl = this.translations;
    const fallback = tbl.vi ?? {};
    let text =
      tbl[this.currentLanguage]?.[key] ?? fallback[key] ?? key;

    // Thay thế placeholder {param} bằng giá trị thực
    Object.keys(params).forEach((param) => {
      text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), String(params[param]));
    });

    return text;
  }

  /**
   * Đổi ngôn ngữ game, lưu vào localStorage và emit event để các scene cập nhật UI
   * @param code - Mã ngôn ngữ (vi, en, ja)
   */
  setLanguage(code: GameLanguageCode): void {
    const tbl = this.translations;
    if (tbl[code]) {
      this.currentLanguage = code;
      dataManager.set('gameLanguage', code);
      // Emit event qua Phaser game.events để các scene lắng nghe và cập nhật text
      const game = (window as Window & { game?: Phaser.Game }).game;
      if (game?.events) {
        game.events.emit('languageChanged');
      }
    }
  }

  /** Danh sách mã ngôn ngữ có sẵn (từ DataManager) */
  getAvailableLanguages(): GameLanguageCode[] {
    return Object.keys(this.translations) as GameLanguageCode[];
  }

  /** Tên hiển thị của ngôn ngữ (vd: 'vi' → 'Tiếng Việt') */
  getLanguageName(code: string): string {
    return LANGUAGE_NAMES[code as GameLanguageCode] ?? code;
  }
}

/** Singleton instance - dùng chung cho toàn game */
export const localizationManager = new LocalizationManager();
