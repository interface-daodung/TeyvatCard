import Weapon from '../../../modules/typeCard/weapon.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/card/Card.js';

export default class SwordSacrificial extends Weapon {
    static CARD_KEY = 'SwordSacrificial';
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('SwordSacrificial') ?? { id: 'sword-sacrificial', name: 'Sword Sacrificial', description: '', category: 'sword', rarity: 4 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        // this.createCard();
        // scene.add.existing(this);
    }
}
