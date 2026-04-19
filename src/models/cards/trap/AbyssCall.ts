import Trap from '../../../modules/typeCard/trap.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import { Log } from '../../../utils/Log.js';

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
        const newCard = factory?.createRandomCardFromStagePoolType(this.scene, this.index, 'enemies') ?? null;
        if (!newCard) {
            Log.warn(
                '[AbyssCall.CardEffect] Không tạo được enemy từ pool màn (dungeonList availableCards.enemies, rarity). Kiểm tra stage và card config.'
            );
            return Promise.resolve(true);
        }
        this.scene.gameManager?.cardManager?.addCard(newCard, this.index).processCreation?.();
        return Promise.resolve(true);
    }
}
