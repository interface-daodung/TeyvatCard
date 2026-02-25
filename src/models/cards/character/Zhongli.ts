import Character from '../../../modules/typeCard/character.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class Zhongli extends Character {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('zhongli') ?? { id: 'zhongli', name: 'fallback Zhongli', description: '', hp: 10, element: 'geo' };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        this.createCard();
        scene.add.existing(this);
    }
}
