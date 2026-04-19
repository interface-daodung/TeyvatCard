import Samachurl from '../../../modules/clan/Samachurl.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import { ShuffleAllCardsAnimation } from '@/src/animations/ShuffleAllCardsAnimation.js';
import { SkillAnimation } from '@/src/animations/SkillAnimation.js';

export default class AnemoSamachurl extends Samachurl {
    protected override samaFullCount = 3;

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('AnemoSamachurl') ?? { id: 'anemo-samachurl', name: 'Anemo Samachurl', description: '', element: 'anemo', clan: 'hilichurl', rarity: 3 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        // this.health = this.GetRandom(3, 10);
        // this.score = this.GetRandom(1, 9);
        this.createCard();
        this.initSamachurlAbility();
        scene.add.existing(this);
    }

    protected override onSamaThresholdReached(): void {
        this.scene.gameManager?.emitter.once(
            'completeMove',
            () => {
                void ShuffleAllCardsAnimation.runAsync(this.scene.gameManager!.animationManager);
                void SkillAnimation.runAsync(this.scene.gameManager.animationManager, this.nameId);
            },
            15
        );
    }
}
