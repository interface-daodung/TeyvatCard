import Item from '../../modules/Item.js';
import type GameManager from '../../core/GameManager.js';
import { ItemAnimation } from '@/src/animations/ItemAnimation.js';

export default class Toxic extends Item {
    constructor() {
        super('toxic');
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
            if (card?.type === 'enemy' && (card as any).setPoisoning) {
                (card as any).setPoisoning();
            }
        });
        return true;
    }
}
