import Phaser from 'phaser';
import { localizationManager } from '../../utils/LocalizationManager.js';
import { themeManager } from '../../core/ThemeManager.js';
import type { PackageDef } from './types.js';

/**
 * Tạo nút gói thanh toán. Click gọi onClick(pkg). Khi isStarter && starterPurchased thì disabled (sold out).
 */
export function createPackageButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    w: number,
    h: number,
    pkg: PackageDef,
    onClick: (pkg: PackageDef) => void,
    starterPurchased: boolean
): Phaser.GameObjects.Container {
    const isStarter = pkg.isStarter === true;
    const isDisabled = isStarter && starterPurchased;

    const fillColor = themeManager.getPrimaryPhaser();
    const strokeColor = isDisabled
        ? themeManager.getNeutralPhaser()
        : isStarter
            ? themeManager.getTextPhaser()
            : themeManager.getSecondaryPhaser();

    const rect = scene.add.rectangle(x, y, w, h, fillColor);
    rect.setStrokeStyle(3, strokeColor);
    if (!isDisabled) rect.setInteractive({ useHandCursor: true });

    const titleText = isStarter
        ? localizationManager.t('package_starter')
        : localizationManager.t(pkg.priceKey);
    const descText = isStarter
        ? localizationManager.t('package_starter_desc')
        : localizationManager.t(pkg.coinsKey);

    const title = scene.add.text(x, y - 12, titleText, {
        fontSize: '26px',
        color: isDisabled ? themeManager.getNeutral() : themeManager.getText(),
        fontFamily: 'Arial',
        stroke: themeManager.getBackground(),
        strokeThickness: 2
    }).setOrigin(0.5);

    const desc = scene.add.text(x, y + 12, descText, {
        fontSize: '20px',
        color: isDisabled ? themeManager.getNeutral() : themeManager.getText(),
        fontFamily: 'Arial'
    }).setOrigin(0.5);

    if (isDisabled) {
        const soldOut = scene.add.text(x, y + 12, localizationManager.t('package_sold_out'), {
            fontSize: '20px',
            color: themeManager.getAccent(),
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        return scene.add.container(0, 0, [rect, title, soldOut]);
    }

    rect.on('pointerover', () => {
        rect.setFillStyle(isStarter ? themeManager.getSecondaryPhaser() : themeManager.getPrimaryPhaser());
        rect.setStrokeStyle(3, themeManager.getTextPhaser());
    });
    rect.on('pointerout', () => {
        rect.setFillStyle(fillColor);
        rect.setStrokeStyle(3, strokeColor);
    });
    rect.on('pointerdown', () => onClick(pkg));

    return scene.add.container(0, 0, [rect, title, desc]);
}
