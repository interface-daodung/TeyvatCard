import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import { type DamageElement } from '../../../modules/typeCard/character.js';
import Hilichurl from '../../../modules/clan/Hilichurl.js';
/** Số lần `completeMove` cần tích lũy trước khi gây 1 damage cho nhân vật (chỉnh tại đây). */
const SHOOT_COUNT_MAX = 5;
/** Nguyên tố truyền vào `takeDamage` khi đủ đếm. */
const DAMAGE_ELEMENT: DamageElement = 'cryo';

export default class CryoShooter extends Hilichurl {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('CryoShooter') ?? { id: 'cryo-shooter', name: 'Cryo Shooter', description: '', element: 'cryo', clan: 'hilichurl', rarity: 2 };
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
        this.damageCharacterWithArrow(1, DAMAGE_ELEMENT);
    }
}
