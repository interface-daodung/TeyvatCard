import Enemy from '../../../modules/typeCard/enemy.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class IceShieldwall extends Enemy {
    static DEFAULT = {
        id: 'ice-shieldwall',
        name: 'Ice Shieldwall',
        element: 'cryo',
        type: 'enemy',
        description: 'Ice Shieldwall - Kẻ địch băng có khiên.',
        clan: 'hilichurl',
        rarity: 3
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, IceShieldwall.DEFAULT.name, IceShieldwall.DEFAULT.id, IceShieldwall.DEFAULT.type);
        (this as any).element = IceShieldwall.DEFAULT.element;
        this.description = IceShieldwall.DEFAULT.description;
        (this as any).rarity = IceShieldwall.DEFAULT.rarity;
        this.health = this.GetRandom(3, 10);
        this.score = this.GetRandom(1, 9);
        this.createCard();
        scene.add.existing(this);
    }
}
