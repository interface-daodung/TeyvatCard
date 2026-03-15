import Trap from '../../../modules/typeCard/trap.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import { Log } from '../../../utils/Log.js';

const HILICHURL_CLAN = 'hilichurl';

export default class AbyssCall extends Trap {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('AbyssCall') ?? { id: 'abyss-call', name: 'AbyssCall', description: '' };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        this.createCard();
        scene.add.existing(this);
    }

    CardEffect(): Promise<boolean> {
        this.ProgressDestroy();
        const factory = this.scene.gameManager?.cardManager?.cardFactory;
        const keys = factory?.getEnemyKeysByClan(HILICHURL_CLAN) ?? [];
        if (keys.length === 0) {
            Log.warn(`[AbyssCall.CardEffect] Không có enemy nào có clan "${HILICHURL_CLAN}". Kiểm tra enemyClasses và libraryCards (clan).`);
            return Promise.resolve(true);
        }
        const key = keys[Math.floor(Math.random() * keys.length)];
        const newCard = factory?.createCardByKey(this.scene, this.index, key) ?? null;
        if (newCard) {
            this.scene.gameManager?.cardManager?.addCard(newCard, this.index).processCreation?.();
        }
        return Promise.resolve(true);
    }
}
