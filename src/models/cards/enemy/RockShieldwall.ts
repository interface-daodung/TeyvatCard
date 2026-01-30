import Enemy from '../../../modules/typeCard/enemy.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class RockShieldwall extends Enemy {
    static DEFAULT = {
        id: 'rock-shieldwall',
        name: 'Rock Shieldwall',
        element: 'geo',
        type: 'enemy',
        description: 'Rock Shieldwall - Kẻ địch nham có khiên.',
        clan: 'hilichurl',
        rarity: 3
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, RockShieldwall.DEFAULT.name, RockShieldwall.DEFAULT.id, RockShieldwall.DEFAULT.type);
        (this as any).element = RockShieldwall.DEFAULT.element;
        this.description = RockShieldwall.DEFAULT.description;
        (this as any).rarity = RockShieldwall.DEFAULT.rarity;
        this.health = this.GetRandom(3, 10);
        this.score = this.GetRandom(1, 9);
        this.createCard();
        scene.add.existing(this);
    }
}
