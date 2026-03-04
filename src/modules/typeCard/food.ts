import Card from '../card/Card.js';
import type { CardDefault } from '../card/Card.js';
import type { CreateDisplayResult, DisplayPosition } from '../card/Card.js';
import type { SceneWithGameManager } from '../card/Card.js';

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

    takeDamage(damage: number, type: 'damage'): number {
        // super.takeDamage(damage, type); //thêm hiệu ứng dmg mặc định
        this.food = Math.max(0, this.food - damage);
        this.foodDisplay.updateText(this.food.toString());
        // this.showPopup(damage, type); cầm sửa 
        if (this.food <= 0) {
            this.die();
        }
        return this.food;
    }

    CardEffect(): boolean {
        super.CardEffect();
        (this.scene.gameManager?.cardManager.CardCharacter as any)?.heal(this.food);
        return false;
    }
}
