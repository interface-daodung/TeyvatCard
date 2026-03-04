import Phaser from 'phaser';
import { themeManager } from '../core/ThemeManager.js';
import { I18nText } from './shared/index.js';

/** Chỉ hiển thị khi chạy dev (npm run dev). Build production (npm run build) thì Vite thay import.meta.env.DEV = false nên không tạo nút. */
const isDev = import.meta.env.DEV;

export interface CreateTestDevButtonOptions {
    onClick: () => void;
}

/**
 * Tạo nút "Test dev" chỉ khi NODE_ENV / mode là development.
 * Khi build production, import.meta.env.DEV = false nên không tạo gì.
 */
export function createTestDevButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    options: CreateTestDevButtonOptions
): I18nText | null {
    if (!isDev) return null;

    const btn = I18nText.create(scene, x, y, 'test_dev', {
        fontSize: '24px',
        color: themeManager.getNeutral(),
        fontFamily: 'Arial',
        stroke: themeManager.getSurface(),
        strokeThickness: 1
    }).setOrigin(0.5);

    btn.on('pointerdown', options.onClick);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setStyle({ color: themeManager.getText() }));
    btn.on('pointerout', () => btn.setStyle({ color: themeManager.getNeutral() }));

    return btn;
}

export interface CreateTestGraphicsRenderTextureButtonOptions {
    onClick: () => void;
}

export function createTestGraphicsRenderTextureButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    options: CreateTestGraphicsRenderTextureButtonOptions
): Phaser.GameObjects.Text | null {
    if (!isDev) return null;

    const btn = scene.add.text(x, y, 'TestGraphicsRenderTexture', {
        fontSize: '24px',
        color: themeManager.getNeutral(),
        fontFamily: 'Arial',
        stroke: themeManager.getSurface(),
        strokeThickness: 1
    }).setOrigin(0.5);

    btn.on('pointerdown', options.onClick);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setStyle({ color: themeManager.getText() }));
    btn.on('pointerout', () => btn.setStyle({ color: themeManager.getNeutral() }));

    return btn;
}
