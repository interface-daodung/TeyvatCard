import Phaser from 'phaser';
import { localizationManager } from '../../core/LocalizationManager.js';
import { themeManager } from '../../core/ThemeManager.js';
import { I18nText } from '../shared/index.js';
import { createCardImage } from './libraryCardAtlas.js';
import type { LibraryCardData } from './types.js';

export interface CardInfoDialogHandle {
    hide: () => void;
}

/**
 * Hiển thị dialog thông tin thẻ. Đóng bằng nút Close hoặc ESC. Gọi onClose khi đóng.
 */
export function showCardInfoDialog(
    scene: Phaser.Scene,
    cardData: LibraryCardData,
    onClose: () => void
): CardInfoDialogHandle {
    const { width, height } = scene.scale;
    const container = scene.add.container(width / 2, height / 2);
    container.setDepth(120);

    const bg = scene.add.rectangle(-width / 2, -height / 2, width, height, themeManager.getBackgroundPhaser(), 0.7)
        .setOrigin(0, 0)
        .setInteractive();

    const dialogBg = scene.add.graphics();
    dialogBg.fillStyle(themeManager.getSurfacePhaser(), 0.95);
    dialogBg.lineStyle(3, themeManager.getPrimaryPhaser());
    dialogBg.fillRoundedRect(-200, -150, 400, 300, 20);
    dialogBg.strokeRoundedRect(-200, -150, 400, 300, 20);

    const cardImg = createCardImage(scene, cardData, 80, 137.14);

    const nameText = scene.add.text(0, -120, cardData.name, {
        fontSize: '24px',
        color: themeManager.getText(),
        fontFamily: 'Arial'
    });
    nameText.setOrigin(0.5);

    const typeText = scene.add.text(0, -100, localizationManager.t('type_label', { type: localizationManager.t(cardData.type) || cardData.type }), {
        fontSize: '16px',
        color: themeManager.getAccent(),
        fontFamily: 'Arial'
    });
    typeText.setOrigin(0.5);

    const descText = scene.add.text(0, 100, cardData.description, {
        fontSize: '14px',
        color: themeManager.getText(),
        fontFamily: 'Arial',
        wordWrap: { width: 300 },
        align: 'center'
    });
    descText.setOrigin(0.5);

    const closeBtn = scene.add.graphics();
    closeBtn.fillStyle(themeManager.getPrimaryPhaser());
    closeBtn.fillRoundedRect(-30, -25, 60, 50, 8);
    closeBtn.setPosition(0, 190);

    const closeText = new I18nText(scene, 0, 190, 'close', {
        fontSize: '24px',
        color: themeManager.getText(),
        fontFamily: 'Arial'
    });
    closeText.setOrigin(0.5);

    const hide = () => {
        container.destroy();
        if (escKey) escKey.destroy();
        onClose();
    };

    closeBtn.setInteractive(new Phaser.Geom.Rectangle(-30, -25, 60, 50), Phaser.Geom.Rectangle.Contains);
    closeBtn.on('pointerover', () => {
        closeBtn.clear();
        closeBtn.setScale(1.2);
        closeBtn.fillStyle(themeManager.getSecondaryPhaser());
        closeBtn.fillRoundedRect(-30, -25, 60, 50, 8);
    });
    closeBtn.on('pointerout', () => {
        closeBtn.clear();
        closeBtn.setScale(1);
        closeBtn.fillStyle(themeManager.getPrimaryPhaser());
        closeBtn.fillRoundedRect(-30, -25, 60, 50, 8);
    });
    closeBtn.on('pointerdown', hide);

    const escKey = scene.input.keyboard.addKey('ESC');
    escKey.on('down', hide);

    container.add([bg, dialogBg, cardImg, nameText, typeText, descText, closeBtn, closeText]);
    scene.add.existing(container);

    return { hide };
}
