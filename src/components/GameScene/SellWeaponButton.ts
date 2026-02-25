import Phaser from 'phaser';
import { themeManager } from '../../core/ThemeManager.js';
import type { SellButton } from './types.js';

export interface WeaponInfo {
    durability: number;
    default: { category: string; id: string };
    price: number;
}

/**
 * Tạo nút bán vũ khí. getWeapon() trả về weapon hiện tại (hoặc null). onSell() gọi khi bán xong.
 */
export function createSellWeapon(
    scene: Phaser.Scene,
    x: number,
    y: number,
    getWeapon: () => WeaponInfo | null | undefined,
    onSell: () => void
): SellButton {
    const sellButtonContainer = scene.add.container(x, y);

    const buttonBackground = scene.add.graphics();
    buttonBackground.fillStyle(themeManager.getPrimaryPhaser(), 0.5);
    buttonBackground.fillRoundedRect(-90, -30, 180, 60, 5);
    buttonBackground.lineStyle(2, themeManager.getNeutralPhaser(), 0.5);
    buttonBackground.strokeRoundedRect(-90, -30, 180, 60, 5);

    const sellText = scene.add.text(16, 0, '→🪙', {
        fontSize: '32px',
        color: themeManager.getText(),
        fontStyle: 'bold',
        fontFamily: 'Arial, sans-serif',
        stroke: themeManager.getBackground(),
        strokeThickness: 2
    }).setOrigin(0.5);

    const priceText = scene.add.text(32, -15, '0', {
        fontSize: '24px',
        color: themeManager.getText(),
        fontStyle: 'bold',
        fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    const weaponImage = scene.add.image(-40, 0, '').setDisplaySize(6, 6);

    sellButtonContainer.add([buttonBackground, weaponImage, sellText, priceText]);
    sellButtonContainer.setInteractive(new Phaser.Geom.Rectangle(-90, -30, 180, 60), Phaser.Geom.Rectangle.Contains);

    sellButtonContainer.on('pointerdown', () => {
        const weapon = getWeapon();
        if (weapon?.durability > 0) {
            onSell();
        }
    });

    sellButtonContainer.on('pointerover', () => sellButtonContainer.setScale(1.1));
    sellButtonContainer.on('pointerout', () => sellButtonContainer.setScale(1));
    sellButtonContainer.setVisible(false);

    return {
        updateButton: () => {
            const weapon = getWeapon();
            if (weapon?.durability > 0) {
                sellButtonContainer.setVisible(true);
                priceText.setText(weapon.price.toString());
                weaponImage.setTexture(
                    'weapon-' + weapon.default.category + '-badge',
                    weapon.default.id + '-badge'
                );
                weaponImage.setDisplaySize(40, 40);
            }
        },
        hideButton: () => {
            sellButtonContainer.setVisible(false);
        }
    };
}
