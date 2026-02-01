/**
 * Game translations - load từ i18n/locales/*.json
 * Thêm ngôn ngữ: tạo file xx.json trong locales/, rồi import và thêm vào GAME_TRANSLATIONS
 */
import vi from './locales/vi.json';
import en from './locales/en.json';
import ja from './locales/ja.json';

export type GameLanguageCode = 'vi' | 'en' | 'ja';

export const GAME_TRANSLATIONS: Record<GameLanguageCode, Record<string, string>> = {
  vi: vi as Record<string, string>,
  en: en as Record<string, string>,
  ja: ja as Record<string, string>
};

export const LANGUAGE_NAMES: Record<GameLanguageCode, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  ja: '日本語'
};
