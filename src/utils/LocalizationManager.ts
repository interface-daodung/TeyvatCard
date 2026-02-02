/**
 * LocalizationManager - Utility quản lý đa ngôn ngữ cho game
 * Ngôn ngữ lưu trong i18n/locales/*.json, dễ thêm/sửa
 *
 * Thêm ngôn ngữ:
 *   1. Tạo file i18n/locales/xx.json (copy từ en.json rồi dịch)
 *   2. Import trong i18n/translations.ts và thêm vào TRANSLATIONS, LANGUAGE_NAMES
 */
import {
  TRANSLATIONS,
  LANGUAGE_NAMES,
  type GameLanguageCode
} from '../../i18n/translations.js';

export type { GameLanguageCode };

export class LocalizationManager {
  /** Ngôn ngữ hiện tại đang dùng (vi, en, ja, ...) */
  currentLanguage: GameLanguageCode;

  /** Bảng dịch từ translations, key = mã ngôn ngữ, value = { key: translatedText } */
  private translations = TRANSLATIONS;

  constructor() {
    // Đọc ngôn ngữ đã lưu từ localStorage
    const saved = localStorage.getItem('gameLanguage') as GameLanguageCode | null;
    // Nếu có lưu và hợp lệ thì dùng, không thì mặc định 'vi'
    this.currentLanguage =
      saved && this.translations[saved] ? saved : ('vi' as GameLanguageCode);
  }

  /**
   * Lấy text đã dịch theo key
   * @param key - Key trong file locale (vd: 'settings', 'back', 'language')
   * @param params - Thay thế {name} trong text (vd: { score: '100' } cho "Score: {score}")
   * @returns Chuỗi đã dịch, fallback: locale hiện tại → vi → key gốc
   */
  t(key: string, params: Record<string, string | number> = {}): string {
    // Fallback về tiếng Việt nếu thiếu key ở ngôn ngữ hiện tại
    const fallback = this.translations.vi ?? {};
    let text =
      this.translations[this.currentLanguage]?.[key] ?? fallback[key] ?? key;

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
    console.log('[LocalizationManager] setLanguage() called with:', code);
    console.log('[LocalizationManager] Current language before change:', this.currentLanguage);
    
    if (this.translations[code]) {
      this.currentLanguage = code;
      localStorage.setItem('gameLanguage', code);
      console.log('[LocalizationManager] Language changed to:', code);
      console.log('[LocalizationManager] Saved to localStorage');

      // Emit event để các scene (MenuScene, SettingsScene, ...) lắng nghe và cập nhật text
      const win = window as { gameEvents?: { emit: (e: string) => void } };
      if (win.gameEvents?.emit) {
        console.log('[LocalizationManager] Emitting languageChanged event');
        win.gameEvents.emit('languageChanged');
        console.log('[LocalizationManager] Event emitted');
      } else {
        console.warn('[LocalizationManager] gameEvents not available!');
      }
    } else {
      console.warn('[LocalizationManager] Invalid language code:', code);
    }
  }

  /** Danh sách mã ngôn ngữ có sẵn (vi, en, ja, ...) */
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
