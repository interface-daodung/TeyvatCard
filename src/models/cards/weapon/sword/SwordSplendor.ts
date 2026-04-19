import Weapon from '../../../../modules/typeCard/weapon.js';
import { getCardConfig } from '../../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../../modules/Card.js';
import Character from '@/src/modules/typeCard/character.js';
import Equipment from '@/src/modules/weaponCategory/equipment.js';

export default class SwordSplendor extends Weapon {
    // static CARD_KEY = 'SwordSplendor';


    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('SwordSplendor') ?? { id: 'sword-splendor', name: 'Sword Splendor', description: '', category: 'sword', rarity: 4 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        // this.durability = this.GetRandom(3, 12);
        this.createCard();
        scene.add.existing(this);
    }

    createEquipment(config: any, durability: number): Equipment {
        return new SwordSplendor_equipment(config, durability);
    }


    // CardEffect(): boolean {

    //     const weapon = this as Weapon;

    //     (this.scene.gameManager?.cardManager.CardCharacter as Character)?.setWeapon(
    //         //new SwordSplendor_equipment(this.config, weapon.durability)
    //         this.createEquipment(this.config, weapon.durability)
    //     );

    //     return false;
    // }
}

class SwordSplendor_equipment extends Equipment {
    // constructor(config: any, durability: number) {
    //     super(config, durability);
    // }

    get price(): number {
        return this.durability * 2;
    }
}