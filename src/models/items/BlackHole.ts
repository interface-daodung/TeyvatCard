import Item from '../../modules/Item.js';
import type GameManager from '../../core/GameManager.js';
import { ItemAnimation } from '@/src/animations/ItemAnimation.js';
import { ShuffleAllCardsAnimation } from '@/src/animations/ShuffleAllCardsAnimation.js';

export default class BlackHole extends Item {
    constructor() {
        super('black-hole');
        this.applyConfig();
    }

    override effect(gameManager: GameManager): boolean {
        // gameManager.animationManager.startItemAnimation(this.image, () => {});
        ItemAnimation.runAsync(gameManager.animationManager, this.image);
        // gameManager.animationManager.startShuffleAllCardsAnimation(() => {});
        ShuffleAllCardsAnimation.runAsync(gameManager.animationManager);
        return true;
    }
}
