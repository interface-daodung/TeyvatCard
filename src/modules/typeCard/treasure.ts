import Card, { CardDefault } from '../card/Card.js';
import type { SceneWithGameManager } from '../card/Card.js';
import type { CardViewOptions } from '../../components/card/CardView.js';
import { Log } from '../../utils/Log.js';
import { soundManager } from '../../core/SoundManager.js';

export default class Treasure extends Card {
    durability!: number;

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number, name: string, nameId: string) {
        super(scene, x, y, index, name, nameId, 'treasure');
    }

    override applyConfig(config: CardDefault): void {
        super.applyConfig(config);
        if (config.durabilityMin != null && config.durabilityMax != null) {
            this.durability = this.GetRandom(config.durabilityMin, config.durabilityMax);
        }
    }

    /**
     * Cấu hình HUD cho CardView (durability).
     */
    protected override buildViewOptions(): Partial<CardViewOptions> {
        return {
            hudDisplays: [
                {
                    key: 'durability',
                    fillColor: 0xff6600,
                    text: String(this.durability ?? 0),
                    position: 'rightBottom'
                }
            ]
        };
    }

    takeDamage(damage: number, type: 'poisoning' | 'damage'): number {
        this.durability = Math.max(0, this.durability - damage);
        this.view?.updateText('durability', this.durability);
        this.view?.showPopup(damage, type);
        if (this.durability <= 0) {
            this.die();
        }
        return this.durability;
    }

    /**
     * Logic chết: chọn thẻ rơi ra và yêu cầu GameManager thay thế (requestReplaceCard).
     * Animation destroy/create do GameManager + CardView xử lý.
     */
    override die(): void {
        if (!this.scene?.gameManager) return;
        const factory = this.scene.gameManager.cardManager?.cardFactory;
        const contents = this.config?.contents;
        let newCard: Card | null;
        if (Array.isArray(contents) && contents.length > 0) {
            const key = contents[Math.floor(Math.random() * contents.length)];
            newCard = factory?.createCardByKey(this.scene, this.index, key) ?? null;
        } else {
            Log.warn(`[Treasure.die] Rương "${this.nameId}" không có contents hoặc rỗng, fallback createRandomCard.`);
            newCard = factory?.createRandomCard(this.scene, this.index) ?? null;
        }
        if (newCard) {
            this.scene.gameManager.requestReplaceCard(this.index, newCard);
        }
    }

    override CardEffect(): boolean {
        soundManager.play('Chest-sound');
        // Mở rương khi click: dùng chung logic die (requestReplaceCard + animation queue).
        this.die();
        return true;
    }
}
