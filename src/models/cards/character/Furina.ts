import Character from '../../../modules/typeCard/character.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class Furina extends Character {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('furina') ?? { id: 'furina', name: 'fallback Furina', description: '', hp: 10, element: 'hydro' };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        this.createCard();
        scene.add.existing(this);
    }
}
