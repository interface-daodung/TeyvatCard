import Card from '../Card.js';
import type { CreateDisplayResult, DisplayPosition } from '../Card.js';
import type { SceneWithGameManager } from '../Card.js';

export default class Food extends Card {
    food!: number;
    foodDisplay!: CreateDisplayResult;

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number, name: string, nameId: string) {
        super(scene, x, y, index, name, nameId, 'food');
    }

    addDisplayHUD(): void {
        this.foodDisplay = this.createDisplay(
            { fillColor: 0xff6600, text: this.food.toString() },
            'rightBottom' as DisplayPosition
        );
    }

    seasoning(power: number): void {
        this.food += power;
        this.foodDisplay.updateText(this.food);
    }
}
