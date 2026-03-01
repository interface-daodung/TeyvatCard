import Item from '../../modules/Item.js';
import type GameManager from '../../core/GameManager.js';
import { Log } from '@/src/utils/Log.js';

export default class TaxWaiver extends Item {
    active: boolean;

    constructor() {
        super('tax-waiver');
        this.applyConfig();
        this.active = false;
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
        const coinBonus = Math.ceil((this.gameManager?.coin ?? 0) * (this.power));
        Log.info(`TaxWaiverEffect: coinBonus = ${coinBonus}`);
        this.gameManager?.addCoin(coinBonus);
    }
}
