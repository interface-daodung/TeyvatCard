import Card from '../Card.js';
import type { CardDefault } from '../Card.js';
import type { CreateDisplayResult, DisplayPosition } from '../Card.js';
import type { SceneWithGameManager } from '../Card.js';
import { soundManager } from '../../core/SoundManager.js';
import Character, { type DamageElement } from './character.js';
import { animationSlash } from '@/src/animations/Sprites/animationSlash.js';
import { animationStatePoison } from '@/src/animations/Sprites/animationStatePoison.js';
import { ShowPopup, type PopupPayload } from '../../components/shared/index.js';
import { CardShieldStackManager } from '../cardShieldStacks.js';

export type { CardShieldStack as EnemyShieldStack } from '../cardShieldStacks.js';

export default class Enemy extends Card {
    poisoning: boolean;
    health!: number;
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

    addShield(amount: number, turnsToExpire: number = 1, nameIdOfShield: string = 'default'): boolean {
        return this.shieldMgr.addShield(amount, turnsToExpire, nameIdOfShield);
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

        this.cardImage.setTint(0xe05656);
        setTimeout(() => this.cardImage.clearTint(), 200);

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

    CardEffect(): Promise<boolean> {
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
