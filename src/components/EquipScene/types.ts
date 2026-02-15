import type Phaser from 'phaser';

export interface Item {
    name: string;
    nameId: string;
    image: string;
    level: number;
    power: number;
    cooldown: number;
    description: string;
    isUpgrade: () => boolean;
    upgrade: () => boolean;
    getPrice: () => number;
}

export interface EquipmentSlot {
    item: Item | null;
    image: Phaser.GameObjects.Image;
}

export interface EquipItemData {
    item: Item;
    container: Phaser.GameObjects.Container | null;
}
