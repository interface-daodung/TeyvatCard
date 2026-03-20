import type Phaser from 'phaser';
import type GameManager from '../../core/GameManager.js';

export interface ItemData {
    image: string;
    cooldown: number;
    effect: (gameManager: GameManager) => boolean;
}

export interface ItemButton {
    item: ItemData;
    itemButton: Phaser.GameObjects.Container;
    cooldown: () => number;
    cooldowninning: (count: number) => void;
}

export interface SkillButton {
    skillButton: Phaser.GameObjects.Container;
    setCooldown: (cooldown: number) => void;
    setTextureKey: (textureKey: string) => void;
}

export interface SellButton {
    updateButton: () => void;
    hideButton: () => void;
}

export interface GameUIRefs {
    stageText: Phaser.GameObjects.Text;
    highScoreText: Phaser.GameObjects.Text;
    coinText: Phaser.GameObjects.Text;
}
