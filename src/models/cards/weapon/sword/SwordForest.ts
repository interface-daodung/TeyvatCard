import Weapon from '../../../../modules/typeCard/weapon.js';
import { getCardConfig } from '../../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../../modules/Card.js';
import Equipment from '@/src/modules/weaponCategory/equipment.js';
import Enemy from '@/src/modules/typeCard/enemy.js';

export default class SwordForest extends Weapon {
    // static CARD_KEY = 'SwordForest';
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('SwordForest') ?? { id: 'sword-forest', name: 'Sword Forest', description: '', category: 'sword', rarity: 3 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        this.createCard();
        scene.add.existing(this);
    }

    createEquipment(config: any, durability: number): Equipment {
        return new SwordForest_equipment(config, durability);
    }

}

class SwordForest_equipment extends Equipment {
    Effect(enemy: Enemy, damage: number): boolean {
        enemy.setPoisoning();
        enemy.takeDamage(damage, 'slash');
        return true;
    }
}