import Item from '../../modules/Item.js';
import type GameManager from '../../core/GameManager.js';
import { ItemAnimation } from '@/src/animations/ItemAnimation.js';

export default class HealingPotion extends Item {
    constructor() {
        super('healing-potion');
        this.applyConfig();
    }

    override effect(gameManager: GameManager): boolean {
        const cardCharacter = gameManager.cardManager.CardCharacter;
        if (cardCharacter?.hp >= cardCharacter?.getMaxHP()) {
            return false;
        }
        ItemAnimation.runAsync(gameManager.animationManager, this.image);
        // gameManager.animationManager.startItemAnimation(this.image, () => {
            cardCharacter?.heal(this.power);
        // });
        return true;
    }
}
