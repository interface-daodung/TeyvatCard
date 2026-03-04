import Character from '../../../modules/typeCard/character.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/card/Card.js';

export default class Eula extends Character {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('eula') ?? { id: 'eula', name: 'fallback Eula', description: '', hp: 10, element: 'cryo' };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
    }
}
