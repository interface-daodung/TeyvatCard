import Item from '../../modules/Item.js';
import { getCardConfig } from '../../modules/getCardConfig.js';
import type GameManager from '../../core/GameManager.js';
import Equipment from '../../modules/typeCard/equipment.js';
import { Log } from '../../utils/Log.js';
import Character from '@/src/modules/typeCard/character.js';

export default class Catalyst extends Item {
    constructor() {
        super('catalyst');
        this.applyConfig();
    }

    override effect(gameManager: GameManager): boolean {
        const factory = gameManager.cardManager.cardFactory as any;
        const catalystWeapons = factory.getWeaponClassesByCategory('catalyst');
        if (!catalystWeapons.length) {
            Log.error('[Catalyst.effect] Không có weapon nào có category "catalyst". Kiểm tra weaponClasses và libraryCards (category).');
            return false;
        }
        const picked = catalystWeapons[Math.floor(Math.random() * catalystWeapons.length)];
        const { cls, key } = picked;
        const defaultConfig = getCardConfig(key);
        if (!defaultConfig) {
            Log.warn('[Catalyst.effect] getCardConfig không trả về config cho key:', key);
        }
        const equipment =
            typeof (cls as any).createEquipment === 'function'
                ? (cls as any).createEquipment(defaultConfig ?? {}, this.power)
                : new Equipment(defaultConfig ?? {}, this.power);
        const cardCharacter = gameManager.cardManager.CardCharacter;
        if (!cardCharacter) {
            Log.error('[Catalyst.effect] CardCharacter không tồn tại, không thể setWeapon.');
            return false;
        }
        (cardCharacter as Character).setWeapon(equipment);
        return true;
    }
}
