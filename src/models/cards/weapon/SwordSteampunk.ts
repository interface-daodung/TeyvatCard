import Weapon from '../../../modules/typeCard/weapon.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class SwordSteampunk extends Weapon {
    static CARD_KEY = 'SwordSteampunk';
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('SwordSteampunk') ?? { id: 'sword-steampunk', name: 'Sword Steampunk', description: '', category: 'sword', rarity: 1 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        // this.durability = this.GetRandom(3, 12);
        this.createCard();
        scene.add.existing(this);
    }
}
