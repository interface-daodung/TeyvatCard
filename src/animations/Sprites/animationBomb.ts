import Phaser from 'phaser';
import { SpritesheetWrapper } from '../../utils/SpritesheetWrapper.js';

export function animationBomb(
    scene: Phaser.Scene,
    x: number,
    y: number
): Phaser.GameObjects.Sprite {

    return SpritesheetWrapper.animationEffect(
        scene,
        x,
        y,
        'bomb-animations',
        170,
        170,
        { start: 0, end: 11 },
        24
    );
}