import Phaser from 'phaser';
import { themeManager } from '../../core/ThemeManager.js';
import { dataManager } from '../../core/DataManager.js';
import itemFactory from '../../modules/ItemFactory.js';
import { localizationManager } from '../../utils/LocalizationManager.js';
import type { ItemData, ItemButton } from './types.js';

export function createItemButtonsFromStorage(): ItemData[] {
    try {
        const equipmentData = dataManager.get<string[] | null>('equipment');
        if (Array.isArray(equipmentData) && equipmentData.length > 0) {
            return equipmentData.map((nameId: string) => itemFactory.createItem(nameId));
        }
        return [];
    } catch {
        return [];
    }
}

export function createItemButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    itemData: ItemData,
    onUse: (itemData: ItemData) => boolean,
    onNotReady: () => void
): ItemButton {
    const itemButton = scene.add.container(x, y);
    const buttonSize = 68;

    const backgroundItem = scene.add.graphics();
    backgroundItem.fillStyle(themeManager.getSurfacePhaser(), 1);
    backgroundItem.fillRoundedRect(-buttonSize / 2, -buttonSize / 2, buttonSize, buttonSize, 20);
    backgroundItem.setAlpha(0.5);

    const itemImage = scene.add.image(0, 0, 'item', itemData.image);
    itemImage.setDisplaySize(80, 80);

    const countText = scene.add.text(buttonSize / 2, -buttonSize / 2, itemData.cooldown.toString(), {
        fontSize: '24px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        stroke: themeManager.getBackground(),
        strokeThickness: 5
    }) as Phaser.GameObjects.Text & { cooldown: number };
    countText.setOrigin(0.5);
    countText.cooldown = itemData.cooldown;

    itemButton.add([backgroundItem, itemImage, countText]);
    itemButton.setSize(buttonSize, buttonSize);
    itemButton.setInteractive();

    itemButton.on('pointerover', () => itemButton.setScale(1.1));
    itemButton.on('pointerout', () => itemButton.setScale(1));
    itemButton.on('pointerdown', () => {
        if (onUse(itemData)) {
            countText.cooldown = itemData.cooldown;
            countText.setText(countText.cooldown.toString());
            if (countText.cooldown > 0) {
                countText.setVisible(true);
                itemImage.setTint(themeManager.getNeutralPhaser());
                itemButton.disableInteractive();
            }
        } else {
            onNotReady();
        }
    });

    if (itemData.cooldown > 0) {
        countText.setVisible(true);
        itemImage.setTint(themeManager.getNeutralPhaser());
        itemButton.disableInteractive();
    } else {
        countText.setVisible(false);
        itemImage.clearTint();
        itemButton.setInteractive();
    }

    return {
        item: itemData,
        itemButton,
        cooldown: () => countText.cooldown,
        cooldowninning: (count: number) => {
            countText.cooldown = Math.max(0, countText.cooldown - count);
            countText.setText(countText.cooldown.toString());
            if (countText.cooldown <= 0) {
                countText.setVisible(false);
                itemImage.clearTint();
                itemButton.setInteractive();
            }
        }
    };
}

/** Hiển thị toast "item not ready" giữa màn, tự xóa sau 1s. */
export function showItemNotReadyToast(scene: Phaser.Scene): void {
    const { width, height } = scene.scale;
    const t = scene.add.text(width * 0.5, height * 0.5, localizationManager.t('item_not_ready'), {
        fontSize: '24px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        backgroundColor: themeManager.getBackground(),
        padding: { x: 25, y: 12 },
        stroke: themeManager.getBackground(),
        strokeThickness: 5
    }).setOrigin(0.5).setDepth(2000).setAlpha(0.7);
    scene.time.delayedCall(1000, () => t.destroy());
}
