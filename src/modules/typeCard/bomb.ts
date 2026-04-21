import { SwapCardsAnimation } from '@/src/animations/SwapCardsAnimation.js';
import Card, { CardDefault } from '../Card.js';
import type { CreateDisplayResult, DisplayPosition } from '../Card.js';
import type { SceneWithGameManager } from '../Card.js';

export default class Bomb extends Card {
    countdown!: number;
    damage!: number;
    countdownDisplay!: CreateDisplayResult;
    bombDisplay!: CreateDisplayResult;

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number, name: string, nameId: string) {
        super(scene, x, y, index, name, nameId, 'bomb');
    }

    override applyConfig(config: CardDefault): void {
        super.applyConfig(config);
        if (config.countdown != null) this.countdown = Number(config.countdown);
        if (config.damageMin != null && config.damageMax != null) {
            this.damage = this.GetRandom(config.damageMin, config.damageMax);
        }
    }

    addDisplayHUD(): void {
        this.countdownDisplay = this.createDisplay(
            { fillColor: 0xc57826, text: this.countdown.toString() },
            'rightTop' as DisplayPosition
        );
        this.bombDisplay = this.createDisplay(
            { fillColor: 0xff6600, text: this.damage.toString() },
            'rightBottom' as DisplayPosition
        );
    }

    takeDamage(damage: number, type: 'damage'): number {
        // super.takeDamage(damage, type); //thêm hiệu ứng dmg mặc định
        this.damage = Math.max(0, this.damage - damage);
        this.bombDisplay.updateText(this.damage.toString());
        // this.showPopup(damage, type); cầm sửa 
        if (this.damage <= 0) {
            this.die();
        }
        return this.damage;
    }

    async CardEffect(): Promise<boolean> {
        await SwapCardsAnimation.runAsync(this.scene.gameManager!.animationManager,
            this.index, this.scene.gameManager!.cardManager.getCharacterIndex());
        return Promise.resolve(true); // Bomb biến mất ngay sau khi dùng, nên trả về true để emit 'completeMove';
    }
}
