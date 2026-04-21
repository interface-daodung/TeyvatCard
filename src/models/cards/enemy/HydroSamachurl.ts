import Hilichurl from '../../../modules/clan/Hilichurl.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import type Enemy from '../../../modules/typeCard/enemy.js';

/** Lượng HP hồi cho mỗi Hilichurl khi Hydro Samachurl kích hoạt burst. */
const HYDRO_BURST_HEAL_AMOUNT = 1;

export default class HydroSamachurl extends Hilichurl {
    protected samaFullCount = 3;

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('HydroSamachurl') ?? { id: 'hydro-samachurl', name: 'Hydro Samachurl', description: '', element: 'hydro', clan: 'hilichurl', rarity: 3 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        // this.health = this.GetRandom(3, 10);
        // this.score = this.GetRandom(1, 9);
        this.createCard();
        this.initHilichurlTokenCounter({
            fullCount: this.samaFullCount,
            resetValue: -1,
            onThreshold: () => this.onSamaThresholdReached()
        });
        scene.add.existing(this);
    }

    protected onSamaThresholdReached(): void {
        this.healHilichurlEnemiesByHydroBurst();
    }

    /**
     * Hồi: tất cả `Enemy` có `clan === 'hilichurl'`
     * - mỗi mục tiêu +{@link HYDRO_BURST_HEAL_AMOUNT} HP
     */
    private healHilichurlEnemiesByHydroBurst(): void {
        const allCards = this.scene.gameManager?.cardManager?.getAllCards?.() ?? [];

        for (const card of allCards) {
            if (!card || card.type !== 'enemy') continue;

            const target = card as unknown as Enemy;
            if (target.clan !== 'hilichurl') continue;

            const addHealth = HYDRO_BURST_HEAL_AMOUNT;
            target.health = (target.health ?? 0) + addHealth;
            target.hpDisplay?.updateText(target.health.toString());
            target.showPopup(addHealth, 'heal');
        }
    }
}
