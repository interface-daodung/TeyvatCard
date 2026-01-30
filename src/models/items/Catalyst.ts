import Item from '../../modules/Item.js';
import type GameManager from '../../core/GameManager.js';

export default class Catalyst extends Item {
    constructor() {
        super(
            'Catalyst',
            'catalyst',
            'catalyst',
            10,
            10,
            'Tăng sức mạnh phép thuật',
            6
        );
    }

    override get power(): number {
        return this._power * (1 + this.level * 0.25);
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
