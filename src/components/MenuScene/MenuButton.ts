import Phaser from 'phaser';
import { themeManager } from '../../core/ThemeManager.js';
import { I18nText } from '../shared/index.js';

export interface MenuButtonResult {
    text: Phaser.GameObjects.Text;
    container: Phaser.GameObjects.Container;
}

/**
 * Tạo nút menu với icon + text, hover fade text, click chuyển qua LoadingScene(sceneName).
 * Text dùng I18nText nên tự cập nhật khi đổi ngôn ngữ.
 */
export function createMenuButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    iconName: string,
    labelKey: string,
    sceneName: string
): MenuButtonResult {
    const button = scene.add.container(x, y);

    const icon = scene.add.image(0, 20, 'item', iconName);
    icon.setDisplaySize(180, 180);

    const text = new I18nText(scene, 0, -80, labelKey, {
        fontSize: '28px',
        color: themeManager.getText(),
        fontFamily: 'Arial',
        stroke: themeManager.getBackground(),
        strokeThickness: 2
    }).setOrigin(0.5);
    text.setAlpha(0);
    button.add([icon, text]);
    button.setInteractive(new Phaser.Geom.Rectangle(-90, -90, 180, 180), Phaser.Geom.Rectangle.Contains);

    button.on('pointerdown', () => {
        scene.scene.start('LoadingScene', { targetScene: sceneName });
    });

    button.on('pointerover', () => {
        scene.tweens.add({
            targets: text,
            alpha: 1,
            duration: 200,
            ease: 'Power2'
        });
        button.setScale(1.1);
    });

    button.on('pointerout', () => {
        scene.tweens.add({
            targets: text,
            alpha: 0,
            duration: 200,
            ease: 'Power2'
        });
        button.setScale(1);
    });

    return { text, container: button };
}
