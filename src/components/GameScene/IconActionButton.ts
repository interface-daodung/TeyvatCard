import Phaser from 'phaser';
import { themeManager } from '../../core/ThemeManager.js';
import { I18nText } from '../shared/index.js';

export interface IconActionButtonConfig {
    scene: Phaser.Scene;
    parent: Phaser.GameObjects.Container;
    x: number;
    y: number;
    icon: string;
    tooltipKey: string;
    color: number;
    onClick: () => void | Promise<void>;
    tooltipParams?: Record<string, string | number>;
}

export function createIconActionButton(config: IconActionButtonConfig): Phaser.GameObjects.Container {
    const { scene, parent, x, y, icon, tooltipKey, color, onClick, tooltipParams } = config;

    const button = scene.add.container(x, y);
    const hitArea = scene.add.circle(0, 0, 40, color, 1)
        .setStrokeStyle(2, themeManager.getSurfacePhaser(), 1);
    const iconText = scene.add.text(0, 0, icon, {
        fontSize: '34px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    // Tooltip luôn dùng I18nText để tự cập nhật khi đổi ngôn ngữ.
    const tooltip = I18nText.create(scene, 0, -56, tooltipKey, {
        fontSize: '18px',
        color: themeManager.getNeutral(),
        fontFamily: 'Arial, sans-serif',
        stroke: themeManager.getBackground(),
        strokeThickness: 3
    }, tooltipParams).setOrigin(0.5).setAlpha(0);

    button.add([hitArea, iconText, tooltip]);
    button.setSize(90, 90);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerover', () => {
        button.setScale(1.08);
        hitArea.setFillStyle(themeManager.getAccentPhaser(), 1);
        scene.tweens.add({
            targets: tooltip,
            alpha: 1,
            duration: 120
        });
    });
    button.on('pointerout', () => {
        button.setScale(1);
        hitArea.setFillStyle(color, 1);
        scene.tweens.add({
            targets: tooltip,
            alpha: 0,
            duration: 120
        });
    });
    button.on('pointerdown', () => {
        void onClick();
    });

    parent.add(button);
    return button;
}
