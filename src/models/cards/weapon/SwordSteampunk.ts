import Weapon from '../../../modules/typeCard/weapon.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class SwordSteampunk extends Weapon {
    static DEFAULT = {
        id: 'sword-steampunk',
        name: 'Sword Steampunk',
        type: 'weapon',
        description: 'Sword Steampunk - Kiếm huy hoàng quý giá tăng sức mạnh và may mắn.',
        category: 'sword',
        rarity: 4
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, SwordSteampunk.DEFAULT.name, SwordSteampunk.DEFAULT.id, SwordSteampunk.DEFAULT.type);
        (this as any).rarity = SwordSteampunk.DEFAULT.rarity;
        this.description = SwordSteampunk.DEFAULT.description;
        this.durability = this.GetRandom(3, 12);
        this.createCard();
        scene.add.existing(this);
    }
}
