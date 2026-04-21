import Weapon from '../../../../modules/typeCard/weapon.js';
import { getCardConfig } from '../../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../../modules/Card.js';
import Equipment from '@/src/modules/weaponCategory/equipment.js';
import Enemy from '@/src/modules/typeCard/enemy.js';

export default class SwordSplendor extends Weapon {

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('SwordSplendor') ?? { id: 'sword-splendor', name: 'Sword Splendor', description: '', category: 'sword', rarity: 4 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        this.createCard();
        scene.add.existing(this);
    }

    createEquipment(config: any, durability: number): Equipment {
        return new SwordSplendor_equipment(config, durability);
    }

}

class SwordSplendor_equipment extends Equipment {
    Effect(enemy: Enemy, damage: number): boolean {
        enemy.takeDamage(damage, 'slash', 'hydro');
        return true;
    }

    get price(): number {
        return this.durability * 2;
    }
}