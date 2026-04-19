import Phaser from 'phaser';
import { themeManager } from '../../core/ThemeManager.js';
import TextureManager from '../../core/TextureManager.js';
import type { EquipmentSlot, Item } from './types.js';

const SLOT_SIZE = 120;
const SLOT_SPACING = 30;

/**
 * Tạo 3 equipment slots. Điền slotsRef[0..2] với { item: null, image }. Click gọi onSlotClick(index).
 */
export function createEquipmentSlots(
    scene: Phaser.Scene,
    width: number,
    height: number,
    slotsRef: EquipmentSlot[],
    onSlotClick: (index: number) => void
): void {
    const slotBgY = height * 0.7;
    const slotGridContainer = scene.add.container(width / 2, slotBgY);

    for (let col = 0; col < 3; col++) {
        const relativeSlotX = (col - 1) * (SLOT_SIZE + SLOT_SPACING);

        const slotContainer = scene.add.container(relativeSlotX, 0);

        const slotBg = scene.add.graphics();
        slotBg.fillStyle(themeManager.getNeutralPhaser(), 0.5);
        slotBg.lineStyle(2, themeManager.getBackgroundPhaser(), 0.5);
        slotBg.fillRoundedRect(-SLOT_SIZE / 2, -SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE, 10);
        slotBg.strokeRoundedRect(-SLOT_SIZE / 2, -SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE, 10);

        const slotImage = TextureManager.image(scene, 0, 0, 'equipment-slot');
        slotImage.setDisplaySize(SLOT_SIZE * 0.8, SLOT_SIZE * 0.8);
        slotImage.setAlpha(0.3);
        slotImage.setOrigin(0.5);

        slotContainer.add([slotBg, slotImage]);
        slotGridContainer.add(slotContainer);

        slotsRef[col] = { item: null, image: slotImage };

        slotContainer.setInteractive(new Phaser.Geom.Rectangle(-SLOT_SIZE / 2, -SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE), Phaser.Geom.Rectangle.Contains);
        slotContainer.on('pointerover', () => {
            if (slotsRef[col]?.item) slotContainer.setScale(1.1);
        });
        slotContainer.on('pointerout', () => {
            if (slotsRef[col]?.item) slotContainer.setScale(1);
        });
        slotContainer.on('pointerdown', () => onSlotClick(col));
    }
}

/** Cập nhật slot với item (hoặc null để clear). */
export function updateSlotDisplay(slot: EquipmentSlot, item: Item | null): void {
    slot.item = item;
    if (item) {
        TextureManager.setImageTexture(slot.image, item.image);
        slot.image.setDisplaySize(SLOT_SIZE, SLOT_SIZE);
        slot.image.setAlpha(1);
    } else {
        TextureManager.setImageTexture(slot.image, 'equipment-slot');
        slot.image.setDisplaySize(SLOT_SIZE * 0.8, SLOT_SIZE * 0.8);
        slot.image.setAlpha(0.3);
    }
}
