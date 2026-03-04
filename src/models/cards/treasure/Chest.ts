import Treasure from '../../../modules/typeCard/treasure.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/card/Card.js';

export default class Chest extends Treasure {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('Chest') ?? { id: 'chest', name: 'Chest', description: '', rarity: 4 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        this.durability = this.GetRandom(5, 10);
    }

    // CardEffect kế thừa từ Treasure (dùng die + requestReplaceCard).
}
