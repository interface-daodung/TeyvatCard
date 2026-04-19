import Weapon from '../../../../modules/typeCard/weapon.js';
import { getCardConfig } from '../../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../../modules/Card.js';
import Equipment from '@/src/modules/weaponCategory/equipment.js';
import CatalystEquipment, { type GridCardManager } from '@/src/modules/weaponCategory/CatalystEquipment.js';
import Enemy from '@/src/modules/typeCard/enemy.js';

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
        const cardManager = enemy.scene?.gameManager?.cardManager as GridCardManager | undefined;
        if (!cardManager) return false;

        enemy.setPoisoning();
 
        const attackerIndex = cardManager.CardCharacter?.index;
        const targetIndex = enemy.index;
        if (attackerIndex == null || targetIndex == null) return false;

        const cardsBehindTarget = this.getCardsBehindTarget(cardManager, attackerIndex, targetIndex);
        cardsBehindTarget.forEach((card) => {
            card.takeDamage?.(damage, 'poisoning');
            if (card.type === 'enemy') {
                card.setPoisoning?.();
            }
        });

        return true;
    }
}
