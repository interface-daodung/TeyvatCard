import Phaser from 'phaser';
import TextureManager from '../../core/TextureManager.js';
import type { LibraryCardData } from './types.js';

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
        return TextureManager.image(scene, 0, 0, 'empty').setDisplaySize(width, height);
    }

    if (TextureManager.has(cardData.id)) {
        return TextureManager.image(scene, 0, 0, cardData.id).setDisplaySize(width, height);
    }

    return TextureManager.image(scene, 0, 0, 'empty').setDisplaySize(width, height);
}
