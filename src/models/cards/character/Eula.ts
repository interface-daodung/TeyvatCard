import Character from '../../../modules/typeCard/character.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import Enemy from '@/src/modules/typeCard/enemy.js';
import { showFrameLayerOnce } from '@/src/modules/card/cardDisplay.js';

export default class Eula extends Character {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('eula') ?? { id: 'eula', name: 'fallback Eula', description: '', hp: 10, element: 'cryo' };
        super(scene, x, y, index, config.name!, config.id!);

        this.elementalBurstCooldown = this.elementalBurstCooldownMax;

        this.applyConfig(config);
        this.createCard();
        scene.add.existing(this);
    }

    private elementalBurstCooldownMax = 10;
    private DamageCount = 3;

    override reduceDurability(damage: number): void {
        if (!this.weapon) return;
        this.DamageCount += 2;
        super.reduceDurability(damage);
        console.warn(this.DamageCount,'DamageCount by Eula');
    }

    override elementalBurst(): void {
        let enemyCount = 0;
        this.scene.gameManager.cardManager.getAllCards().forEach(card => {
            if (card?.type === 'enemy') enemyCount++;
        });
        if (enemyCount === 0) return;

        this.scene.gameManager.cardManager.getAllCards().forEach(card => {
            if (card?.type === 'enemy' && (card as Enemy).takeDamage) {
                (card as Enemy).takeDamage(this.DamageCount, 'slash', 'cryo');
                showFrameLayerOnce(this.scene, card, { textureKey: 'eula-skill' });
            }
        });
        this.DamageCount = 1;
        this.elementalBurstCooldown = this.elementalBurstCooldownMax; // Reset cooldown sau khi sử dụng elemental burst

    }
}
