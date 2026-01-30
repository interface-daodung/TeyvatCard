import Food from '../../../modules/typeCard/food.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class MystiqueSoup extends Food {
    static DEFAULT = {
        id: 'mystique-soup',
        name: 'Mystique Soup',
        type: 'food',
        description: 'Mystique Soup - Súp bí ẩn hồi phục sức khỏe và tăng sức mạnh tạm thời.',
        rarity: 3
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, MystiqueSoup.DEFAULT.name, MystiqueSoup.DEFAULT.id);
        (this as any).rarity = MystiqueSoup.DEFAULT.rarity;
        this.description = MystiqueSoup.DEFAULT.description;
        this.food = this.GetRandom(1, 9);
        this.createCard();
        scene.add.existing(this);
    }

    CardEffect(): boolean {
        super.CardEffect();
        (this.scene.gameManager?.cardManager.CardCharacter as any)?.heal(this.food);
        return false;
    }
}
