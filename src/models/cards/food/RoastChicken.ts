import Food from '../../../modules/typeCard/food.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class RoastChicken extends Food {
    static DEFAULT = {
        id: 'roast-chicken',
        name: 'Roast Chicken',
        type: 'food',
        description: 'Roast Chicken - Gà nướng thơm ngon hồi phục sức khỏe và tăng khả năng phòng thủ.',
        rarity: 2
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, RoastChicken.DEFAULT.name, RoastChicken.DEFAULT.id);
        (this as any).rarity = RoastChicken.DEFAULT.rarity;
        this.description = RoastChicken.DEFAULT.description;
        this.food = this.GetRandom(1, 6);
        this.createCard();
        scene.add.existing(this);
    }

    CardEffect(): boolean {
        super.CardEffect();
        (this.scene.gameManager?.cardManager.CardCharacter as any)?.heal(this.food);
        return false;
    }
}
