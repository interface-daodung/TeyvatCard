import Card from '../Card.js';
import type { CardDefault } from '../Card.js';
import type { CreateDisplayResult, DisplayPosition } from '../Card.js';
import type { SceneWithGameManager } from '../Card.js';
import { soundManager } from '../../core/SoundManager.js';

export default class Coin extends Card {
    score!: number;
    rarity!: number;
    coinDisplay!: CreateDisplayResult;

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number, name: string, nameId: string) {
        super(scene, x, y, index, name, nameId, 'coin');
        this.score = this.GetRandom(1, 9);
    }

    override applyConfig(config: CardDefault): void {
        super.applyConfig(config);
        // if (config.rarity != null) this.rarity = config.rarity;
    }

    addDisplayHUD(): void {
        this.coinDisplay = this.createDisplay(
            { fillColor: 0xff6600, text: this.score.toString() },
            'rightBottom' as DisplayPosition
        );
    }

    setScore(score: number): void {
        this.score = score;
        this.coinDisplay.updateText(this.score);
    }

    resonance(): void {
        this.score *= 2;
        this.name = this.name.replace('Mảnh Vỡ Nguyên Tố', 'Nguyên Tố Cộng Hưởng');
        this.nameId = this.nameId.replace('fragment', 'resonance');
        const resonanceDesc = this.config?.resonanceDescription ?? (this.constructor as typeof Card & { DEFAULT?: { resonanceDescription?: string } }).DEFAULT?.resonanceDescription;
        if (resonanceDesc) this.description = resonanceDesc;
        this.cardImage.setTexture(this.type, this.nameId);
        this.coinDisplay.updateText(this.score);
        this.processCreation();
    }

    takeDamage(damage: number, type: 'damage'): number {
        // super.takeDamage(damage, type); //thêm hiệu ứng dmg mặc định
        this.score = Math.max(0, this.score - damage);
        this.coinDisplay.updateText(this.score.toString());
        // this.showPopup(damage, type); cầm sửa 
        if (this.score <= 0) {
            this.die();
        }
        return this.score;
    }

    die(): void {
        this.ProgressDestroy();
        if (this.scene?.gameManager) {
            const newCard = this.scene.gameManager.cardManager.cardFactory.createEmpty(this.scene, this.index);
            if (newCard) {
                this.scene.gameManager.cardManager.addCard(newCard, this.index).processCreation?.();
            }
        }
    }

    CardEffect(): boolean {
        if (this.nameId.endsWith('resonance')) {
            this.scene.gameManager?.addCoin(this.score, 3);
        } else {
            this.scene.gameManager?.addCoin(this.score, 1);
        }
        // soundManager.play('Coin-sound');
        return false;
    }
}
