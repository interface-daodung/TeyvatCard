import Character from '../../../modules/typeCard/character.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import Enemy from '@/src/modules/typeCard/enemy.js';

export default class Eula extends Character {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('eula') ?? { id: 'eula', name: 'fallback Eula', description: '', hp: 10, element: 'cryo' };
        super(scene, x, y, index, config.name!, config.id!);

        this.elementalBurstCooldown = this.elementalBurstCooldownMax;

        this.applyConfig(config);
        this.createCard();
        scene.add.existing(this);
    }

    private elementalBurstCooldownMax = 3;
    private DamageCount = 1;

    reduceDurability(damage: number): void {
        if (!this.weapon) return;
        this.DamageCount += 1;
        super.reduceDurability(damage);
        console.warn(this.DamageCount,'DamageCount by Eula');
    }

    elementalBurst(): void {
        let enemyCount = 0;
        this.scene.gameManager.cardManager.getAllCards().forEach(card => {
            if (card?.type === 'enemy') enemyCount++;
        });
        if (enemyCount === 0) return;

        this.scene.gameManager.cardManager.getAllCards().forEach(card => {
            if (card?.type === 'enemy' && (card as Enemy).takeDamage) {
                (card as Enemy).takeDamage(this.DamageCount, 'slash', 'cryo');
                // card.add(animationSlash(this.scene, 0, 0).setDepth(10));
            }
        });
        this.DamageCount = 1;
        this.elementalBurstCooldown = this.elementalBurstCooldownMax; // Reset cooldown sau khi sử dụng elemental burst

    }
}
