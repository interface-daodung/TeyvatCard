import Food from '../../../modules/typeCard/food.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/card/Card.js';

export default class LifeEssence extends Food {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('LifeEssence') ?? { id: 'life-essence', name: 'Life Essence', description: '' };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        // if (this.food == null) this.food = 10;
        // this.createCard();
        // scene.add.existing(this);
    }
}
