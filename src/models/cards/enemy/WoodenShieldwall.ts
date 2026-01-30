import Enemy from '../../../modules/typeCard/enemy.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class WoodenShieldwall extends Enemy {
    static DEFAULT = {
        id: 'wooden-shieldwall',
        name: 'Wooden Shieldwall',
        element: 'physical',
        type: 'enemy',
        description: 'Wooden Shieldwall - Kẻ địch có khiên gỗ.',
        clan: 'hilichurl',
        rarity: 3
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, WoodenShieldwall.DEFAULT.name, WoodenShieldwall.DEFAULT.id);
        (this as any).element = WoodenShieldwall.DEFAULT.element;
        this.description = WoodenShieldwall.DEFAULT.description;
        (this as any).rarity = WoodenShieldwall.DEFAULT.rarity;
        this.health = this.GetRandom(3, 10);
        this.score = this.GetRandom(1, 9);
        this.createCard();
        scene.add.existing(this);
    }
}
