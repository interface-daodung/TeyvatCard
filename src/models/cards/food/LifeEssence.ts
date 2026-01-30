import Food from '../../../modules/typeCard/food.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class LifeEssence extends Food {
    static DEFAULT = {
        id: 'life-essence',
        name: 'Life Essence',
        type: 'food',
        description: 'Life Essence - Tinh hoa sự sống hồi phục sức khỏe tối đa và tăng tất cả chỉ số.'
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, LifeEssence.DEFAULT.name, LifeEssence.DEFAULT.id);
        (this as any).rarity = (LifeEssence.DEFAULT as any).rarity;
        this.description = LifeEssence.DEFAULT.description;
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
