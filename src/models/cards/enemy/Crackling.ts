import Enemy from '../../../modules/typeCard/enemy.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class Crackling extends Enemy {
    static DEFAULT = {
        id: 'crackling',
        name: 'Crackling',
        element: 'electro',
        type: 'enemy',
        description: 'Crackling - Kẻ địch điện.',
        clan: 'hilichurl',
        rarity: 3
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, Crackling.DEFAULT.name, Crackling.DEFAULT.id, Crackling.DEFAULT.type);
        (this as any).element = Crackling.DEFAULT.element;
        this.description = Crackling.DEFAULT.description;
        (this as any).rarity = Crackling.DEFAULT.rarity;
        this.health = this.GetRandom(3, 10);
        this.score = this.GetRandom(1, 9);
        this.createCard();
        scene.add.existing(this);
    }
}
