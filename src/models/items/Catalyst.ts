import Item from '../../modules/Item.js';
import { getCardConfig } from '../../modules/getCardConfig.js';
import { getWeaponClassesByCategory } from '../../modules/card/cardFactoryLibrary.js';
import type GameManager from '../../core/GameManager.js';
import Equipment from '../../modules/weaponCategory/equipment.js';
import { Log } from '../../utils/Log.js';
import Character from '@/src/modules/typeCard/character.js';
import { ItemAnimation } from '@/src/animations/ItemAnimation.js';

export default class Catalyst extends Item {
    constructor() {
        super('catalyst');
        this.applyConfig();
    }

    override effect(gameManager: GameManager): boolean {
        ItemAnimation.runAsync(gameManager.animationManager, this.image);
        const factory = gameManager.cardManager.cardFactory;
        const catalystWeapons = getWeaponClassesByCategory(factory.cardClasses, factory.weaponClasses, 'catalyst');
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
