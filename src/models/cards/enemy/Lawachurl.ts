import Enemy from '../../../modules/typeCard/enemy.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import type { DamageElement } from '../../../modules/typeCard/character.js';

const INNATE_SHIELD_TURNS = 999;
const INNATE_SHIELD_STACK_ID = 'lawachurl-innate';

export default class Lawachurl extends Enemy {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('Lawachurl') ?? { id: 'lawachurl', name: 'Lawachurl', description: '', element: 'physical', clan: 'hilichurl', rarity: 5 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        // this.health = this.GetRandom(3, 10);
        // this.score = this.GetRandom(1, 9);
        this.createCard();
        this.createShieldByHilichurlHerd();
        scene.add.existing(this);
    }

    private createShieldByHilichurlHerd(): void {
        const allCards = this.scene.gameManager?.cardManager?.getAllCards?.() ?? [];
        let herd = 0;

        for (const card of allCards) {
            if (!card || card.type !== 'enemy') continue;
            const target = card as Enemy;
            if (target.clan === 'hilichurl') herd++;
        }

        const shieldAmount = 2 * herd;
        if (shieldAmount > 0) {
            this.addShield(shieldAmount, INNATE_SHIELD_TURNS, INNATE_SHIELD_STACK_ID);
        }
    }

    override takeDamage(damage: number, type?: string, element: DamageElement | null = null): number {
        if (this.health <= 0) return 0;
        if (element === 'geo') {
            this.clearAllShields();
        }
        return super.takeDamage(damage, type, element);
    }
}
