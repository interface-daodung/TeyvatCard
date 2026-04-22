import Phaser from 'phaser';
import { SpritesheetWrapper } from '../../utils/SpritesheetWrapper.js';
import { DamageElement } from '@/src/modules/typeCard/character.js';
import TextureManager from '@/src/core/TextureManager.js';

export function animationCatalyst(
    scene: Phaser.Scene,
    x: number,
    y: number,  
    element: DamageElement
): Phaser.GameObjects.Sprite {
    const frameName = `catalyst-${element}-animations`;
    console.log('[animationCatalyst] called', { x, y, element, frameName });
    const animationFrame = TextureManager.getAnimationFrame(frameName);
    const textureFrameTotal = scene.textures.exists(frameName)
        ? scene.textures.get(frameName).getFrameNames().length
        : undefined;
    const frameTotal = animationFrame?.frameTotal ?? textureFrameTotal ?? 1;
    const frameRate = animationFrame?.frameRate ?? Math.max(1, Math.round(frameTotal / 0.6));
    console.log('[animationCatalyst] frameTotal', frameTotal);
    console.log('[animationCatalyst] frameRate', frameRate);
    return SpritesheetWrapper.animationEffect(
        scene,
        x,
        y,
        frameName,
        170,
        170,
        { start: 0, end: frameTotal -1},
        frameRate
    );
}