import Phaser from 'phaser';
import { localizationManager } from '../../utils/LocalizationManager.js';
import { themeManager } from '../../core/ThemeManager.js';

export interface MenuButtonResult {
    text: Phaser.GameObjects.Text;
    container: Phaser.GameObjects.Container;
}

/**
 * Tạo nút menu với icon + text, hover fade text, click chuyển qua LoadingScene(sceneName).
 * Trả về { text, container } để scene cập nhật text khi đổi ngôn ngữ.
 */
export function createMenuButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    iconName: string,
    buttonText: string,
    sceneName: string
): MenuButtonResult {
    const button = scene.add.container(x, y);

    const icon = scene.add.image(0, 20, 'item', iconName);
    icon.setDisplaySize(180, 180);

    const text = scene.add.text(0, -80, buttonText, {
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

/** Cập nhật text nút theo labelKey đã lưu (sau khi tạo bằng createMenuButton). */
export function updateMenuButtonText(buttonResult: MenuButtonResult, labelKey: string): void {
    if (buttonResult.text && buttonResult.text.active) {
        buttonResult.text.setText(localizationManager.t(labelKey));
    }
}
