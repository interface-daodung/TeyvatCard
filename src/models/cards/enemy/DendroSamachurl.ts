import Samachurl from '../../../modules/clan/Samachurl.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class DendroSamachurl extends Samachurl {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('DendroSamachurl') ?? { id: 'dendro-samachurl', name: 'Dendro Samachurl', description: '', element: 'dendro', clan: 'hilichurl', rarity: 3 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        this.createCard();
        this.initSamachurlAbility();
        scene.add.existing(this);
    }

    protected override onSamaThresholdReached(): void {
        this.scene.gameManager?.cardManager?.CardCharacter?.setPoisoning?.();
    }
}
