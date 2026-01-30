import Item from '../../modules/Item.js';
import type GameManager from '../../core/GameManager.js';

export default class Cooldown extends Item {
    constructor() {
        super(
            'Cooldown',
            'cooldown',
            'cooldown',
            8,
            3,
            'Giảm cooldown của skill',
            7
        );
    }

    override get power(): number {
        return this._power + this.level * 5;
    }

    override effect(gameManager: GameManager): boolean {
        let itemCount = 0;
        gameManager.itemEquipment?.forEach((item: any) => {
            if (item.cooldown > 0 && item.item?.nameId !== this.nameId) {
                if (typeof item.cooldowninning === 'function') {
                    item.cooldowninning(this.power);
                }
            } else {
                itemCount++;
            }
        });
        if (itemCount === 3) return false;
        gameManager.animationManager.startItemAnimation(this.image, () => {});
        return true;
    }
}
