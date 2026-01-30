import Weapon from '../../../modules/typeCard/weapon.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class SwordSacrificial extends Weapon {
    static DEFAULT = {
        id: 'sword-sacrificial',
        name: 'Sword Sacrificial',
        type: 'weapon',
        description: 'Sword Sacrificial - Kiếm tế lễ.',
        category: 'sword',
        rarity: 4
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, SwordSacrificial.DEFAULT.name, SwordSacrificial.DEFAULT.id, SwordSacrificial.DEFAULT.type);
        (this as any).rarity = SwordSacrificial.DEFAULT.rarity;
        this.description = SwordSacrificial.DEFAULT.description;
        this.durability = this.GetRandom(5, 12);
        this.createCard();
        scene.add.existing(this);
    }
}
