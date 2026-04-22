import Weapon from '../../../../modules/typeCard/weapon.js';
import { getCardConfig } from '../../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../../modules/Card.js';
import Equipment from '@/src/modules/weaponCategory/equipment.js';
import CatalystEquipment from '@/src/modules/weaponCategory/CatalystEquipment.js';
import type { DamageElement } from '@/src/modules/typeCard/character.js';
import Enemy from '@/src/modules/typeCard/enemy.js';

const DENDRO_ELEMENT: DamageElement = 'dendro';

export default class CatalystForest extends Weapon {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('CatalystForest') ?? { id: 'catalyst-forest', name: 'Catalyst Forest', description: '', category: 'catalyst', rarity: 3 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        this.createCard();
        scene.add.existing(this);
    }

    createEquipment(config: any, durability: number): Equipment {
        return new CatalystForest_equipment(config, durability);
    }

}

class CatalystForest_equipment extends CatalystEquipment {
    Effect(enemy: Enemy, damage: number): boolean {
        const effectData = this.getAffectedTargetIndexes(enemy);
        if (!effectData) return false;

        // CatalystForest fixed element is dendro; special effect only adds poisoning on enemy cards.
        const { cardManager, affectedTargetIndexes } = effectData;
        affectedTargetIndexes.forEach((index) => {
            const card = cardManager.getCard(index);
            if (!card) return;
            card.takeDamage?.(damage, 'Catalyst', DENDRO_ELEMENT);
            if (card.type === 'enemy') {
                card.setPoisoning?.();
            }
        });

        return true;
    }
}
