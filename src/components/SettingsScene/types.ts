import type Phaser from 'phaser';

export interface AboutBlock {
    type: string;
    size?: number;
    /** i18n key (e.g. "developer.title") – used when present */
    key?: string;
    /** Raw text – fallback when key is not used */
    text?: string;
}

export interface AboutJson {
    blocks: AboutBlock[];
}

export type LangButton = Phaser.GameObjects.Container & {
    rect?: Phaser.GameObjects.Rectangle;
    text?: Phaser.GameObjects.Text;
    setActiveState?: (active: boolean) => void;
    lang?: string;
};

export const SETTINGS_UI_Y = {
    TITLE: 0.18,
    LANGUAGE: 0.4,
    GAME_SETTING: 0.5,
    ABOUT: 0.6,
    VOLUME_BGM: 0.7,
    VOLUME_SE: 0.75
} as const;
