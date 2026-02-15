import Phaser from 'phaser';
import type { LibraryCardData } from './types.js';

/**
 * Trả về atlas key và frame id cho thẻ thư viện (weapon → weapon-category, enemy → enemy-clan).
 */
export function getLibraryCardAtlasKey(cardData: LibraryCardData): { atlasKey: string; frameId: string } {
    let atlasKey = cardData.type;
    if (cardData.type === 'weapon' && cardData.category) {
        atlasKey = 'weapon-' + cardData.category;
    } else if (cardData.type === 'enemy' && cardData.clan) {
        atlasKey = 'enemy-' + cardData.clan;
    }
    return { atlasKey, frameId: cardData.id };
}

/**
 * Tạo ảnh thẻ (từ atlas hoặc fallback 'empty') và set display size.
 */
export function createCardImage(
    scene: Phaser.Scene,
    cardData: LibraryCardData | null,
    width: number,
    height: number
): Phaser.GameObjects.Image {
    if (!cardData) {
        return scene.add.image(0, 0, 'empty').setDisplaySize(width, height);
    }
    try {
        const { atlasKey, frameId } = getLibraryCardAtlasKey(cardData);
        if (scene.textures.exists(atlasKey)) {
            const texture = scene.textures.get(atlasKey);
            if (texture.getFrameNames().includes(frameId)) {
                return scene.add.image(0, 0, atlasKey, frameId).setDisplaySize(width, height);
            }
        }
    } catch {
        // fallback
    }
    return scene.add.image(0, 0, 'empty').setDisplaySize(width, height);
}
