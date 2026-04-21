import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import Hilichurl from '../../../modules/clan/Hilichurl.js';
/** Số lần `completeMove` cần tích lũy trước khi gây 1 damage cho nhân vật (chỉnh tại đây). */
const SHOOT_COUNT_MAX = 5;

export default class Shooter extends Hilichurl {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('Shooter') ?? { id: 'shooter', name: 'Shooter', description: '', element: 'physical', clan: 'hilichurl', rarity: 2 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        this.createCard();
        this.initHilichurlTokenCounter({
            fullCount: SHOOT_COUNT_MAX,
            resetValue: 0,
            onThreshold: () => this.onShootThresholdReached()
        });
        scene.add.existing(this);
    }

    private onShootThresholdReached(): void {
        this.damageCharacterWithArrow(1);
    }
}
