import Phaser from 'phaser';
import { themeManager } from '../../core/ThemeManager.js';
import { I18nText } from '../shared/index.js';

/**
 * Tạo nút rect + text (Language, Game Setting, About style). Click gọi onClick.
 * Text dùng I18nText nên tự cập nhật khi đổi ngôn ngữ.
 */
export function createRectTextButton(
    scene: Phaser.Scene,
    width: number,
    height: number,
    yRatio: number,
    labelKey: string,
    onClick: () => void
): Phaser.GameObjects.Container {
    const buttonWidth = width * 0.6;
    const buttonHeight = height * 0.08;
    const buttonY = height * yRatio;

    const rect = scene.add.rectangle(width / 2, buttonY, buttonWidth, buttonHeight, themeManager.getPrimaryPhaser());
    rect.setStrokeStyle(3, themeManager.getSecondaryPhaser());
    rect.setInteractive({ useHandCursor: true });

    const text = I18nText.create(scene, width / 2, buttonY, labelKey, {
        fontSize: '32px',
        color: themeManager.getText(),
        fontFamily: 'Arial',
        stroke: themeManager.getBackground(),
        strokeThickness: 2
    }).setOrigin(0.5);

    rect.on('pointerover', () => {
        rect.setFillStyle(themeManager.getPrimaryPhaser());
        rect.setStrokeStyle(3, themeManager.getTextPhaser());
    });
    rect.on('pointerout', () => {
        rect.setFillStyle(themeManager.getPrimaryPhaser());
        rect.setStrokeStyle(3, themeManager.getSecondaryPhaser());
    });
    rect.on('pointerdown', onClick);

    return scene.add.container(0, 0, [rect, text]);
}
