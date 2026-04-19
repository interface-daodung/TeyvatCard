import Samachurl from '../../../modules/clan/Samachurl.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import type Enemy from '../../../modules/typeCard/enemy.js';

export default class HydroSamachurl extends Samachurl {
    protected override samaFullCount = 5;

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('HydroSamachurl') ?? { id: 'hydro-samachurl', name: 'Hydro Samachurl', description: '', element: 'hydro', clan: 'hilichurl', rarity: 3 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        // this.health = this.GetRandom(3, 10);
        // this.score = this.GetRandom(1, 9);
        this.createCard();
        this.initSamachurlAbility();
        scene.add.existing(this);
    }

    protected override onSamaThresholdReached(): void {
        this.healHilichurlEnemiesByHydroBurst();
    }

    /**
     * Hồi: tất cả `Enemy` có `clan === 'hilichurl'`
     * - tăng thêm 20% `target.health` (làm tròn lên)
     * - min = 1
     */
    private healHilichurlEnemiesByHydroBurst(): void {
        const allCards = this.scene.gameManager?.cardManager?.getAllCards?.() ?? [];

        for (const card of allCards) {
            if (!card || card.type !== 'enemy') continue;

            const target = card as unknown as Enemy;
            if (target.clan !== 'hilichurl') continue;

            const addHealth = Math.max(1, Math.ceil((target.health ?? 0) * 0.2));
            target.health = (target.health ?? 0) + addHealth;
            target.hpDisplay?.updateText(target.health.toString());
            target.showPopup(addHealth, 'heal');
        }
    }
}
