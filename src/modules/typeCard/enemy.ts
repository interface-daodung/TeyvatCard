import Card from '../Card.js';
import type { CardDefault } from '../Card.js';
import type { CreateDisplayResult, DisplayPosition } from '../Card.js';
import type { SceneWithGameManager } from '../Card.js';
import type Phaser from 'phaser';
import { SwapCardsAnimation } from '@/src/animations/SwapCardsAnimation.js';
import { soundManager } from '../../core/SoundManager.js';
import Character, { type DamageElement } from './character.js';
import { animationSlash } from '@/src/animations/Sprites/animationSlash.js';
import { animationStatePoison } from '@/src/animations/Sprites/animationStatePoison.js';
import { ShowPopup, type PopupPayload } from '../../components/shared/index.js';
import { CardShieldStackManager } from '../cardShieldStacks.js';
import { setFrameLayer, toDamageElement } from '../card/cardDisplay.js';

export type { CardShieldStack as EnemyShieldStack } from '../cardShieldStacks.js';

export default class Enemy extends Card {
    poisoning: boolean;
    frozen: boolean;
    protected frozenTurnsRemaining: number;
    private unsubDefrost?: (() => void) | null;
    private pendingDefrostRegistration: boolean;
    health!: number;
    private hideFrozenLayerFn: (() => void) | null;
    /** Tổng khiên (đồng bộ qua `shieldMgr`). */
    shield = 0;
    private readonly shieldMgr: CardShieldStackManager;
    score!: number;
    hpDisplay!: CreateDisplayResult;
    shieldDisplay!: CreateDisplayResult;
    clan!: string;
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number, name: string, nameId: string) {
        super(scene, x, y, index, name, nameId, 'enemy');
        this.poisoning = false;
        this.frozen = false;
        this.frozenTurnsRemaining = 0;
        this.unsubDefrost = null;
        this.pendingDefrostRegistration = false;
        this.hideFrozenLayerFn = null;
        this.shieldMgr = new CardShieldStackManager({
            getScene: () => this.scene,
            getDestroyed: () => this.destroyed,
            getUnsubscribeList: () => this.unsubscribeList,
            applyShieldTotal: (total) => {
                this.shield = total;
                this.shieldDisplay?.updateText(String(total));
            }
        });
    }

    addDisplayHUD(): void {
        this.hpDisplay = this.createDisplay(
            { fillColor: 0xff0000, text: String(this.health) },
            'rightTop' as DisplayPosition
        );
        this.shieldDisplay = this.createDisplay(
            {
                text: String(this.shield),
                backgroundIcon: '🛡️',
                backgroundIconSize: '36px'
            },
            'leftTop' as DisplayPosition
        );
    }

    override applyConfig(config: CardDefault): void {
        super.applyConfig(config);
        this.clan = config.clan;
        if (config.element != null) (this as any).element = config.element;
        // if (config.rarity != null) (this as any).rarity = config.rarity;
        if (config.healthMin != null && config.healthMax != null) {
            this.health = this.GetRandom(config.healthMin, config.healthMax);
        }
        if (config.scoreMin != null && config.scoreMax != null) {
            this.score = this.GetRandom(config.scoreMin, config.scoreMax);
        }
    }

    setPoisoning(): void {
        this.poisoning = true;
        const unsub = this.scene.gameManager?.emitter.on(
            'completeMove',
            this.PoisoningEffect.bind(this),
            5
        );
        if (unsub && typeof unsub === 'function') {
            this.unsubscribeList.push(unsub);
        }
        console.log(`Enemy ${this.nameId} is now poisoned.`);
    }

    PoisoningEffect(): void {
        if (this.health > 1 && this.poisoning) {
            this.takeDamage(1, 'poisoning');
        }
        console.log(
            `Enemy ${this.nameId} takes 1 poison damage, health is now ${this.health}, shield ${this.shield}.`
        );
    }

    expireShield(): void {
        this.shieldMgr.expireShield();
    }

    /** Đặt mọi stack khiên về 0 (subclass gọi khi cần, ví dụ Pyro phá khiên băng). */
    protected clearAllShields(): void {
        this.shieldMgr.clearAll();
    }

    addShield(amount: number, turnsToExpire: number = 1, nameIdOfShield: string = 'default'): boolean {
        return this.shieldMgr.addShield(amount, turnsToExpire, nameIdOfShield);
    }

    protected setFrozenForOneTurn(): void {
        this.setFrozenForTurns(1);
    }

    protected setFrozenForTurns(turns: number): void {
        const normalizedTurns = Math.max(1, Math.floor(turns));
        if (!this.frozen) {
            this.frozen = true;
            this.cardImage.setTint(0x66ccff);
            this.showFrozenLayer();
        }
        this.frozenTurnsRemaining = Math.max(this.frozenTurnsRemaining, normalizedTurns);
        if (this.unsubDefrost || this.pendingDefrostRegistration) return;
        this.pendingDefrostRegistration = true;
        Promise.resolve().then(() => {
            this.pendingDefrostRegistration = false;
            if (!this.frozen || this.unsubDefrost || this.destroyed) return;
            this.unsubDefrost = this.scene.gameManager?.emitter.on(
                'completeMove',
                this.handleFrozenTurnEnd.bind(this),
                9
            ) ?? null;
            if (this.unsubDefrost) this.unsubscribeList.push(this.unsubDefrost);
        });
    }

    private handleFrozenTurnEnd(): void {
        if (!this.frozen) return;
        this.frozenTurnsRemaining = Math.max(0, this.frozenTurnsRemaining - 1);
        if (this.frozenTurnsRemaining <= 0) {
            this.defrost();
        }
    }

    private defrost(): void {
        this.frozen = false;
        this.frozenTurnsRemaining = 0;
        if (this.unsubDefrost) {
            this.unsubDefrost();
            this.unsubDefrost = null;
        }
        this.cardImage.clearTint();
        this.hideFrozenLayer();
    }

    private showFrozenLayer(): void {
        if (!this.hideFrozenLayerFn) {
            this.hideFrozenLayerFn = setFrameLayer(this, this.cardImage, {
                textureKey: 'frozen'
            });
        }
    }

    private hideFrozenLayer(): void {
        this.hideFrozenLayerFn?.();
        this.hideFrozenLayerFn = null;
    }

    takeDamage(damage: number, type?: string, element: DamageElement | null = null): number {
        if (this.health <= 0) return 0;

        let absorbedByShield = 0;
        let hpLoss = 0;

        if (type === 'poisoning') {
            const effect = animationStatePoison(this.scene, 0, 0);
            this.add(effect);
            hpLoss = damage;
            this.health -= hpLoss;
            this.hpDisplay.updateText(this.health.toString());
            this.showPopup(hpLoss, 'poisoning');
        } else {
            let remaining = damage;
            const shieldTotal = this.shieldMgr.getTotal();
            if (shieldTotal > 0 && remaining > 0) {
                absorbedByShield = Math.min(shieldTotal, remaining);
                remaining -= absorbedByShield;
                this.shieldMgr.absorb(absorbedByShield);
                if (absorbedByShield > 0) {
                    this.showPopup(absorbedByShield, { color: '#ffbb00', prefix: '⛨' });
                }
            }
            if (remaining > 0) {
                hpLoss = remaining;
                this.health -= hpLoss;
                this.hpDisplay.updateText(this.health.toString());
                this.showPopup(remaining, 'damage');
            }
            if (type === 'slash') {
                animationSlash(this.scene, this.x, this.y);
                soundManager.play('sword-sound');
            }
        }

        if (this.health <= 0) {
            this.die();
        }
        return absorbedByShield + hpLoss;
    }

    showPopup(amount: number, type: PopupPayload = 'heal'): void {
        ShowPopup.show(this, amount, type);
    }

    die(): void {
        this.ProgressDestroy();
        if (this.scene?.gameManager) {
            const newCard = this.scene.gameManager.cardManager.cardFactory.createCoin(
                this.scene,
                this.index,
                this.score
            );
            if (newCard) {
                this.scene.gameManager.cardManager.addCard(newCard, this.index).processCreation?.();
            }
        }
    }

    async CardEffect(): Promise<boolean> {
        if (this.frozen) {
            await SwapCardsAnimation.runAsync(
                this.scene.gameManager!.animationManager,
                this.index,
                this.scene.gameManager!.cardManager.getCharacterIndex()
            );
            return Promise.resolve(true);
        }
        const cardCharacter = this.scene.gameManager?.cardManager.CardCharacter as Character;
        const weapon = cardCharacter?.weapon;
        if (weapon?.durability > 0) {
            const actualDamage = Math.min(
                weapon.durability,
                this.shieldMgr.getTotal() + this.health
            );
            cardCharacter.weapon.Effect(this, actualDamage, cardCharacter);
            cardCharacter.reduceDurability(actualDamage);
            return Promise.resolve(true); // Enemy biến mất ngay sau khi dùng, nên trả về true để emit 'completeMove';
        }
        this.scene.gameManager?.addCoin(this.score);
        if (cardCharacter?.takeDamage(this.health, 'damage') === 0) {
            return Promise.resolve(true);// Enemy biến mất ngay sau khi dùng, nên trả về true để emit 'completeMove';

        }
        return Promise.resolve(false); // Enemy không biến mất sau khi dùng, nên trả về false để không emit 'completeMove';
    }
}
