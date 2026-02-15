import Phaser from 'phaser';
import { themeManager } from '../../core/ThemeManager.js';

/**
 * Hiển thị toast giữa màn hình, tự destroy sau 2500ms.
 */
export function showToast(scene: Phaser.Scene, msg: string): void {
    const { width, height } = scene.scale;
    const t = scene.add.text(width / 2, height * 0.5, msg, {
        fontSize: '22px',
        color: themeManager.getText(),
        backgroundColor: themeManager.getBackground()
    }).setOrigin(0.5).setScrollFactor(0).setPadding(16, 8);

    scene.time.delayedCall(2500, () => t.destroy());
}
