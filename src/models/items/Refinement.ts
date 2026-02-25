import Item from '../../modules/Item.js';
import type GameManager from '../../core/GameManager.js';

export default class Refinement extends Item {
    constructor() {
        super('refinement');
        this.applyConfig();
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
