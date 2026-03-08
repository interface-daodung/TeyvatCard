import Card, { CardDefault } from '../card/Card.js';
import type { CreateDisplayResult, DisplayPosition } from '../card/Card.js';
import type { SceneWithGameManager } from '../card/Card.js';
import { CardViewOptions } from '../card/CardView.js';

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

    override buildViewOptions(): Partial<CardViewOptions> {
        return {
            hudDisplays: [
                { key: 'countdown', fillColor: 0xc57826, text: String(this.countdown), position: 'rightTop' },
                { key: 'bomb', fillColor: 0xff6600, text: String(this.damage), position: 'rightBottom' }
            ]
        };
    }

    takeDamage(damage: number, type: 'damage'): number {
        // super.takeDamage(damage, type); //thêm hiệu ứng dmg mặc định
        this.damage = Math.max(0, this.damage - damage);
        // this.bombDisplay.updateText(this.damage.toString());
        // this.showPopup(damage, type); cầm sửa 
        // this.view?.updateText('countdown', this.countdown);
        this.view?.updateText('bomb', this.damage);
        if (this.damage <= 0) {
            this.die();
        }
        return this.damage;
    }

    CardEffect(): boolean {
        this.scene.gameManager?.animationManager.startSwapCardsAnimation(
            this.index,
            this.scene.gameManager.cardManager.getCharacterIndex()
        );
        return true;
    }
}
