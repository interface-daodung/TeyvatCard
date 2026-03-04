import Weapon from '../../../modules/typeCard/weapon.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/card/Card.js';

export default class SwordTraveler extends Weapon {
    static CARD_KEY = 'SwordTraveler';
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('SwordTraveler') ?? { id: 'sword-traveler', name: 'Sword Traveler', description: '', category: 'sword', rarity: 4 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        // this.durability = this.GetRandom(3, 12);
        // this.createCard();
        // scene.add.existing(this);
    }
}
