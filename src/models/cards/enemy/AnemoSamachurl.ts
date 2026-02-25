import Enemy from '../../../modules/typeCard/enemy.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class AnemoSamachurl extends Enemy {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('AnemoSamachurl') ?? { id: 'anemo-samachurl', name: 'Anemo Samachurl', description: '', element: 'anemo', clan: 'hilichurl', rarity: 3 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        // this.health = this.GetRandom(3, 10);
        // this.score = this.GetRandom(1, 9);
        this.createCard();
        scene.add.existing(this);
    }
}
