import Phaser from 'phaser';
import { localizationManager } from '../../core/LocalizationManager.js';
import { themeManager } from '../../core/ThemeManager.js';
import TextureManager from '../../core/TextureManager.js';
import { I18nText } from '../shared/index.js';
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

    const dialogWidth = 600;
    const dialogHeight = 520;
    const halfW = dialogWidth / 2;
    const halfH = dialogHeight / 2;
    const pad = 28;

    const bg = scene.add.rectangle(-width / 2, -height / 2, width, height, themeManager.getBackgroundPhaser(), 0.7)
        .setOrigin(0, 0)
        .setInteractive();

    const dialogBg = scene.add.graphics();
    dialogBg.fillStyle(themeManager.getSurfacePhaser(), 0.95);
    dialogBg.lineStyle(3, themeManager.getPrimaryPhaser());
    dialogBg.fillRoundedRect(-halfW, -halfH, dialogWidth, dialogHeight, 26);
    dialogBg.strokeRoundedRect(-halfW, -halfH, dialogWidth, dialogHeight, 26);

    const nameY = -halfH + pad;
    const typeY = nameY + 38;
    const cardW = 120;
    const cardH = 205.7;
    const cardTop = typeY + 22;
    const cardY = cardTop + cardH / 2;

    const cardImg = TextureManager.has(cardData.id)
        ? TextureManager.image(scene, 0, 0, cardData.id)
        : TextureManager.image(scene, 0, 0, 'empty');
    cardImg.setDisplaySize(cardW, cardH);
    cardImg.setPosition(0, cardY);

    const isCharacter = cardData.type === 'character';
    const nameKey = isCharacter ? `character.${cardData.id}.name` : `adventureCard.${cardData.id}.name`;
    const nameText = new I18nText(scene, 0, nameY, nameKey, {
        fontSize: '30px',
        color: themeManager.getText(),
        fontFamily: 'Arial'
    });
    nameText.setOrigin(0.5);

    const typeText = new I18nText(scene, 0, typeY, 'type_label', {
        fontSize: '18px',
        color: themeManager.getAccent(),
        fontFamily: 'Arial'
    }, { type: localizationManager.t(cardData.type) || cardData.type });
    typeText.setOrigin(0.5);

    // Lắng nghe đổi ngôn ngữ để cập nhật lại param của typeText (vốn không tự dịch)
    const onLangChange = () => {
        typeText.setI18nParams({ type: localizationManager.t(cardData.type) || cardData.type });
    };
    scene.game.events.on('languageChanged', onLangChange);

    const descY = cardY + cardH / 2 + pad + 24;
    const descKey = isCharacter ? `character.${cardData.id}.description` : `adventureCard.${cardData.id}.description`;
    const descWrapWidth = dialogWidth - 100;
    const descText = new I18nText(scene, 0, descY, descKey, {
        fontSize: '17px',
        color: themeManager.getText(),
        fontFamily: 'Arial',
        wordWrap: { width: descWrapWidth },
        align: 'center'
    });
    descText.setOrigin(0.5, 0);

    const closeBtnW = 88;
    const closeBtnH = 58;
    const closeBtnY = halfH - pad - closeBtnH / 2 - 8;
    const closeBtn = scene.add.graphics();
    closeBtn.fillStyle(themeManager.getPrimaryPhaser());
    closeBtn.fillRoundedRect(-closeBtnW / 2, -closeBtnH / 2, closeBtnW, closeBtnH, 10);
    closeBtn.setPosition(0, closeBtnY);

    const closeText = new I18nText(scene, 0, closeBtnY, 'close', {
        fontSize: '24px',
        color: themeManager.getText(),
        fontFamily: 'Arial'
    });
    closeText.setOrigin(0.5);

    const hide = () => {
        scene.game.events.off('languageChanged', onLangChange);
        container.destroy();
        if (escKey) escKey.destroy();
        onClose();
    };

    closeBtn.setInteractive(new Phaser.Geom.Rectangle(-closeBtnW / 2, -closeBtnH / 2, closeBtnW, closeBtnH), Phaser.Geom.Rectangle.Contains);
    closeBtn.on('pointerover', () => {
        closeBtn.clear();
        closeBtn.setScale(1.2);
        closeBtn.fillStyle(themeManager.getSecondaryPhaser());
        closeBtn.fillRoundedRect(-closeBtnW / 2, -closeBtnH / 2, closeBtnW, closeBtnH, 10);
    });
    closeBtn.on('pointerout', () => {
        closeBtn.clear();
        closeBtn.setScale(1);
        closeBtn.fillStyle(themeManager.getPrimaryPhaser());
        closeBtn.fillRoundedRect(-closeBtnW / 2, -closeBtnH / 2, closeBtnW, closeBtnH, 10);
    });
    closeBtn.on('pointerdown', hide);

    const escKey = scene.input.keyboard.addKey('ESC');
    escKey.on('down', hide);

    container.add([bg, dialogBg, cardImg, nameText, typeText, descText, closeBtn, closeText]);
    scene.add.existing(container);

    return { hide };
}
