import Hilichurl from '../../../modules/clan/Hilichurl.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import type Character from '../../../modules/typeCard/character.js';

export default class ElectroSamachurl extends Hilichurl {
    protected samaFullCount = 6;

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('ElectroSamachurl') ?? { id: 'electro-samachurl', name: 'Electro Samachurl', description: '', element: 'electro', clan: 'hilichurl', rarity: 3 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        // this.health = this.GetRandom(3, 10);
        // this.score = this.GetRandom(1, 9);
        this.createCard();
        this.initHilichurlTokenCounter({
            fullCount: this.samaFullCount,
            resetValue: -1,
            onThreshold: () => this.onSamaThresholdReached()
        });
        scene.add.existing(this);
    }

    protected onSamaThresholdReached(): void {
        const character = this.scene.gameManager?.cardManager?.CardCharacter as Character | undefined;
        if (!character) return;

        const damage = Math.floor(character.hp / 2);
        if (damage <= 0) return;

        character.takeDamage(damage, 'damage', 'electro');
    }
}
