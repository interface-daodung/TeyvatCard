import Phaser from 'phaser';
import { themeManager } from '../../core/ThemeManager.js';

export interface CharacterCardDisplayRefs {
    currentCardContainer: Phaser.GameObjects.Container;
    currentCardImage: Phaser.GameObjects.Image | Phaser.GameObjects.Container;
    cardBorder: Phaser.GameObjects.Graphics;
}

export function createCurrentCardDisplay(
    scene: Phaser.Scene,
    width: number,
    height: number,
    initialCardId: string
): CharacterCardDisplayRefs {
    const currentCardContainer = scene.add.container(width / 2, height * 0.65);
    const currentCardImage = scene.add.image(0, 0, 'character', initialCardId);
    currentCardImage.setDisplaySize(300, 514);

    const cardBorder = scene.add.graphics();
    cardBorder.lineStyle(4, themeManager.getTextPhaser(), 1);
    cardBorder.fillStyle(themeManager.getTextPhaser(), 1);
    cardBorder.fillRoundedRect(-152, -259, 304, 518, 28);
    cardBorder.strokeRoundedRect(-152, -259, 304, 518, 28);

    currentCardContainer.add(cardBorder);
    currentCardContainer.add(currentCardImage);

    return { currentCardContainer, currentCardImage, cardBorder };
}
