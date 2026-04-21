import Enemy from '../../../modules/typeCard/enemy.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import type { DamageElement } from '../../../modules/typeCard/character.js';
import { setFrameLayer } from '../../../modules/card/cardDisplay.js';

const INNATE_SHIELD_TURNS = 999;
const INNATE_SHIELD_STACK_ID = 'wooden-shieldwall-innate';
const HYDRO_SEED_DELAY_TURNS = 2;
const SEED_TINT_COLOR = 0xa8e6a3;

export default class WoodenShieldwall extends Enemy {
    private seedTurnsRemaining = 0;
    private seedDamage = 0;
    private seeded = false;
    private hideSeedLayerFn: (() => void) | null = null;
    private unsubSeedTick: (() => void) | null = null;
    private readonly debugTag = '[WoodenShieldwall]';

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('WoodenShieldwall') ?? { id: 'wooden-shieldwall', name: 'Wooden Shieldwall', description: '', element: 'dendro', clan: 'hilichurl', rarity: 3 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        this.createCard();
        this.setTokenElement('dendro');
        if (this.health > 0) {
            this.addShield(this.health, INNATE_SHIELD_TURNS, INNATE_SHIELD_STACK_ID);
        }
        scene.add.existing(this);
    }

    private setSeedForTurns(seedDamage: number, turns: number = HYDRO_SEED_DELAY_TURNS): void {
        this.seedDamage = Math.max(0, Math.floor(seedDamage));
        this.seedTurnsRemaining = Math.max(1, Math.floor(turns));
        if (!this.seeded) {
            this.seeded = true;
            this.cardImage.setTint(SEED_TINT_COLOR);
            this.showSeedLayer();
        }
        console.log(
            `${this.debugTag} setSeedForTurns called`,
            { seedDamageInput: seedDamage, seedDamageStored: this.seedDamage, turnsStored: this.seedTurnsRemaining, health: this.health, shield: this.shield, index: this.index }
        );
        if (this.unsubSeedTick) return;
        this.unsubSeedTick = this.scene.gameManager?.emitter.on(
            'completeMove',
            this.handleSeedTurnEnd.bind(this),
            9
        ) ?? null;
        console.log(
            `${this.debugTag} register completeMove listener`,
            { hasListener: Boolean(this.unsubSeedTick), health: this.health, shield: this.shield, index: this.index }
        );
        if (this.unsubSeedTick) {
            this.unsubscribeList.push(this.unsubSeedTick);
        }
    }

    private handleSeedTurnEnd(): void {
        console.log(
            `${this.debugTag} handleSeedTurnEnd tick`,
            { seedTurnsRemainingBefore: this.seedTurnsRemaining, seedDamage: this.seedDamage, health: this.health, shield: this.shield, index: this.index }
        );
        if (this.seedTurnsRemaining <= 0) return;
        this.seedTurnsRemaining -= 1;
        console.log(
            `${this.debugTag} seedTurnsRemaining after decrement`,
            { seedTurnsRemainingAfter: this.seedTurnsRemaining, health: this.health, shield: this.shield, index: this.index }
        );
        if (this.seedTurnsRemaining > 0) return;
        const pendingSeedDamage = this.seedDamage;
        this.seedDamage = 0;
        this.seeded = false;
        this.cardImage.clearTint();
        this.hideSeedLayer();
        if (this.unsubSeedTick) {
            this.unsubSeedTick();
            this.unsubSeedTick = null;
            console.log(
                `${this.debugTag} unregistered completeMove listener`,
                { pendingSeedDamage, health: this.health, shield: this.shield, index: this.index }
            );
        }
        if (pendingSeedDamage > 0 && this.health > 0) {
            console.log(
                `${this.debugTag} apply seed damage`,
                { pendingSeedDamage, healthBefore: this.health, shieldBefore: this.shield, index: this.index }
            );
            super.takeDamage(pendingSeedDamage, 'seed', 'dendro');
            console.log(
                `${this.debugTag} seed damage applied`,
                { healthAfter: this.health, shieldAfter: this.shield, index: this.index }
            );
        } else {
            console.log(
                `${this.debugTag} skip seed damage`,
                { pendingSeedDamage, health: this.health, shield: this.shield, index: this.index }
            );
        }
    }

    private showSeedLayer(): void {
        if (!this.hideSeedLayerFn) {
            this.hideSeedLayerFn = setFrameLayer(this, this.cardImage, {
                textureKey: 'seed'
            });
        }
    }

    private hideSeedLayer(): void {
        this.hideSeedLayerFn?.();
        this.hideSeedLayerFn = null;
    }

    override takeDamage(damage: number, type?: string, element: DamageElement | null = null): number {
        if (this.health <= 0) return 0;

        let finalDamage = damage;
        const shieldBeforeDamage = this.shield;

        // Dendro giảm 50% sát thương khi còn khiên.
        if (element === 'dendro' && this.shield > 0 && damage > 0) {
            const reducedDamage = Math.max(1, Math.ceil(damage / 2));
            finalDamage = Math.max(0, damage - reducedDamage);
        }

        // Pyro xuyên giáp.
        if (element === 'pyro') {
            this.clearAllShields();
        }
        console.log(
            `${this.debugTag} takeDamage input`,
            { damage, finalDamage, type, element, healthBefore: this.health, shieldBeforeDamage, shieldCurrent: this.shield, index: this.index }
        );

        const dealt = super.takeDamage(finalDamage, type, element);
        console.log(
            `${this.debugTag} takeDamage result`,
            { dealt, element, healthAfter: this.health, shieldAfter: this.shield, index: this.index }
        );

        // Hydro gắn seed sau khi tính damage, không đổi hiệu ứng thẻ.
        // Seed nổ sau 1 lượt, damage bằng lượng shield trước hit hydro.
        if (element === 'hydro' && this.health > 0) {
            console.log(
                `${this.debugTag} hydro branch`,
                { shieldBeforeDamage, healthAfterHit: this.health, shieldAfterHit: this.shield, index: this.index }
            );
            this.setSeedForTurns(shieldBeforeDamage);
            this.clearAllShields();
            console.log(
                `${this.debugTag} shields cleared after hydro`,
                { health: this.health, shield: this.shield, index: this.index }
            );
        }

        return dealt;
    }
}
