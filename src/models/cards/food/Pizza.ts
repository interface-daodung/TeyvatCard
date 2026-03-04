import Food from '../../../modules/typeCard/food.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/card/Card.js';
import Character from '@/src/modules/typeCard/character.js';
import { Log } from '../../../utils/Log.js';

export default class Pizza extends Food {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('Pizza') ?? { id: 'pizza', name: 'Pizza', description: '', rarity: 2 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        // if (this.food == null) this.food = 5;
        // this.createCard();
        // scene.add.existing(this);
    }

    CardEffect(): boolean {
            // console.log(`Mystique Soup effect: healing ${this.food} HP to the character.`);
            if (this.scene.gameManager.cardManager.CardCharacter instanceof Character) {
                this.scene.gameManager.cardManager.CardCharacter.heal(this.food);
                this.scene.gameManager.cardManager.CardCharacter.setRecovery(3, 1);
                this.scene.gameManager.cardManager.CardCharacter.clearPoison();
            } else {
                Log.error('No character found to apply Mystique Soup effect.');
            }
            return false;
        }
}
