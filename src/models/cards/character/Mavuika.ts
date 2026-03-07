import Character from '../../../modules/typeCard/character.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/card/Card.js';

export default class Mavuika extends Character {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('mavuika') ?? { id: 'mavuika', name: 'fallback Mavuika', description: '', hp: 10, element: 'pyro' };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        // this.createCard();
        // scene.add.existing(this);
    }

}