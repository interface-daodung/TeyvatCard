import Item from '../../modules/Item.js';
import type GameManager from '../../core/GameManager.js';

export default class Repair extends Item {
    constructor() {
        super(
            'Repair',
            'repair',
            'repair',
            10,
            1,
            'Sửa chữa item bị hỏng',
            5
        );
    }

    override get power(): number {
        return this._power + this.level * 20;
    }

    override effect(gameManager: GameManager): boolean {
        const cardCharacter = gameManager.cardManager.CardCharacter as any;
        const weapon = cardCharacter?.weapon;
        if (weapon && weapon.durability > 0) {
            gameManager.animationManager.startItemAnimation(this.image, () => {
                cardCharacter?.repair(this.power);
            });
            return true;
        }
        return false;
    }
}
