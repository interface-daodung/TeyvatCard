import Enemy from '../../../modules/typeCard/enemy.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class Lawachurl extends Enemy {
    static DEFAULT = {
        id: 'lawachurl',
        name: 'Lawachurl',
        element: 'physical',
        type: 'enemy',
        description: 'Lawachurl - Kẻ địch mạnh.',
        clan: 'hilichurl',
        rarity: 5
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, Lawachurl.DEFAULT.name, Lawachurl.DEFAULT.id);
        (this as any).element = Lawachurl.DEFAULT.element;
        this.description = Lawachurl.DEFAULT.description;
        (this as any).rarity = Lawachurl.DEFAULT.rarity;
        this.health = this.GetRandom(3, 10);
        this.score = this.GetRandom(1, 9);
        this.createCard();
        scene.add.existing(this);
    }
}
