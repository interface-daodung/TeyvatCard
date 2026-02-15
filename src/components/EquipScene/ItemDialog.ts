import Phaser from 'phaser';
import { localizationManager } from '../../utils/LocalizationManager.js';
import { themeManager } from '../../core/ThemeManager.js';
import type { Item, EquipItemData } from './types.js';

export interface ShowItemDialogOptions {
    isFullEquipmentSlot: () => boolean;
    addEquipmentSlot: (item: Item) => void;
    clearEquipmentSlot: (nameId: string) => void;
    listItems: Map<string, EquipItemData>;
}

export function showItemDialog(
    scene: Phaser.Scene,
    item: Item,
    equipSlot: boolean,
    options: ShowItemDialogOptions
): void {
    const { width, height } = scene.scale;

    const overlay = scene.add.graphics();
    overlay.fillStyle(themeManager.getBackgroundPhaser(), 0.8);
    overlay.fillRect(0, 0, width, height);

    const dialogWidth = Math.floor(width * 0.9);
    const dialogHeight = 500;
    const dialogX = width / 2;
    const dialogY = height / 2;

    const dialogContainer = scene.add.container(dialogX, dialogY);

    const dialogBg = scene.add.graphics();
    dialogBg.fillStyle(themeManager.getSurfacePhaser(), 0.98);
    dialogBg.lineStyle(3, themeManager.getSecondaryPhaser(), 1);
    dialogBg.fillRoundedRect(-dialogWidth / 2, -dialogHeight / 2, dialogWidth, dialogHeight, 20);
    dialogBg.strokeRoundedRect(-dialogWidth / 2, -dialogHeight / 2, dialogWidth, dialogHeight, 20);

    const titleText = scene.add.text(0, -dialogHeight / 2 + 30, item.name, {
        fontSize: '32px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    const levelText = scene.add.text(0, -dialogHeight / 2 + 60, localizationManager.t('level_label', { level: item.level }), {
        fontSize: '16px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    const itemIcon = scene.add.image(0, -120, 'item', item.image);
    itemIcon.setDisplaySize(180, 180);
    itemIcon.setOrigin(0.5);

    const descriptionText = scene.add.text(0, 0, item.description, {
        fontSize: '24px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        lineSpacing: 10
    }).setOrigin(0.5);

    const powerBg = scene.add.graphics();
    powerBg.fillStyle(themeManager.getSecondaryPhaser(), 0.9);
    powerBg.lineStyle(2, themeManager.getSurfacePhaser(), 1);
    powerBg.fillRoundedRect(-210, 60, 180, 40, 10);
    powerBg.strokeRoundedRect(-210, 60, 180, 40, 10);
    const powerText = scene.add.text(-120, 80, localizationManager.t('power_label', { power: item.power }), {
        fontSize: '18px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    const cooldownBg = scene.add.graphics();
    cooldownBg.fillStyle(themeManager.getSecondaryPhaser(), 0.9);
    cooldownBg.lineStyle(2, themeManager.getSurfacePhaser(), 1);
    cooldownBg.fillRoundedRect(30, 60, 180, 40, 10);
    cooldownBg.strokeRoundedRect(30, 60, 180, 40, 10);
    const cooldownText = scene.add.text(120, 80, localizationManager.t('cooldown_label', { cooldown: item.cooldown }), {
        fontSize: '18px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    const buttonContainer = scene.add.container(0, dialogHeight / 2 - 50);

    const priceText = scene.add.text(-200, -42, localizationManager.t('coin_amount', { amount: item.getPrice() }), {
        fontSize: '20px',
        color: themeManager.getText(),
        fontStyle: 'bold',
        fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    priceText.setAlpha(0);

    const upgradeButton = scene.add.text(-200, 0, item.level === 0 ? localizationManager.t('unlock') : item.isUpgrade() ? localizationManager.t('upgrade') : localizationManager.t('level_max'), {
        fontSize: '20px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        backgroundColor: item.isUpgrade() ? themeManager.getPrimary() : themeManager.getSecondary(),
        padding: { x: 25, y: 12 }
    }).setOrigin(0.5);
    upgradeButton.setStroke(themeManager.getPrimary(), 2);

    function closeDialog(): void {
        overlay.destroy();
        dialogContainer.destroy();
        scene.input.keyboard.off('keydown-ESC');
    }

    if (item.isUpgrade()) {
        upgradeButton.setInteractive({ useHandCursor: true });
        upgradeButton.on('pointerover', () => { upgradeButton.setScale(1.1); priceText.setAlpha(1); });
        upgradeButton.on('pointerout', () => { upgradeButton.setScale(1); priceText.setAlpha(0); });
        upgradeButton.on('pointerdown', () => {
            if (item.upgrade()) {
                descriptionText.setText(item.description);
                powerText.setText(localizationManager.t('power_label', { power: item.power }));
                cooldownText.setText(localizationManager.t('cooldown_label', { cooldown: item.cooldown }));
                levelText.setText(localizationManager.t('level_label', { level: item.level }));
                priceText.setText(localizationManager.t('coin_amount', { amount: item.getPrice() }));
                if (!item.isUpgrade()) {
                    upgradeButton.setText(localizationManager.t('level_max'));
                    upgradeButton.setStyle({ backgroundColor: themeManager.getPrimary() });
                    upgradeButton.disableInteractive();
                    upgradeButton.off('pointerover');
                    upgradeButton.off('pointerout');
                    upgradeButton.off('pointerdown');
                    priceText.setAlpha(0);
                } else if (item.level > 0) {
                    upgradeButton.setText(localizationManager.t('upgrade'));
                }
            }
        });
    } else {
        upgradeButton.disableInteractive();
    }

    const selectButton = scene.add.text(0, 0, equipSlot ? localizationManager.t('deselect') : localizationManager.t('select'), {
        fontSize: '20px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        backgroundColor: themeManager.getPrimary(),
        padding: { x: 25, y: 12 }
    }).setOrigin(0.5);
    selectButton.setStroke(themeManager.getPrimary(), 2);

    if (!equipSlot && options.isFullEquipmentSlot()) {
        selectButton.setVisible(false);
    } else {
        selectButton.setInteractive({ useHandCursor: true });
        selectButton.on('pointerover', () => selectButton.setScale(1.1));
        selectButton.on('pointerout', () => selectButton.setScale(1));
        selectButton.on('pointerdown', () => {
            if (equipSlot) {
                options.clearEquipmentSlot(item.nameId);
                options.listItems.get(item.nameId)?.container?.setVisible(true);
            } else {
                options.addEquipmentSlot(item);
                options.listItems.get(item.nameId)?.container?.setVisible(false);
            }
            closeDialog();
        });
    }

    const closeButton = scene.add.text(200, 0, localizationManager.t('back_short'), {
        fontSize: '20px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        backgroundColor: themeManager.getPrimary(),
        padding: { x: 25, y: 12 }
    }).setOrigin(0.5);
    closeButton.setStroke(themeManager.getPrimary(), 2);
    closeButton.setInteractive({ useHandCursor: true });
    closeButton.on('pointerover', () => closeButton.setScale(1.1));
    closeButton.on('pointerout', () => closeButton.setScale(1));
    closeButton.on('pointerdown', () => closeDialog());

    buttonContainer.add(upgradeButton);
    buttonContainer.add(priceText);
    buttonContainer.add(selectButton);
    buttonContainer.add(closeButton);

    dialogContainer.add([dialogBg, titleText, levelText, itemIcon, descriptionText, powerBg, powerText, cooldownBg, cooldownText, buttonContainer]);

    overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
    scene.input.keyboard.on('keydown-ESC', () => closeDialog());
}
