import Item from '../../modules/Item.js';
import type GameManager from '../../core/GameManager.js';
import { dataManager } from '../../core/DataManager.js';
import Enemy from '../../modules/typeCard/enemy.js';

export default class Corruption extends Item {
    active: boolean;
    constructor() {
        super('corruption');
        this.applyConfig();
        this.active = false;
    }

    override effect(gameManager: GameManager): boolean {
        if (this.active) return false;
        this.active = true;
        gameManager.animationManager.startItemAnimation(this.image, () => {
            gameManager.emitter.on('completeMove', this.onCompleteMove.bind(this), 10);
        });
        return true;
    }

    /**
     * Sau khi nhân vật hoàn tất bước đi: nếu thẻ ở vị trí trước (đã lưu bằng setFlag)
     * là Enemy hoặc class con thì trừ HP theo this.power.
     */
    onCompleteMove(): void {
        const card = dataManager.getFlag<any>('cardAtOldCharacterPos');
        if (!card) return;
        if (!(card instanceof Enemy)) return;
        if (this.power > 0 && typeof card.takeDamage === 'function') {
            card.takeDamage(this.power);
        }
    }
}
