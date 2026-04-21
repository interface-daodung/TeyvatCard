import Weapon from '../../../../modules/typeCard/weapon.js';
import { getCardConfig } from '../../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../../modules/Card.js';
import Equipment from '@/src/modules/weaponCategory/equipment.js';
import Enemy from '@/src/modules/typeCard/enemy.js';
import Character from '@/src/modules/typeCard/character.js';

export default class SwordSacrificial extends Weapon {
    // static CARD_KEY = 'SwordSacrificial';
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('SwordSacrificial') ?? { id: 'sword-sacrificial', name: 'Sword Sacrificial', description: '', category: 'sword', rarity: 4 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        this.createCard();
        scene.add.existing(this);
    }

    createEquipment(config: any, durability: number): Equipment {
        return new SwordSacrificial_equipment(config, durability);
    }
}

class SwordSacrificial_equipment extends Equipment {
    Effect(enemy: Enemy, damage: number, character?: Character): boolean {
        character?.takeDamage(1, 'damage');
        return super.Effect(enemy, damage, character);
    }
}
