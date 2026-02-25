import Item from '../../modules/Item.js';
import { getCardConfig } from '../../modules/getCardConfig.js';
import type GameManager from '../../core/GameManager.js';

export default class Catalyst extends Item {
    constructor() {
        super('catalyst');
        this.applyConfig();
    }

    override effect(gameManager: GameManager): boolean {
        const factory = gameManager.cardManager.cardFactory as any;
        const weaponClasses = factory.weaponClasses;
        const randomClass = weaponClasses[Math.floor(Math.random() * weaponClasses.length)];
        const key = (randomClass as any)?.CARD_KEY;
        const defaultConfig = key ? getCardConfig(key) : null;
        (gameManager.cardManager.CardCharacter as any)?.setWeapon({
            default: defaultConfig,
            durability: this.power
        });
        return true;
    }
}
