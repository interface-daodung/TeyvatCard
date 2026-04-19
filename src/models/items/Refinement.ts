import Item from '../../modules/Item.js';
import type GameManager from '../../core/GameManager.js';
import Weapon from '@/src/modules/typeCard/weapon.js';
import { ItemAnimation } from '@/src/animations/ItemAnimation.js';

export default class Refinement extends Item {
    constructor() {
        super('refinement');
        this.applyConfig();
    }

    override effect(gameManager: GameManager): boolean {
        let weaponCount = 0;
        gameManager.cardManager.getAllCards().forEach(card => {
            if (card?.type === 'weapon') weaponCount++;
        });
        if (weaponCount === 0) return false;
        ItemAnimation.runAsync(gameManager.animationManager, this.image);
        // gameManager.animationManager.startItemAnimation(this.image, () => {

        // });
        gameManager.cardManager.getAllCards().forEach(card => {
            if (card?.type === 'weapon') {
                this.refinement(card as Weapon);
            }
        });

        return true;
    }

    refinement(card: Weapon): void {
        card.durability += this.power;
        card.durabilityDisplay.updateText(card.durability);
    }
}
