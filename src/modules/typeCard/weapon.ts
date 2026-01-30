import Card from '../Card.js';
import type { CreateDisplayResult, DisplayPosition } from '../Card.js';
import type { SceneWithGameManager } from '../Card.js';

export default class Weapon extends Card {
    durability!: number;
    durabilityDisplay!: CreateDisplayResult;

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number, name: string, nameId: string) {
        super(scene, x, y, index, name, nameId, 'weapon');
    }

    addDisplayHUD(): void {
        this.durabilityDisplay = this.createDisplay(
            { fillColor: 0xff6600, text: String(this.durability) },
            'rightBottom' as DisplayPosition
        );
    }

    CardEffect(): boolean {
        (this.scene.gameManager?.cardManager.CardCharacter as any)?.setWeapon({
            default: (this.constructor as typeof Card & { DEFAULT?: any }).DEFAULT,
            durability: this.durability
        });
        return false;
    }

    refinement(power: number): void {
        this.durability += power;
        this.durabilityDisplay.updateText(this.durability);
    }
}
