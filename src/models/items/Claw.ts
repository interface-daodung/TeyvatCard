import Item from '../../modules/Item.js';
import type GameManager from '../../core/GameManager.js';

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
        gameManager.animationManager.startItemAnimation(this.image, () => {
            gameManager.cardManager.getAllCards().forEach(card => {
                if (card?.type === 'enemy' && (card as any).takeDamage) {
                    (card as any).takeDamage(this.power);
                }
            });
        });
        return true;
    }
}
