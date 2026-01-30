import Treasure from '../../../modules/typeCard/treasure.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class Bribery extends Treasure {
    static DEFAULT = {
        id: 'bribery',
        name: 'Bribery',
        type: 'treasure',
        description: 'Bribery - Hối lộ để nhận phần thưởng lớn hơn chi phí.',
        rarity: 3
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, Bribery.DEFAULT.name, Bribery.DEFAULT.id, Bribery.DEFAULT.type);
        (this as any).rarity = Bribery.DEFAULT.rarity;
        this.description = Bribery.DEFAULT.description;
        this.durability = this.GetRandom(5, 10);
        this.createCard();
        scene.add.existing(this);
    }

    CardEffect(): boolean {
        this.ProgressDestroy();
        const newCard = this.scene.gameManager?.cardManager.cardFactory.createRandomCard(this.scene, this.index);
        if (newCard) {
            this.scene.gameManager?.cardManager.addCard(newCard, this.index).processCreation?.();
        }
        return true;
    }
}
