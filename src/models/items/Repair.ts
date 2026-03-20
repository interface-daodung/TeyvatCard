import Item from '../../modules/Item.js';
import type GameManager from '../../core/GameManager.js';
import { ItemAnimation } from '@/src/animations/ItemAnimation.js';

export default class Repair extends Item {
    constructor() {
        super('repair');
        this.applyConfig();
    }

    override effect(gameManager: GameManager): boolean {
        const cardCharacter = gameManager.cardManager.CardCharacter as any;
        const weapon = cardCharacter?.weapon;
        if (weapon && weapon.durability > 0) {
            ItemAnimation.runAsync(gameManager.animationManager, this.image);
            // gameManager.animationManager.startItemAnimation(this.image, () => {
            //     cardCharacter?.repair(this.power);
            // });
            cardCharacter?.repair(this.power);
            return true;
        }
        return false;
    }
}
