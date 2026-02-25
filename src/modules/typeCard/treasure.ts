import Card, { CardDefault } from '../Card.js';
import type { CreateDisplayResult, DisplayPosition } from '../Card.js';
import type { SceneWithGameManager } from '../Card.js';

export default class Treasure extends Card {
    durability!: number;
    durabilityDisplay!: CreateDisplayResult;

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number, name: string, nameId: string) {
        super(scene, x, y, index, name, nameId, 'treasure');
    }

    override applyConfig(config: CardDefault): void {
        super.applyConfig(config);
        if (config.durabilityMin != null && config.durabilityMax != null) {
            this.durability = this.GetRandom(config.durabilityMin, config.durabilityMax);
        }
    }

        takeDamage(damage: number, type: 'poisoning' | 'damage'): number {
        // super.takeDamage(damage, type); //thêm hiệu ứng dmg mặc định
        this.durability = Math.max(0, this.durability - damage);
        this.durabilityDisplay.updateText(this.durability.toString());
        // this.showPopup(damage, type); cầm sửa 
        if (this.durability <= 0) {
            this.die();
        }
        return this.durability;
    }


    die(): void {
        this.ProgressDestroy();
        if (this.scene?.gameManager) {
            const newCard = this.scene.gameManager.cardManager?.cardFactory.createRandomCard(
                this.scene,
                this.index);
            if (newCard) {
                this.scene.gameManager.cardManager.addCard(newCard, this.index).processCreation?.();
            }
        }
    }

    addDisplayHUD(): void {
        this.durabilityDisplay = this.createDisplay(
            { fillColor: 0xff6600, text: this.durability.toString() },
            'rightBottom' as DisplayPosition
        );
    }

    CardEffect(): boolean {
        this.ProgressDestroy();
        const newCard = this.scene.gameManager?.cardManager.cardFactory.createRandomCard(this.scene, this.index);
        if (newCard) {
            this.scene.gameManager?.cardManager.addCard(newCard, this.index).processCreation?.();
        }
        return true;
    }
}
