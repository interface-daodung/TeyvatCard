import Item from '../../modules/Item.js';
import type GameManager from '../../core/GameManager.js';
import { ItemAnimation } from '@/src/animations/ItemAnimation.js';

export default class Cooldown extends Item {
    constructor() {
        super('cooldown');
        this.applyConfig();
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
        ItemAnimation.runAsync(gameManager.animationManager, this.image);
        // gameManager.animationManager.startItemAnimation(this.image, () => {});
        return true;
    }
}
