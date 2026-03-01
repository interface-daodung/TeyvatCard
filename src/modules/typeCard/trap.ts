import Card, { CardDefault } from '../Card.js';
import type { CreateDisplayResult, DisplayPosition } from '../Card.js';
import type { SceneWithGameManager } from '../Card.js';

export default class Trap extends Card {
    damage!: number;
    damageDisplay!: CreateDisplayResult;

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number, name: string, nameId: string) {
        super(scene, x, y, index, name, nameId, 'trap');
    }

    override applyConfig(config: CardDefault): void {
        super.applyConfig(config);
        if (config.damageMin != null && config.damageMax != null) {
            this.damage = this.GetRandom(config.damageMin, config.damageMax);
        }
    }

     takeDamage(damage: number, type: 'damage'): number {
        // super.takeDamage(damage, type); //thêm hiệu ứng dmg mặc định
        this.damage = Math.max(0, this.damage - damage);
        this.damageDisplay.updateText(this.damage.toString());
        // this.showPopup(damage, type); cầm sửa 
        if (this.damage <= 0) {
            this.die();
        }
        return this.damage;
    }

    // die(): void {
    //     this.ProgressDestroy();
    //     if (this.scene?.gameManager) {
    //         const newCard = this.scene.gameManager.cardManager.cardFactory.createEmpty(this.scene, this.index);
    //         if (newCard) {
    //             this.scene.gameManager.cardManager.addCard(newCard, this.index).processCreation?.();
    //         }
    //     }
    // }

    addDisplayHUD(): void {
        if (this.damage) {
            this.damageDisplay = this.createDisplay(
                { fillColor: 0xff6600, text: this.damage.toString() },
                'rightBottom' as DisplayPosition
            );
        }
    }
}
