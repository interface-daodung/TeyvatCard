import Item from '../../modules/Item.js';
import type GameManager from '../../core/GameManager.js';

export default class Toxic extends Item {
    constructor() {
        super(
            'Toxic',
            'toxic',
            'toxic',
            1,
            2,
            'Gây độc 30 damage mỗi turn trong 2 turn',
            5
        );
    }

    override get power(): number {
        return this._power * (1 + this.level * 0.2);
    }

    override get cooldown(): number {
        return Math.max(1, this._cooldown - this.level * 0.2);
    }

    override effect(gameManager: GameManager): boolean {
        let enemyCount = 0;
        gameManager.cardManager.getAllCards().forEach(card => {
            if (card?.type === 'enemy') enemyCount++;
        });
        if (enemyCount === 0) return false;
        gameManager.animationManager.startItemAnimation(this.image, () => {
            gameManager.cardManager.getAllCards().forEach(card => {
                if (card?.type === 'enemy' && (card as any).setPoisoning) {
                    (card as any).setPoisoning();
                }
            });
        });
        return true;
    }
}
