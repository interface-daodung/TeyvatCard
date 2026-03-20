import Phaser from 'phaser';
import { SpritesheetWrapper } from '../../utils/SpritesheetWrapper.js';

export function animationCurse(
    scene: Phaser.Scene,
    x: number,
    y: number
): Phaser.GameObjects.Sprite {

    return SpritesheetWrapper.animationEffect(
        scene,
        x,
        y,
        'curse-animations',
        320,
        320,
        { start: 0, end: 8 },
        8
    );
}