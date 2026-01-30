import Item from '../../modules/Item.js';
import type GameManager from '../../core/GameManager.js';

export default class BlackHole extends Item {
    constructor() {
        super(
            'Black Hole',
            'black-hole',
            'black-hole',
            0,
            2,
            'Tạo hố đen hút tất cả enemy',
            8
        );
    }

    override get power(): number {
        return this._power * (1 + this.level * 0.3);
    }

    override get cooldown(): number {
        return Math.max(1, this._cooldown - this.level * 0.8);
    }

    override effect(gameManager: GameManager): boolean {
        gameManager.animationManager.startItemAnimation(this.image, () => {});
        gameManager.animationManager.startShuffleAllCardsAnimation(() => {});
        return true;
    }
}
