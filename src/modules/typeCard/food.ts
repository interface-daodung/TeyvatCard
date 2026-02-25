import Card from '../Card.js';
import type { CardDefault } from '../Card.js';
import type { CreateDisplayResult, DisplayPosition } from '../Card.js';
import type { SceneWithGameManager } from '../Card.js';

export default class Food extends Card {
    food!: number;
    foodDisplay!: CreateDisplayResult;

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number, name: string, nameId: string) {
        super(scene, x, y, index, name, nameId, 'food');
    }

    override applyConfig(config: CardDefault): void {
        super.applyConfig(config);
        if (config.foodMin != null && config.foodMax != null) {
            this.food = this.GetRandom(config.foodMin, config.foodMax);
        }
    }

    addDisplayHUD(): void {
        this.foodDisplay = this.createDisplay(
            { fillColor: 0xff6600, text: this.food.toString() },
            'rightBottom' as DisplayPosition
        );
    }
    
    CardEffect(): boolean {
        super.CardEffect();
        (this.scene.gameManager?.cardManager.CardCharacter as any)?.heal(this.food);
        return false;
    }
}
