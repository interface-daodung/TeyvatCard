import Treasure from '../../../modules/typeCard/treasure.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class GoldMine extends Treasure {
    static DEFAULT = {
        id: 'gold-mine',
        name: 'GoldMine',
        type: 'treasure',
        description: 'GoldMine - Mỏ khai thác để nhận tài nguyên.',
        rarity: 2
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, GoldMine.DEFAULT.name, GoldMine.DEFAULT.id, GoldMine.DEFAULT.type);
        (this as any).rarity = GoldMine.DEFAULT.rarity;
        this.description = GoldMine.DEFAULT.description;
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
