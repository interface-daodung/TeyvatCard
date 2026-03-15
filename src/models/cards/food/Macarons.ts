import Food from '../../../modules/typeCard/food.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import Character from '@/src/modules/typeCard/character.js';

export default class Macarons extends Food {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('Macarons') ?? { id: 'macarons', name: 'Macarons', description: '', rarity: 3 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        // if (this.food == null) this.food = 4;
        this.createCard();
        scene.add.existing(this);
    }

    CardEffect(): Promise<boolean> {
        super.CardEffect();
        // console.log(`Mystique Soup effect: healing ${this.food} HP to the character.`);
        if (this.scene.gameManager.cardManager.CardCharacter instanceof Character) {
            this.scene.gameManager.cardManager.CardCharacter.clearPoison();
        } else {
            if (import.meta.env.VITE_IS_DEV === 'true')
                console.error('No character found to apply Mystique Soup effect.');
        }
        return Promise.resolve(false); // Macarons không biến mất sau khi dùng, nên trả về false để không emit 'completeMove';
    }
}
