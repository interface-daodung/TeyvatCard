import Item from '../../modules/Item.js';
import type GameManager from '../../core/GameManager.js';
import type Card from '../../modules/Card.js';
import { ItemAnimation } from '@/src/animations/ItemAnimation.js';

export default class Claw extends Item {
    constructor() {
        super('claw');
        this.applyConfig();
    }

    override effect(gameManager: GameManager): boolean {
        let enemyCount = 0;
        gameManager.cardManager.getAllCards().forEach(card => {
            if (card?.type === 'enemy') enemyCount++;
        });
        if (enemyCount === 0) return false;
        ItemAnimation.runAsync(gameManager.animationManager, this.image);

        // gameManager.animationManager.startItemAnimation(this.image, () => {

        // });

        gameManager.cardManager.getAllCards().forEach(card => {
            if (card?.type === 'enemy' && (card as Card).takeDamage) {
                (card as Card).takeDamage(this.power);
            }
        });
        return true;
    }
}
