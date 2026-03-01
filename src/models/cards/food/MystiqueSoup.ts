import Food from '../../../modules/typeCard/food.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import Character from '@/src/modules/typeCard/character.js';
import { Log } from '../../../utils/Log.js';

export default class MystiqueSoup extends Food {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('MystiqueSoup') ?? { id: 'mystique-soup', name: 'Mystique Soup', description: '', rarity: 3 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        // if (this.food == null) this.food = 6;
        this.createCard();
        scene.add.existing(this);
    }

    CardEffect(): boolean {
        // console.log(`Mystique Soup effect: healing ${this.food} HP to the character.`);
        if (this.scene.gameManager?.cardManager.CardCharacter instanceof Character) {
            this.scene.gameManager.cardManager.CardCharacter.takeDamage(this.food, 'poisoning');
            this.scene.gameManager.cardManager.CardCharacter.setPoisoning();
        } else {
            Log.error('No character found to apply Mystique Soup effect.');
        }
        return false;
    }
}
