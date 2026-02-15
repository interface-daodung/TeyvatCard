import Phaser from 'phaser';
import { themeManager } from '../../core/ThemeManager.js';
import { createCardImage } from './libraryCardAtlas.js';
import type { ContainerWithCardData, LibraryCardData } from './types.js';

export interface CreateLibraryCardOptions {
    width?: number;
    height?: number;
}

const DEFAULT_WIDTH = 160;
const DEFAULT_HEIGHT = 274.3;

/**
 * Tạo một thẻ thư viện (container: ảnh, nền, tên). Gán cardIndex và cardData vào container.
 */
export function createLibraryCard(
    scene: Phaser.Scene,
    cardIndex: number,
    cardData: LibraryCardData | null,
    options: CreateLibraryCardOptions = {}
): ContainerWithCardData {
    const width = options.width ?? DEFAULT_WIDTH;
    const height = options.height ?? DEFAULT_HEIGHT;
    const rexUI = (scene as any).rexUI;

    const background = rexUI.add.roundRectangle({
        x: 0,
        y: 0,
        width: width + 4,
        height: height + 4,
        strokeColor: themeManager.getTextPhaser(),
        strokeThickness: 2,
        radius: Math.min(width, height) * 0.08
    });

    const cardImage = createCardImage(scene, cardData, width, height);

    const cardName = cardData ? cardData.name : `Card ${cardIndex}`;
    const text = scene.add.text(0, height * 0.35, cardName, {
        fontSize: Math.max(8, width * 0.12),
        color: themeManager.getText(),
        wordWrap: { width: 175 },
        fontFamily: 'Arial',
        stroke: themeManager.getBackground(),
        strokeThickness: Math.max(1, width * 0.02)
    }).setOrigin(0.5);

    const child = scene.add.container(0, 0, [cardImage, background, text]) as ContainerWithCardData;
    child.setSize(width, height);
    child.cardIndex = cardIndex;
    child.cardData = cardData;
    child.name = `card_${cardIndex}`;

    return child;
}
