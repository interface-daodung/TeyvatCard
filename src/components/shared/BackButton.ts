import Phaser from 'phaser';
import { themeManager } from '../../core/ThemeManager.js';
import { I18nText } from './I18nText.js';

/**
 * Tạo nút Back với hover và click. Gọi onClick khi click.
 * Text dùng I18nText nên tự cập nhật khi đổi ngôn ngữ.
 * @param labelKey - Key localization cho nút (mặc định 'back_short').
 * @param parentContainer - Nếu có, thêm nút vào container này thay vì scene (dùng cho SettingsScene).
 */
export function createBackButton(
    scene: Phaser.Scene,
    width: number,
    height: number,
    onClick: () => void,
    labelKey: string = 'back_short',
    parentContainer?: Phaser.GameObjects.Container
): I18nText {
    const backButton = new I18nText(scene, width * 0.5, height * 0.9, labelKey, {
        fontSize: '24px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        backgroundColor: themeManager.getPrimary(),
        padding: { x: 25, y: 12 }
    }).setOrigin(0.5);

    backButton.setInteractive({ useHandCursor: true });
    backButton.on('pointerover', () => {
        backButton.setScale(1.1);
        backButton.setTint(themeManager.getNeutralPhaser());
    });
    backButton.on('pointerout', () => {
        backButton.setScale(1);
        backButton.clearTint();
    });
    backButton.on('pointerdown', onClick);
    if (parentContainer) parentContainer.add(backButton);
    else scene.add.existing(backButton);
    return backButton;
}
