import Weapon from '../../../../modules/typeCard/weapon.js';
import { getCardConfig } from '../../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../../modules/Card.js';
import Equipment from '@/src/modules/weaponCategory/equipment.js';
import Enemy from '@/src/modules/typeCard/enemy.js';
import Character from '@/src/modules/typeCard/character.js';

export default class SwordSteampunk extends Weapon {
    // static CARD_KEY = 'SwordSteampunk';
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('SwordSteampunk') ?? { id: 'sword-steampunk', name: 'Sword Steampunk', description: '', category: 'sword', rarity: 1 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        // this.durability = this.GetRandom(3, 12);
        this.createCard();
        scene.add.existing(this);
    }
    createEquipment(config: any, durability: number): Equipment {
        return new SwordSteampunk_equipment(config, durability);
    }

}


class SwordSteampunk_equipment extends Equipment {
    Effect(enemy: Enemy, damage: number, character?: Character): boolean {
        enemy.takeDamage(damage, 'slash');
        if (character && character.weapon) {
            if (Math.random() < 0.2) {
                character.weapon.durability += damage; // Tăng độ bền của vũ khí lên 1
                console.log('Sword Steampunk effect triggered: Durability increased by ' + damage);
            }
        } else {
            console.warn('Character or weapon not found for Sword Steampunk effect.');
        }
        return true;
    }
}