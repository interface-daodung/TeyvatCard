import Coin from '../../../modules/typeCard/coin.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/card/Card.js';

export default class AnemoFragment extends Coin {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('AnemoFragment') ?? { id: 'anemo-fragment', name: 'Anemo Fragment', description: '', rarity: 1 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        // this.score = this.GetRandom(1, 9);
        // this.createCard();
        // scene.add.existing(this);
    }
}
