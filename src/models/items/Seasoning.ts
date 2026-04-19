import Item from '../../modules/Item.js';
import type GameManager from '../../core/GameManager.js';
import Food from '@/src/modules/typeCard/food.js';
import { ItemAnimation } from '@/src/animations/ItemAnimation.js';

export default class Seasoning extends Item {
    constructor() {
        super('seasoning');
        this.applyConfig();
    }

    override effect(gameManager: GameManager): boolean {
        let foodCount = 0;
        gameManager.cardManager.getAllCards().forEach(card => {
            if (card?.type === 'food') foodCount++;
        });
        if (foodCount === 0) return false;
        ItemAnimation.runAsync(gameManager.animationManager, this.image);
        // gameManager.animationManager.startItemAnimation(this.image, () => {

        // });
        gameManager.cardManager.getAllCards().forEach(card => {
            if (card?.type === 'food') {
                this.seasoning(card as Food);
            }
        });
        return true;
    }

    seasoning(card: Food): void {
        card.food += this.power;
        card.foodDisplay.updateText(card.food);
    }
}
