import Phaser from 'phaser';
import { SpritesheetWrapper } from '../../utils/SpritesheetWrapper.js';

export function animationSlash(
    scene: Phaser.Scene,
    x: number,
    y: number
): Phaser.GameObjects.Sprite {

    return SpritesheetWrapper.animationEffect(
        scene,
        x,
        y,
        'slash-animations',
        170,
        170,
        { start: 0, end: 4 },
        12
    );
}