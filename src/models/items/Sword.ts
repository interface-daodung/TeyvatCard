import Item from '../../modules/Item.js';
import type GameManager from '../../core/GameManager.js';

export default class Sword extends Item {
    constructor() {
        super(
            'Sword',
            'sword',
            'sword',
            10,
            1,
            'Vũ khí mạnh với 60 damage',
            5
        );
    }

    override get power(): number {
        return this._power * (1 + this.level * 0.25);
    }

    override get cooldown(): number {
        return Math.max(0, this._cooldown - this.level * 0.3);
    }

    override effect(gameManager: GameManager): boolean {
        const factory = gameManager.cardManager.cardFactory as any;
        const weaponClasses = factory.weaponClasses;
        const randomClass = weaponClasses[Math.floor(Math.random() * weaponClasses.length)];
        (gameManager.cardManager.CardCharacter as any)?.setWeapon({
            default: randomClass?.DEFAULT,
            durability: this.power
        });
        return true;
    }
}
