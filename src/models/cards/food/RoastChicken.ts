import Food from '../../../modules/typeCard/food.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class RoastChicken extends Food {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('RoastChicken') ?? { id: 'roast-chicken', name: 'Roast Chicken', description: '', rarity: 2 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        // if (this.food == null) this.food = 5;
        this.createCard();
        scene.add.existing(this);
    }
}
