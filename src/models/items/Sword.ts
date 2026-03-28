import Item from '../../modules/Item.js';
import { getCardConfig } from '../../modules/getCardConfig.js';
import type GameManager from '../../core/GameManager.js';
import Equipment from '../../modules/weaponCategory/equipment.js';
import { Log } from '../../utils/Log.js';
import { ItemAnimation } from '@/src/animations/ItemAnimation.js';

export default class Sword extends Item {
    constructor() {
        super('sword');
        this.applyConfig();
    }

    override effect(gameManager: GameManager): boolean {
        ItemAnimation.runAsync(gameManager.animationManager, this.image);

        const factory = gameManager.cardManager.cardFactory as any;
        const swordWeapons = factory.getWeaponClassesByCategory('sword');
        if (!swordWeapons.length) {
            Log.error('[Sword.effect] Không có weapon nào có category "sword". Kiểm tra weaponClasses và libraryCards (category).');
            return false;
        }
        const picked = swordWeapons[Math.floor(Math.random() * swordWeapons.length)];
        const { cls, key } = picked;
        const defaultConfig = getCardConfig(key);
        if (!defaultConfig) {
            Log.warn('[Sword.effect] getCardConfig không trả về config cho key:', key);
        }
        const equipment =
            typeof (cls as any).createEquipment === 'function'
                ? (cls as any).createEquipment(defaultConfig ?? {}, this.power)
                : new Equipment(defaultConfig ?? {}, this.power);
        const cardCharacter = gameManager.cardManager.CardCharacter;
        if (!cardCharacter) {
            Log.error('[Sword.effect] CardCharacter không tồn tại, không thể setWeapon.');
            return false;
        }
        (cardCharacter as any).setWeapon(equipment);
        return true;
    }
}
