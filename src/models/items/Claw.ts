import Item from '../../modules/Item.js';
import type GameManager from '../../core/GameManager.js';

export default class Claw extends Item {
    constructor() {
        super(
            'Claw',
            'claw',
            'claw',
            5,
            2,
            'Tấn công với 40 damage',
            5
        );
    }

    override get power(): number {
        return this._power * (1 + this.level * 0.2);
    }

    override get cooldown(): number {
        return Math.max(0, this._cooldown - this.level * 0.2);
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
