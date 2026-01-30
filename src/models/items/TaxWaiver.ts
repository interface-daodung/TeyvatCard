import Item from '../../modules/Item.js';
import type GameManager from '../../core/GameManager.js';

export default class TaxWaiver extends Item {
    active: boolean;

    constructor() {
        super(
            'Tax Waiver',
            'tax-waiver',
            'tax-waiver',
            10,
            0,
            'Miễn thuế cho item',
            5
        );
        this.active = false;
    }

    override get power(): number {
        return this._power + this.level * 25;
    }

    override effect(gameManager: GameManager): boolean {
        if (this.active) return false;
        this.active = true;
        this.gameManager = gameManager;
        gameManager.animationManager.startItemAnimation(this.image, () => {
            (gameManager as any).emitter?.on('gameOver', this.TaxWaiverEffect.bind(this), 10);
        });
        return true;
    }

    TaxWaiverEffect(): void {
        const coinBonus = Math.ceil((this.gameManager?.coin ?? 0) * (this.power / 100));
        this.gameManager?.addCoin(coinBonus);
    }
}
