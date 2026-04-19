import Phaser from 'phaser';
import { themeManager } from '../../core/ThemeManager.js';
import { dataManager } from '../../core/DataManager.js';
import { localizationManager } from '../../core/LocalizationManager.js';
import TextureManager from '../../core/TextureManager.js';
import { I18nText } from '../shared/index.js';
import { showToast } from '../PaymentScene/Toast.js';
import type { Item, EquipItemData } from './types.js';

export interface ShowItemDialogOptions {
    isFullEquipmentSlot: () => boolean;
    addEquipmentSlot: (item: Item) => void;
    clearEquipmentSlot: (nameId: string) => void;
    listItems: Map<string, EquipItemData>;
    onCoinChanged?: (newTotal: number) => void;
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

    const titleText = new I18nText(scene, 0, -dialogHeight / 2 + 30, item.name, {
        fontSize: '32px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    const levelText = new I18nText(scene, 0, -dialogHeight / 2 + 60, 'level_label', {
        fontSize: '16px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }, { level: item.level }).setOrigin(0.5);

    const itemIcon = TextureManager.image(scene, 0, -120, item.image);
    itemIcon.setDisplaySize(180, 180);
    itemIcon.setOrigin(0.5);

    const descriptionText = new I18nText(scene, 0, 0, item.description, {
        fontSize: '24px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        lineSpacing: 10
    }, {}, [{ key: 'basePower', value: item.power }]).setOrigin(0.5);

    const powerBg = scene.add.graphics();
    powerBg.fillStyle(themeManager.getSecondaryPhaser(), 0.9);
    powerBg.lineStyle(2, themeManager.getSurfacePhaser(), 1);
    powerBg.fillRoundedRect(-210, 60, 180, 40, 10);
    powerBg.strokeRoundedRect(-210, 60, 180, 40, 10);
    const powerText = new I18nText(scene, -120, 80, 'power_label', {
        fontSize: '18px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }, { power: item.power }).setOrigin(0.5);

    const cooldownBg = scene.add.graphics();
    cooldownBg.fillStyle(themeManager.getSecondaryPhaser(), 0.9);
    cooldownBg.lineStyle(2, themeManager.getSurfacePhaser(), 1);
    cooldownBg.fillRoundedRect(30, 60, 180, 40, 10);
    cooldownBg.strokeRoundedRect(30, 60, 180, 40, 10);
    const cooldownText = new I18nText(scene, 120, 80, 'cooldown_label', {
        fontSize: '18px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }, { cooldown: item.cooldown }).setOrigin(0.5);

    const buttonContainer = scene.add.container(0, dialogHeight / 2 - 50);

    const upgradeKey = item.level === 0 ? 'unlock' : item.isUpgrade() ? 'upgrade' : 'level_max';
    const priceText = new I18nText(scene, -200, -42, 'coin_amount', {
        fontSize: '20px',
        color: themeManager.getText(),
        fontStyle: 'bold',
        fontFamily: 'Arial, sans-serif'
    }, { amount: item.getPrice() }).setOrigin(0.5);
    priceText.setAlpha(0);

    const upgradeButton = new I18nText(scene, -200, 0, upgradeKey, {
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
            const price = item.getPrice();
            const totalCoin = dataManager.get<number>('totalCoin') ?? 0;
            if (totalCoin < price) {
                showToast(scene, localizationManager.t('not_enough_coin'));
                return;
            }
            dataManager.set('totalCoin', totalCoin - price);
            options.onCoinChanged?.(totalCoin - price);
            if (item.upgrade()) {
                const itemLevels = dataManager.get<Record<string, number>>('itemLevel') ?? {};
                itemLevels[item.nameId] = item.level;
                dataManager.set('itemLevel', itemLevels);
                descriptionText.setInterpolation([{ key: 'basePower', value: item.power }]);
                powerText.setI18nParams({ power: item.power });
                cooldownText.setI18nParams({ cooldown: item.cooldown });
                levelText.setI18nParams({ level: item.level });
                priceText.setI18nParams({ amount: item.getPrice() });
                if (!item.isUpgrade()) {
                    upgradeButton.setI18nKey('level_max');
                    upgradeButton.setStyle({ backgroundColor: themeManager.getPrimary() });
                    upgradeButton.disableInteractive();
                    upgradeButton.off('pointerover');
                    upgradeButton.off('pointerout');
                    upgradeButton.off('pointerdown');
                    priceText.setAlpha(0);
                } else if (item.level > 0) {
                    upgradeButton.setI18nKey('upgrade');
                }
                // Vừa mở khóa (level 0 -> 1): hiện nút chọn nếu chưa đủ slot
                if (item.level === 1 && !options.isFullEquipmentSlot()) {
                    selectButton.setVisible(true);
                    selectButton.setI18nKey('select');
                    selectButton.setInteractive({ useHandCursor: true });
                    selectButton.on('pointerover', () => selectButton.setScale(1.1));
                    selectButton.on('pointerout', () => selectButton.setScale(1));
                    selectButton.on('pointerdown', () => {
                        options.addEquipmentSlot(item);
                        options.listItems.get(item.nameId)?.container?.setVisible(false);
                        closeDialog();
                    });
                }
            }
        });
    } else {
        upgradeButton.disableInteractive();
    }

    const selectButton = new I18nText(scene, 0, 0, equipSlot ? 'deselect' : 'select', {
        fontSize: '20px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        backgroundColor: themeManager.getPrimary(),
        padding: { x: 25, y: 12 }
    }).setOrigin(0.5);
    selectButton.setStroke(themeManager.getPrimary(), 2);

    const isLocked = item.level === 0;
    if (isLocked || (!equipSlot && options.isFullEquipmentSlot())) {
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

    const closeButton = new I18nText(scene, 200, 0, 'back_short', {
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
