import Treasure from '../../../modules/typeCard/treasure.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class Chest extends Treasure {
    static DEFAULT = {
        id: 'chest',
        name: 'Chest',
        type: 'treasure',
        description: 'Chest - Kho báu chính chứa nhiều loại phần thưởng quý giá.',
        rarity: 4
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, Chest.DEFAULT.name, Chest.DEFAULT.id, Chest.DEFAULT.type);
        (this as any).rarity = Chest.DEFAULT.rarity;
        this.description = Chest.DEFAULT.description;
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
