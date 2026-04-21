import Hilichurl from '../../../modules/clan/Hilichurl.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import { ShuffleAllCardsAnimation } from '@/src/animations/ShuffleAllCardsAnimation.js';
import { SkillAnimation } from '@/src/animations/SkillAnimation.js';

export default class AnemoSamachurl extends Hilichurl {
    protected samaFullCount = 4;

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('AnemoSamachurl') ?? { id: 'anemo-samachurl', name: 'Anemo Samachurl', description: '', element: 'anemo', clan: 'hilichurl', rarity: 3 };
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
        const gameManager = this.scene.gameManager;
        if (!gameManager) return;

        const unsub = gameManager.emitter.once(
            'completeMove',
            () => {
                const activeGameManager = this.scene.gameManager;
                if (this.destroyed || !activeGameManager) return;

                void ShuffleAllCardsAnimation.runAsync(activeGameManager.animationManager);
                void SkillAnimation.runAsync(activeGameManager.animationManager, this.nameId);
            },
            15
        );
        this.unsubscribeList.push(unsub);
    }
}
