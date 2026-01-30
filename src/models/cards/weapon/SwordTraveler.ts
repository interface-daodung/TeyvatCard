import Weapon from '../../../modules/typeCard/weapon.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class SwordTraveler extends Weapon {
    static DEFAULT = {
        id: 'sword-traveler',
        name: 'Sword Traveler',
        type: 'weapon',
        description: 'Sword Traveler - Kiếm lữ khách.',
        category: 'sword',
        rarity: 3
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, SwordTraveler.DEFAULT.name, SwordTraveler.DEFAULT.id, SwordTraveler.DEFAULT.type);
        (this as any).rarity = SwordTraveler.DEFAULT.rarity;
        this.description = SwordTraveler.DEFAULT.description;
        this.durability = this.GetRandom(4, 10);
        this.createCard();
        scene.add.existing(this);
    }
}
