import Phaser from 'phaser';
import { themeManager } from '../../core/ThemeManager.js';
import itemFactory from '../../modules/ItemFactory.js';
import type { Item, EquipItemData } from './types.js';

/**
 * Tạo lưới 4x3 item. Trả về listItems Map. Click item gọi onItemClick(item).
 */
export function createItemGrid(
    scene: Phaser.Scene,
    width: number,
    height: number,
    onItemClick: (item: Item) => void
): Map<string, EquipItemData> {
    const gridWidth = 4;
    const gridHeight = 3;
    const itemSize = 120;
    const spacing = 20;
    const startY = height * 0.25;

    const itemKeys = itemFactory.getItemKeys();
    const listItems = new Map<string, EquipItemData>();

    itemKeys.forEach(itemKey => {
        const item = itemFactory.createItem(itemKey) as Item;
        if (item) listItems.set(itemKey, { item, container: null });
    });

    const gridBgWidth = gridWidth * itemSize + (gridWidth - 1) * spacing + 40;
    const gridBgHeight = gridHeight * itemSize + (gridHeight - 1) * spacing + 40;
    const gridBgX = width / 2;
    const gridBgY = startY + (gridHeight * (itemSize + spacing) - spacing) / 2;

    const gridBackground = scene.add.graphics();
    gridBackground.fillStyle(themeManager.getBackgroundPhaser(), 0.5);
    gridBackground.fillRoundedRect(-gridBgWidth / 2, -gridBgHeight / 2, gridBgWidth, gridBgHeight, 20);
    gridBackground.strokeRoundedRect(-gridBgWidth / 2, -gridBgHeight / 2, gridBgWidth, gridBgHeight, 20);

    const gridContainer = scene.add.container(gridBgX, gridBgY);
    gridContainer.add(gridBackground);

    for (let row = 0; row < gridHeight; row++) {
        for (let col = 0; col < gridWidth; col++) {
            const index = row * gridWidth + col;
            const itemKey = itemKeys[index];
            if (!itemKey) continue;

            const relativeX = (col - (gridWidth - 1) / 2) * (itemSize + spacing);
            const relativeY = (row - (gridHeight - 1) / 2) * (itemSize + spacing);

            const itemContainer = scene.add.container(relativeX, relativeY);

            const itemBg = scene.add.graphics();
            itemBg.fillStyle(themeManager.getNeutralPhaser(), 0.3);
            itemBg.fillRoundedRect(-itemSize / 2, -itemSize / 2, itemSize, itemSize, 15);
            itemBg.strokeRoundedRect(-itemSize / 2, -itemSize / 2, itemSize, itemSize, 15);

            const itemIcon = scene.add.image(0, 0, 'item', itemKey);
            itemIcon.setDisplaySize(itemSize, itemSize);
            itemIcon.setOrigin(0.5);

            itemContainer.add([itemBg, itemIcon]);
            gridContainer.add(itemContainer);

            const itemData = listItems.get(itemKey);
            if (itemData) itemData.container = itemContainer;

            itemContainer.setInteractive(new Phaser.Geom.Rectangle(-itemSize / 2, -itemSize / 2, itemSize, itemSize), Phaser.Geom.Rectangle.Contains);
            itemContainer.on('pointerover', () => itemContainer.setScale(1.1));
            itemContainer.on('pointerout', () => itemContainer.setScale(1));
            itemContainer.on('pointerdown', () => {
                const data = listItems.get(itemKey);
                if (data?.item) onItemClick(data.item);
            });
        }
    }

    return listItems;
}
