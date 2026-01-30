import Food from '../../../modules/typeCard/food.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class Macarons extends Food {
    static DEFAULT = {
        id: 'macarons',
        name: 'Macarons',
        type: 'food',
        description: 'Macarons - Bánh ngọt Pháp hồi phục sức khỏe và tăng tinh thần.',
        rarity: 3
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, Macarons.DEFAULT.name, Macarons.DEFAULT.id, Macarons.DEFAULT.type);
        (this as any).rarity = Macarons.DEFAULT.rarity;
        this.description = Macarons.DEFAULT.description;
        this.food = this.GetRandom(6, 9);
        this.createCard();
        scene.add.existing(this);
    }

    CardEffect(): boolean {
        super.CardEffect();
        (this.scene.gameManager?.cardManager.CardCharacter as any)?.heal(this.food);
        return false;
    }
}
