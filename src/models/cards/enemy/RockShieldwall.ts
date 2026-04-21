import Enemy from '../../../modules/typeCard/enemy.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import type { DamageElement } from '../../../modules/typeCard/character.js';

const INNATE_SHIELD_TURNS = 999;
const INNATE_SHIELD_STACK_ID = 'rock-shieldwall-innate';

export default class RockShieldwall extends Enemy {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('RockShieldwall') ?? { id: 'rock-shieldwall', name: 'Rock Shieldwall', description: '', element: 'geo', clan: 'hilichurl', rarity: 3 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        this.createCard();
        this.setTokenElement('geo');
        if (this.health > 0) {
            this.addShield(this.health, INNATE_SHIELD_TURNS, INNATE_SHIELD_STACK_ID);
        }
        scene.add.existing(this);
    }

    override takeDamage(damage: number, type?: string, element: DamageElement | null = null): number {
        if (this.health <= 0) return 0;
        if (element === 'geo') {
            this.clearAllShields();
        }
        return super.takeDamage(damage, type, element);
    }
}
