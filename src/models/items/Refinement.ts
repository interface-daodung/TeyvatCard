import Item from '../../modules/Item.js';
import type GameManager from '../../core/GameManager.js';

export default class Refinement extends Item {
    constructor() {
        super(
            'Refinement',
            'refinement',
            'refinement',
            10,
            2,
            'Tinh chế item để tăng sức mạnh',
            6
        );
    }

    override get power(): number {
        return this._power + this.level * 10;
    }

    override effect(gameManager: GameManager): boolean {
        let weaponCount = 0;
        gameManager.cardManager.getAllCards().forEach(card => {
            if (card?.type === 'weapon') weaponCount++;
        });
        if (weaponCount === 0) return false;
        gameManager.animationManager.startItemAnimation(this.image, () => {
            gameManager.cardManager.getAllCards().forEach(card => {
                if (card?.type === 'weapon' && (card as any).refinement) {
                    (card as any).refinement(this.power);
                }
            });
        });
        return true;
    }
}
