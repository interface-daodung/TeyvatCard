import type Phaser from 'phaser';
import TextureManager from '../../core/TextureManager.js';

export interface CardImageInput {
    scene: Phaser.Scene;
    nameId: string;
    /** Giữ lại để tương thích call-site cũ */
    type?: string;
    category?: string;
    clan?: string;
}

export function createCardImage(input: CardImageInput): Phaser.GameObjects.Image {
    if (TextureManager.has(input.nameId)) {
        return TextureManager.image(input.scene, 0, 0, input.nameId);
    }

    return TextureManager.image(input.scene, 0, 0, 'empty');
}
