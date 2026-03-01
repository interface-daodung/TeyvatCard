import Treasure from '../../../modules/typeCard/treasure.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class Chest extends Treasure {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('Chest') ?? { id: 'chest', name: 'Chest', description: '', rarity: 4 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        this.durability = this.GetRandom(5, 10);
        this.createCard();
        scene.add.existing(this);
    }

    // CardEffect(): boolean {
    //     this.ProgressDestroy();
    //     const newCard = this.scene.gameManager?.cardManager.cardFactory.createRandomCard(this.scene, this.index);
    //     if (newCard) {
    //         this.scene.gameManager?.cardManager.addCard(newCard, this.index).processCreation?.();
    //     }
    //     return true;
    // }
}
