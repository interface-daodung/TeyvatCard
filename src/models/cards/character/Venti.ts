import Character from '../../../modules/typeCard/character.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import { ShuffleAllCardsAnimation } from '@/src/animations/ShuffleAllCardsAnimation.js';
import { SkillAnimation } from '@/src/animations/SkillAnimation.js';

export default class Venti extends Character {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('venti') ?? { id: 'venti', name: 'fallback Venti', description: '', hp: 10, element: 'anemo' };
        super(scene, x, y, index, config.name!, config.id!);

        this.elementalBurstCooldown = this.elementalBurstCooldownMax;

        this.applyConfig(config);
        this.createCard();
        scene.add.existing(this);
    }

    // unsubEndelementalBurst: (() => void) | undefined;

    elementalBurst(): void {
        if (this.elementalBurstCooldown <= 0) {
            this.elementalBurstCooldown = this.elementalBurstCooldownMax; // Reset cooldown sau khi sử dụng elemental burst
        } else {
            return;
        }

        // tiềm ẩn lỗi            
        SkillAnimation.runAsync(this.scene.gameManager.animationManager, this.nameId);
        ShuffleAllCardsAnimation.runAsync(this.scene.gameManager.animationManager);

        // this.scene.gameManager?.emitter.once(
        //     'completeMove',
        //     this.EffectelementalBurst.bind(this),
        //     10
        // );
    }

    EffectelementalBurst(): void {
        SkillAnimation.runAsync(this.scene.gameManager.animationManager, this.nameId);
        ShuffleAllCardsAnimation.runAsync(this.scene.gameManager.animationManager);
    }

    readonly elementalBurstCooldownMax = 20; // Số lượt cooldown cho elemental burst
}
