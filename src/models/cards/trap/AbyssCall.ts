import Trap from '../../../modules/typeCard/trap.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class AbyssCall extends Trap {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('AbyssCall') ?? { id: 'abyss-call', name: 'AbyssCall', description: '' };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        this.createCard();
        scene.add.existing(this);
    }
}
