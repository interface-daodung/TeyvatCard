import Weapon from '../../../../modules/typeCard/weapon.js';
import { getCardConfig } from '../../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../../modules/Card.js';
import CatalystEquipment from '@/src/modules/weaponCategory/CatalystEquipment.js';
import Equipment from '@/src/modules/weaponCategory/equipment.js';

export default class CatalystSteampunk extends Weapon {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('CatalystSteampunk') ?? { id: 'catalyst-steampunk', name: 'Catalyst Steampunk', description: '', category: 'catalyst', rarity: 1 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        this.createCard();
        scene.add.existing(this);
    }

    createEquipment(config: any, durability: number): Equipment {
        return new CatalystEquipment(config, durability);
    }

}
    
