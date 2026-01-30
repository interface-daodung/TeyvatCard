import Trap from '../../../modules/typeCard/trap.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class Quicksand extends Trap {
    static DEFAULT = {
        id: 'quicksand',
        name: 'Quicksand',
        type: 'trap',
        description: 'Quicksand - Bẫy cát lún gây damage và làm chậm người chơi khi kích hoạt.',
        rarity: 2
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, Quicksand.DEFAULT.name, Quicksand.DEFAULT.id, Quicksand.DEFAULT.type);
        (this as any).rarity = Quicksand.DEFAULT.rarity;
        this.description = Quicksand.DEFAULT.description;
        this.damage = this.GetRandom(5, 12);
        this.createCard();
        scene.add.existing(this);
    }

    CardEffect(): boolean {
        this.ProgressDestroy();
        const newCard = this.scene.gameManager?.cardManager.cardFactory.createRandomCard(this.scene, this.index);
        if (newCard) {
            this.scene.gameManager?.cardManager.addCard(newCard, this.index).processCreation?.();
        }
        this.scene.gameManager?.animationManager.startShuffleAllCardsAnimation(() => {});
        return true;
    }
}
