import Card from '../card/Card.js';
import type { CardDefault } from '../card/Card.js';
import type { SceneWithGameManager } from '../card/Card.js';
import type { HudDisplaySpec } from '../card/CardView.js';

export default class Coin extends Card {
    score!: number;
    rarity!: number;

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number, name: string, nameId: string) {
        super(scene, x, y, index, name, nameId, 'coin');
        this.score = this.GetRandom(1, 9);
    }

    override applyConfig(config: CardDefault): void {
        super.applyConfig(config);
    }

    override buildViewOptions(): { hudDisplays: HudDisplaySpec[] } {
        return {
            hudDisplays: [
                { key: 'score', fillColor: 0xff6600, text: String(this.score), position: 'rightBottom' }
            ]
        };
    }

    setScore(score: number): void {
        this.score = score;
        this.view?.updateText('score', this.score);
    }
    // Coin đặc biệt: khi cộng hưởng sẽ tăng gấp đôi điểm và đổi tên (dựa trên nameId), đồng thời có thể thay đổi description (dựa trên config resonanceDescription).
    resonance(): void {
        this.score *= 2;
        this.name = this.name.replace('Mảnh Vỡ Nguyên Tố', 'Nguyên Tố Cộng Hưởng');
        this.nameId = this.nameId.replace('fragment', 'resonance');
        const resonanceDesc = this.config?.resonanceDescription ?? (this.constructor as typeof Card & { DEFAULT?: { resonanceDescription?: string } }).DEFAULT?.resonanceDescription;
        if (resonanceDesc) this.description = resonanceDesc;
        this.view?.updateTexture(this.type, this.nameId);
        this.view?.updateText('score', this.score);
    }

    override takeDamage(damage: number, _type: 'damage'): number {
        this.score = Math.max(0, this.score - damage);
        this.view?.updateText('score', this.score);
        if (this.score <= 0) this.die();
        return this.score;
    }

    override die(): void {
        if (this.scene?.gameManager) {
            const newCard = this.scene.gameManager.cardManager.cardFactory.createEmpty(this.scene, this.index);
            this.scene.gameManager.requestReplaceCard(this.index, newCard);
        }
    }

    override CardEffect(): boolean {
        if (this.nameId.endsWith('resonance')) {
            this.scene.gameManager?.addCoin(this.score, 3);
        } else {
            this.scene.gameManager?.addCoin(this.score, 1);
        }
        return false;
    }
}
