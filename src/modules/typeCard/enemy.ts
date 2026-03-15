import Card from '../Card.js';
import type { CardDefault } from '../Card.js';
import type { CreateDisplayResult, DisplayPosition } from '../Card.js';
import { SpritesheetWrapper } from '../../utils/SpritesheetWrapper.js';
import type { SceneWithGameManager } from '../Card.js';
import { soundManager } from '../../core/SoundManager.js';
import Character from './character.js';

export default class Enemy extends Card {
    poisoning: boolean;
    health!: number;
    score!: number;
    hpDisplay!: CreateDisplayResult;

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number, name: string, nameId: string) {
        super(scene, x, y, index, name, nameId, 'enemy');
        this.poisoning = false;
    }

    addDisplayHUD(): void {
        this.hpDisplay = this.createDisplay(
            { fillColor: 0xff0000, text: String(this.health) },
            'rightTop' as DisplayPosition
        );
    }

    override applyConfig(config: CardDefault): void {
        super.applyConfig(config);
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
        console.log(`Enemy ${this.nameId} takes 1 poison damage, health is now ${this.health}.`);
    }

    takeDamage(damage: number, type?: string): number {
        if (this.health <= 0) return 0;
        // super.takeDamage(damage, type);
        this.health -= damage;
        this.hpDisplay.updateText(this.health.toString());
        if (type === 'slash') {
            SpritesheetWrapper.animationSlash(this.scene, this.x, this.y);
            soundManager.play('sword-sound');
        }
        if (type === 'poisoning') {
            const effect = SpritesheetWrapper.animationStatePoison(this.scene, 0, 0); // 0,0 = tâm card
            this.add(effect); // ✅ gắn làm con → tự follow card khi di chuyển
            // soundManager.play('poison');

        }

        this.showPopup(damage, 'damage');
        this.cardImage.setTint(0xe05656);
        setTimeout(() => this.cardImage.clearTint(), 200);
        if (this.health <= 0) {
            this.die();
        }
        return damage;
    }

    showPopup(amount: number, type: 'heal' | 'damage' = 'heal'): void {
        const color = type === 'heal' ? '#00ff00' : type === 'damage' ? '#ff0000' : '#ffffff';
        const prefix = type === 'heal' ? '+' : type === 'damage' ? '-' : '';

        const popupTextPosition = {
            x: (Math.random() * 2 - 1) * 30,
            y: (Math.random() * 2 - 1) * 30
        };

        const popupText = this.scene.add
            .text(popupTextPosition.x, popupTextPosition.y, `${prefix}${amount}`, {
                fontSize: '32px',
                color: color,
                fontFamily: 'Arial',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            })
            .setOrigin(0.5)
            .setDepth(2002);

        this.add(popupText);

        this.scene.tweens.add({
            targets: popupText,
            y: -50,
            alpha: 0.1,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => popupText.destroy()
        });
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
            const actualDamage = Math.min(weapon.durability, this.health);
            cardCharacter.weapon.Effect(this, actualDamage, cardCharacter);
            cardCharacter.reduceDurability(actualDamage);
            this.takeDamage(actualDamage, 'slash');
            return Promise.resolve(true); // Enemy biến mất ngay sau khi dùng, nên trả về true để emit 'completeMove';
        }
        this.scene.gameManager?.addCoin(this.score);
        if (cardCharacter?.takeDamage(this.health, 'damage') === 0) {
            return Promise.resolve(true);// Enemy biến mất ngay sau khi dùng, nên trả về true để emit 'completeMove';

        }
        return Promise.resolve(false); // Enemy không biến mất sau khi dùng, nên trả về false để không emit 'completeMove';
    }
}
