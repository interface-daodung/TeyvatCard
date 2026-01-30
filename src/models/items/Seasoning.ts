import Item from '../../modules/Item.js';
import type GameManager from '../../core/GameManager.js';

export default class Seasoning extends Item {
    constructor() {
        super(
            'Seasoning',
            'seasoning',
            'seasoning',
            10,
            10,
            'Gia vị để tăng hiệu quả item',
            6
        );
    }

    override get power(): number {
        return this._power + this.level * 15;
    }

    override effect(gameManager: GameManager): boolean {
        let foodCount = 0;
        gameManager.cardManager.getAllCards().forEach(card => {
            if (card?.type === 'food') foodCount++;
        });
        if (foodCount === 0) return false;
        gameManager.animationManager.startItemAnimation(this.image, () => {
            gameManager.cardManager.getAllCards().forEach(card => {
                if (card?.type === 'food' && (card as any).seasoning) {
                    (card as any).seasoning(this.power);
                }
            });
        });
        return true;
    }
}
