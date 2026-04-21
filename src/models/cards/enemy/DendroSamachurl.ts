import Hilichurl from '../../../modules/clan/Hilichurl.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class DendroSamachurl extends Hilichurl {
    protected samaFullCount = 5;
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('DendroSamachurl') ?? { id: 'dendro-samachurl', name: 'Dendro Samachurl', description: '', element: 'dendro', clan: 'hilichurl', rarity: 3 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        this.createCard();
        this.initHilichurlTokenCounter({
            fullCount: this.samaFullCount,
            resetValue: -1,
            onThreshold: () => this.onSamaThresholdReached()
        });
        scene.add.existing(this);
    }

    protected onSamaThresholdReached(): void {
        this.scene.gameManager?.cardManager?.CardCharacter?.setPoisoning?.();
    }
}
