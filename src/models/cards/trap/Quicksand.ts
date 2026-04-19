import Trap from '../../../modules/typeCard/trap.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import { soundManager } from '../../../core/SoundManager.js';
import { ShuffleAllCardsAnimation } from '@/src/animations/ShuffleAllCardsAnimation.js';

export default class Quicksand extends Trap {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('Quicksand') ?? { id: 'quicksand', name: 'Quicksand', description: '', rarity: 2 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        this.createCard();
        scene.add.existing(this);
    }

    async CardEffect(): Promise<boolean> {
        soundManager.play('Quicksand-sound');
        this.ProgressDestroy();
        const newCard = this.scene.gameManager?.cardManager.cardFactory.createRandomCard(this.scene, this.index);
        if (newCard) {
            this.scene.gameManager?.cardManager.addCard(newCard, this.index).processCreation?.();
        }
        await ShuffleAllCardsAnimation.runAsync(this.scene.gameManager!.animationManager);
        // this.scene.gameManager?.animationManager.startShuffleAllCardsAnimation(() => {});
        return Promise.resolve(true); // Quicksand sẽ biến mất sau khi dùng, nhưng vẫn muốn emit 'completeMove' để kích hoạt hiệu ứng xáo trộn bài, nên trả về true;
    }
}
