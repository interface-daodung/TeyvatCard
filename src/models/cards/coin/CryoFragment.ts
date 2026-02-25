import Coin from '../../../modules/typeCard/coin.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class CryoFragment extends Coin {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('CryoFragment') ?? { id: 'cryo-fragment', name: 'Cryo Fragment', description: '', rarity: 1 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        // this.score = this.GetRandom(1, 9);
        this.createCard();
        scene.add.existing(this);
    }
}
