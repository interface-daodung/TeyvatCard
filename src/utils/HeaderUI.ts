import Phaser from 'phaser';
import { localizationManager } from './LocalizationManager.js';
import { AuthManager } from './AuthManager.js';
import { themeManager } from '../core/ThemeManager.js';

/**
 * Utility để tạo HeaderUI có thể tái sử dụng
 */
export class HeaderUI {
    /**
     * Tạo header UI bao gồm coin display và settings button
     * @param scene - Scene hiện tại
     * @param width - Chiều rộng game
     * @param height - Chiều cao game
     * @returns Object chứa updateCoinDisplay method
     */
    static createHeaderUI(scene: Phaser.Scene, width: number, height: number): { updateCoinDisplay: (newCoin: string | number) => void } {
        // Hiển thị số coin từ localStorage
        const totalCoin = localStorage.getItem('totalCoin') || '0';
        const coinDisplay = scene.add.text(width * 0.05, height * 0.05, localizationManager.t('coin_header', { amount: totalCoin }), {
            fontSize: '32px',
            color: themeManager.getText(),
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            stroke: themeManager.getBackground(),
            strokeThickness: 2
        });

        // Nút dấu cộng (+) cạnh coinDisplay - luôn đặt sau số tiền, cập nhật vị trí khi số tiền thay đổi
        const plusBtnSize = 36;
        const coinBaseX = width * 0.05 + 20;
        const coinBaseY = height * 0.05;
        const plusBtnPadding = 12;

        const updatePlusButtonPosition = () => {
            const x = coinBaseX + coinDisplay.width + plusBtnPadding;
            const y = coinBaseY + coinDisplay.height / 2;
            plusBtnRect.setPosition(x, y);
            plusBtnText.setPosition(x, y);
        };

        const plusBtnRect = scene.add.rectangle(0, 0, plusBtnSize, plusBtnSize, themeManager.getBackgroundPhaser(), 0.5);
        plusBtnRect.setStrokeStyle(2, themeManager.getNeutralPhaser());
        plusBtnRect.setInteractive({ useHandCursor: true });
        const plusBtnText = scene.add.text(0, 0, '+', {
            fontSize: '28px',
            color: themeManager.getText(),
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        plusBtnRect.on('pointerover', () => {
            plusBtnRect.setFillStyle(themeManager.getBackgroundPhaser(), 0.7);
        });
        plusBtnRect.on('pointerout', () => {
            plusBtnRect.setFillStyle(themeManager.getBackgroundPhaser(), 0.5);
        });
        plusBtnRect.on('pointerdown', () => {
            if (AuthManager.hasJWT()) {
                scene.scene.start('PaymentScene', { fromScene: scene.scene.key });
            } else {
                scene.scene.start('LoginScene', {
                    fromScene: scene.scene.key,
                    returnTo: 'PaymentScene'
                });
            }
        });

        updatePlusButtonPosition(); // Vị trí ban đầu

        // Nút Settings (⚙️) ở góc trên bên phải
        const settingsButton = scene.add.text(width * 0.935, height * 0.065, localizationManager.t('settings_icon'), {
            fontSize: '32px',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5, 0.5); // Căn giữa

        // Làm cho nút settings có thể click được
        settingsButton.setInteractive({ useHandCursor: true });

        // Event hover - xoay 1 vòng
        settingsButton.on('pointerover', () => {
            scene.tweens.add({
                targets: settingsButton,
                rotation: Math.PI * 2, // Xoay 1 vòng (360 độ)
                duration: 500,
                ease: 'Power2'
            });
        });

        // Event click
        settingsButton.on('pointerdown', () => {
            console.log('Settings button được click!');
            // Mở SettingsScene
            scene.scene.start('SettingsScene');
        });

        // Trả về method để cập nhật coin display
        return {
            updateCoinDisplay: (newCoin: string | number) => {
                coinDisplay.setText(localizationManager.t('coin_header', { amount: String(newCoin) }));
                updatePlusButtonPosition(); // Cập nhật vị trí nút + khi số tiền thay đổi
            }
        };
    }
}
