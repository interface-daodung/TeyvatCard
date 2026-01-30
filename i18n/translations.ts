
import { LanguageCode, Translations } from '../types';

import en from './locales/en.json';
import vi from './locales/vi.json';

export const translations: Translations = {
  [LanguageCode.ENGLISH]: en,
  [LanguageCode.VIETNAMESE]: vi
};
