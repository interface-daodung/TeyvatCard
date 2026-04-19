import Weapon from '../../../../modules/typeCard/weapon.js';
import { getCardConfig } from '../../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../../modules/Card.js';
import CatalystEquipment from '@/src/modules/weaponCategory/CatalystEquipment.js';
import Equipment from '@/src/modules/weaponCategory/equipment.js';

export default class CatalystMagicGuide extends Weapon {
    // static CARD_KEY = 'CatalystMagicGuide';
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('CatalystMagicGuide') ?? { id: 'catalyst-magic-guide', name: 'Catalyst Magic Guide', description: '', category: 'catalyst', rarity: 4 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        // this.durability = this.GetRandom(3, 12);
        this.createCard();
        scene.add.existing(this);
    }

    override createEquipment(config: any, durability: number): Equipment {
        return new CatalystEquipment(config, durability);
    }

}