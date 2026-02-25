import Item from '../../modules/Item.js';
import type GameManager from '../../core/GameManager.js';

export default class BlackHole extends Item {
    constructor() {
        super('black-hole');
        this.applyConfig();
    }

    override effect(gameManager: GameManager): boolean {
        gameManager.animationManager.startItemAnimation(this.image, () => {});
        gameManager.animationManager.startShuffleAllCardsAnimation(() => {});
        return true;
    }
}
