import Food from '../../../modules/typeCard/food.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class Pizza extends Food {
    static DEFAULT = {
        id: 'pizza',
        name: 'Pizza',
        type: 'food',
        description: 'Pizza - Bánh pizza Ý hồi phục sức khỏe và tăng sức mạnh tấn công.',
        rarity: 2
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, Pizza.DEFAULT.name, Pizza.DEFAULT.id, Pizza.DEFAULT.type);
        (this as any).rarity = Pizza.DEFAULT.rarity;
        this.description = Pizza.DEFAULT.description;
        this.food = this.GetRandom(3, 9);
        this.createCard();
        scene.add.existing(this);
    }

    CardEffect(): boolean {
        super.CardEffect();
        (this.scene.gameManager?.cardManager.CardCharacter as any)?.heal(this.food);
        return false;
    }
}
