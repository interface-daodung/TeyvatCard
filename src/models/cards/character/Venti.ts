import Character from '../../../modules/typeCard/character.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import { ShuffleAllCardsAnimation } from '@/src/animations/ShuffleAllCardsAnimation.js';
import { SkillAnimation } from '@/src/animations/SkillAnimation.js';
import { SpritesheetWrapper } from '@/src/utils/SpritesheetWrapper.js';

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

        const { width, height } = this.scene.scale;
        SpritesheetWrapper.animationEffect(
            this.scene,
            width / 2,
            height / 2,
            'venti-skill-animations',
            600,
            600,
            { start: 0, end: 5 },
            10
        );
        console.warn('[info]EffectelementalBurst');
        ShuffleAllCardsAnimation.runAsync(this.scene.gameManager.animationManager);

    }


    readonly elementalBurstCooldownMax = 1; // Số lượt cooldown cho elemental burst
}
