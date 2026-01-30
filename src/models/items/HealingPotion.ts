import Item from '../../modules/Item.js';
import type GameManager from '../../core/GameManager.js';

export default class HealingPotion extends Item {
    constructor() {
        super(
            'Healing Potion',
            'healing-potion',
            'healing-potion',
            2,
            18,
            'Hồi phục 2 HP',
            10
        );
    }

    override get power(): number {
        return this._power * (1 + this.level * 0.15);
    }

    override effect(gameManager: GameManager): boolean {
        const cardCharacter = gameManager.cardManager.CardCharacter as any;
        if (cardCharacter?.hp >= cardCharacter?.getMaxHP()) {
            return false;
        }
        gameManager.animationManager.startItemAnimation(this.image, () => {
            cardCharacter?.heal(this.power);
        });
        return true;
    }
}
