import Weapon from '../../../modules/typeCard/weapon.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class SwordForest extends Weapon {
    static DEFAULT = {
        id: 'sword-forest',
        name: 'Sword Forest',
        type: 'weapon',
        description: 'Sword Forest - Kiếm rừng tự nhiên tăng sức mạnh và khả năng phòng thủ.',
        category: 'sword',
        rarity: 3
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, SwordForest.DEFAULT.name, SwordForest.DEFAULT.id, SwordForest.DEFAULT.type);
        (this as any).rarity = SwordForest.DEFAULT.rarity;
        this.description = SwordForest.DEFAULT.description;
        this.durability = this.GetRandom(6, 12);
        this.createCard();
        scene.add.existing(this);
    }
}
