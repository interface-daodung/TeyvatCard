import Weapon from '../../../modules/typeCard/weapon.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class SwordSplendor extends Weapon {
    static DEFAULT = {
        id: 'sword-splendor',
        name: 'Sword Splendor',
        type: 'weapon',
        description: 'Sword Splendor - Kiếm huy hoàng.',
        category: 'sword',
        rarity: 4
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, SwordSplendor.DEFAULT.name, SwordSplendor.DEFAULT.id, SwordSplendor.DEFAULT.type);
        (this as any).rarity = SwordSplendor.DEFAULT.rarity;
        this.description = SwordSplendor.DEFAULT.description;
        this.durability = this.GetRandom(5, 12);
        this.createCard();
        scene.add.existing(this);
    }
}
