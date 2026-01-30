
export enum LanguageCode {
  ENGLISH = 'en',
  VIETNAMESE = 'vi'
}

export interface TranslationSchema {
  welcomeMessage: string;
  gameTitle: string;
  instructionText: string;
  changeLanguage: string;
  currentLanguage: string;
}

export type Translations = Record<LanguageCode, TranslationSchema>;
