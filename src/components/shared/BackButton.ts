import Phaser from 'phaser';
import { localizationManager } from '../../utils/LocalizationManager.js';
import { themeManager } from '../../core/ThemeManager.js';

/**
 * Tạo nút Back với hover và click. Gọi onClick khi click.
 * @param labelKey - Key localization cho nút (mặc định 'back_short'). Ví dụ 'select' cho "Chọn".
 * @param parentContainer - Nếu có, thêm nút vào container này thay vì scene (dùng cho SettingsScene).
 */
export function createBackButton(
    scene: Phaser.Scene,
    width: number,
    height: number,
    onClick: () => void,
    labelKey: string = 'back_short',
    parentContainer?: Phaser.GameObjects.Container
): Phaser.GameObjects.Text {
    const backButton = scene.add.text(width * 0.5, height * 0.9, localizationManager.t(labelKey), {
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
    return backButton;
}
