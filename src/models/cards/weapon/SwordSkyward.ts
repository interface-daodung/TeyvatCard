import Weapon from '../../../modules/typeCard/weapon.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class SwordSkyward extends Weapon {
    static DEFAULT = {
        id: 'sword-skyward',
        name: 'Sword Skyward',
        type: 'weapon',
        description: 'Sword Skyward - Kiếm thiên không.',
        category: 'sword',
        rarity: 5
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, SwordSkyward.DEFAULT.name, SwordSkyward.DEFAULT.id);
        (this as any).rarity = SwordSkyward.DEFAULT.rarity;
        this.description = SwordSkyward.DEFAULT.description;
        this.durability = this.GetRandom(8, 15);
        this.createCard();
        scene.add.existing(this);
    }
}
