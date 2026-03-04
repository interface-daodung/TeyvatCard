import Treasure from '../../../modules/typeCard/treasure.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/card/Card.js';

export default class Bribery extends Treasure {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('Bribery') ?? { id: 'bribery', name: 'Bribery', description: '', rarity: 3 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        this.durability = this.GetRandom(5, 10);
    }

    // Logic hiệu ứng của Bribery (nếu có) sẽ dùng Treasure.CardEffect/die + GameManager.requestReplaceCard.
}
