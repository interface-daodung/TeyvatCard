import Weapon from '../../../modules/typeCard/weapon.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/card/Card.js';

export default class SwordForest extends Weapon {
    static CARD_KEY = 'SwordForest';
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('SwordForest') ?? { id: 'sword-forest', name: 'Sword Forest', description: '', category: 'sword', rarity: 3 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        // this.createCard();
        // scene.add.existing(this);
    }
}
