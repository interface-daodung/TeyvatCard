import Card from '../card/Card.js';
import type { CardDefault } from '../card/Card.js';
import type { SceneWithGameManager } from '../card/Card.js';
import { SpritesheetWrapper } from '../../utils/SpritesheetWrapper.js';
import { soundManager } from '../../core/SoundManager.js';
import Character from './character.js';
import type { HudDisplaySpec } from '../../components/card/CardView.js';

export default class Enemy extends Card {
    poisoning: boolean;
    health!: number;
    score!: number;

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number, name: string, nameId: string) {
        super(scene, x, y, index, name, nameId, 'enemy');
        this.poisoning = false;
    }

    override applyConfig(config: CardDefault): void {
        super.applyConfig(config);
        if (config.element != null) (this as any).element = config.element;
        if (config.healthMin != null && config.healthMax != null) {
            this.health = this.GetRandom(config.healthMin, config.healthMax);
        }
        if (config.scoreMin != null && config.scoreMax != null) {
            this.score = this.GetRandom(config.scoreMin, config.scoreMax);
        }
    }

    override buildViewOptions(): { hudDisplays: HudDisplaySpec[] } {
        return {
            hudDisplays: [
                { key: 'hp', fillColor: 0xff0000, text: String(this.health), position: 'rightTop' }
            ]
        };
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
    }

    PoisoningEffect(): void {
        if (this.health > 1 && this.poisoning) {
            this.takeDamage(1, 'poisoning');
        }
    }

    override takeDamage(damage: number, type?: string): number {
        if (this.health <= 0) return 0;
        this.health -= damage;
        this.view?.updateText('hp', this.health);
        if (type === 'slash') {
            if (this.view) SpritesheetWrapper.animationSlash(this.scene, this.view.x, this.view.y);
            soundManager.play('sword-sound');
        }
        this.view?.showPopup(damage, 'damage');
        this.view?.setCardImageTint(0xe05656);
        this.scene.time.delayedCall(200, () => this.view?.clearCardImageTint());
        if (this.health <= 0) this.die();
        return damage;
    }

    override die(): void {
        if (this.scene?.gameManager) {
            const newCard = this.scene.gameManager.cardManager.cardFactory.createCoin(
                this.scene,
                this.index,
                this.score
            );
            this.scene.gameManager.requestReplaceCard(this.index, newCard);
        }
    }

    override CardEffect(): boolean {
        const cardCharacter = this.scene.gameManager?.cardManager.CardCharacter as Character;
        const weapon = cardCharacter?.weapon;
        if (weapon?.durability > 0) {
            const actualDamage = Math.min(weapon.durability, this.health);
            cardCharacter.reduceDurability(actualDamage);
            this.takeDamage(actualDamage, 'slash');
            return true;
        }
        this.scene.gameManager?.addCoin(this.score);
        if (cardCharacter?.takeDamage(this.health, 'damage') === 0) {
            return true;
        }
        return false;
    }
}
