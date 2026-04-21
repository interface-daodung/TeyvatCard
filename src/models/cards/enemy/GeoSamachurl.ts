import Hilichurl from '../../../modules/clan/Hilichurl.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import type Enemy from '../../../modules/typeCard/enemy.js';

/** Nguồn stack khiên buff hilichurl (ghi đè theo luật `addShield` cùng nguồn). */
const HILICHURL_BUFF_SHIELD_SOURCE = 'geo-samachurl-hilichurl';
/** Số lượt `completeMove` trước khi layer buff hết hạn. */
const HILICHURL_BUFF_SHIELD_TURNS = 3;

export default class GeoSamachurl extends Hilichurl {
    protected samaFullCount = 6;

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('GeoSamachurl') ?? { id: 'geo-samachurl', name: 'Geo Samachurl', description: '', element: 'geo', clan: 'hilichurl', rarity: 3 };
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
        this.buffHilichurlEnemies();
    }

    /** Buff: mọi `Enemy` `clan === 'hilichurl'` nhận khiên (1/3 máu Geo Samachurl, làm tròn xuống, tối thiểu 1). */
    private buffHilichurlEnemies(): void {
        const allCards = this.scene.gameManager?.cardManager?.getAllCards?.() ?? [];
        const shieldAmount = Math.max(1, Math.floor(this.health / 3));

        for (const card of allCards) {
            if (!card || card.type !== 'enemy') continue;

            const target = card as unknown as Enemy;
            if (target.clan !== 'hilichurl') continue;

            if (target.addShield(shieldAmount, HILICHURL_BUFF_SHIELD_TURNS, HILICHURL_BUFF_SHIELD_SOURCE)) {
                target.showPopup(shieldAmount, { color: '#ffbb00', prefix: '⛨' });
            }
        }
    }
}
