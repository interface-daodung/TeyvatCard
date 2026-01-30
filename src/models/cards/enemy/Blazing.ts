import Enemy from '../../../modules/typeCard/enemy.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class Blazing extends Enemy {
    static DEFAULT = {
        id: 'blazing',
        name: 'Blazing',
        element: 'pyro',
        type: 'enemy',
        description: 'Blazing - Kẻ địch lửa.',
        clan: 'hilichurl',
        rarity: 3
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, Blazing.DEFAULT.name, Blazing.DEFAULT.id, Blazing.DEFAULT.type);
        (this as any).element = Blazing.DEFAULT.element;
        this.description = Blazing.DEFAULT.description;
        (this as any).rarity = Blazing.DEFAULT.rarity;
        this.health = this.GetRandom(3, 10);
        this.score = this.GetRandom(1, 9);
        this.createCard();
        scene.add.existing(this);
    }
}
