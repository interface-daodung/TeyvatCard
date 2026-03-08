import Card from '../card/Card.js';
import type { CardDefault } from '../card/Card.js';
import type { CreateDisplayResult } from '../card/Card.js';
import type { SceneWithGameManager } from '../card/Card.js';
import { CardViewOptions } from '../card/CardView.js';
import Character from './character.js';
import Equipment from './equipment.js';

export default class Weapon extends Card {
    durability!: number;
    durabilityDisplay!: CreateDisplayResult;

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number, name: string, nameId: string) {
        super(scene, x, y, index, name, nameId, 'weapon');
    }

    override applyConfig(config: CardDefault): void {
        super.applyConfig(config);
        if (config.durabilityMin != null && config.durabilityMax != null) {
            this.durability = this.GetRandom(config.durabilityMin, config.durabilityMax);
        }
    }

    override buildViewOptions(): Partial<CardViewOptions> {
        return {
            hudDisplays: [
                { key: 'durability', fillColor: 0xff6600, text: String(this.durability), position: 'rightBottom' }
            ]
        };
    }

    takeDamage(damage: number, type: 'damage'): number {
        // super.takeDamage(damage, type); //thêm hiệu ứng dmg mặc định
        this.durability = Math.max(0, this.durability - damage);
        this.view?.updateText('durability', this.durability);        
        // this.showPopup(damage, type); cầm sửa 
        if (this.durability <= 0) {
            this.die();
        }
        return this.durability;
    }

    /**
     * Tạo Equipment từ config + durability. Weapon con override để trả về custom equipment (vd SwordSplendor_equipment).
     */
    static createEquipment(config: any, durability: number): Equipment {
        return new Equipment(config, durability);
    }

    CardEffect(): boolean {

        const weapon = this as Weapon;

        (this.scene.gameManager?.cardManager.CardCharacter as Character)?.setWeapon(
            new Equipment(this.config, weapon.durability)
        );

        return false;
    }
}

