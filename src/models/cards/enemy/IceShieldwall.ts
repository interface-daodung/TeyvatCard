import Enemy from '../../../modules/typeCard/enemy.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import type { DamageElement } from '../../../modules/typeCard/character.js';

/** Khiên mặc định: đủ dài để không hết vì `completeMove` trước khi bị tấn công / Pyro phá. */
const INNATE_SHIELD_TURNS = 999;
const INNATE_SHIELD_STACK_ID = 'ice-shieldwall-innate';
const HYDRO_FREEZE_TURNS = 2;

export default class IceShieldwall extends Enemy {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('IceShieldwall') ?? { id: 'ice-shieldwall', name: 'Ice Shieldwall', description: '', element: 'cryo', clan: 'hilichurl', rarity: 3 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);

        this.createCard();
        this.setTokenElement('cryo');
        if (this.health > 0) {
            this.addShield(this.health, INNATE_SHIELD_TURNS, INNATE_SHIELD_STACK_ID);
        }
        scene.add.existing(this);
    }

    override takeDamage(damage: number, type?: string, element: DamageElement | null = null): number {
        if (this.health <= 0) return 0;
        let finalDamage = damage;
        if (element === 'cryo' && this.shield > 0 && damage > 0) {
            const reducedDamage = Math.max(1, Math.ceil(damage / 2));
            finalDamage = Math.max(0, damage - reducedDamage);
        }
        if (element === 'pyro') {
            this.clearAllShields();
        }
        const dealt = super.takeDamage(finalDamage, type, element);
        if (element === 'hydro' && this.health > 0) {
            this.setFrozenForTurns(HYDRO_FREEZE_TURNS);
            this.clearAllShields();
        }
        return dealt;
    }
}
