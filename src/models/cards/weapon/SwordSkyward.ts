import Weapon from '../../../modules/typeCard/weapon.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/card/Card.js';

export default class SwordSkyward extends Weapon {
    static CARD_KEY = 'SwordSkyward';
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('SwordSkyward') ?? { id: 'sword-skyward', name: 'Sword Skyward', description: '', category: 'sword', rarity: 4 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        // this.durability = this.GetRandom(3, 12);
        // this.createCard();
        // scene.add.existing(this);
    }
}
