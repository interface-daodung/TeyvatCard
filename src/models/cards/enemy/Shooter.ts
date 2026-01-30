import Enemy from '../../../modules/typeCard/enemy.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class Shooter extends Enemy {
    static DEFAULT = {
        id: 'shooter',
        name: 'Shooter',
        element: 'physical',
        type: 'enemy',
        description: 'Shooter - Kẻ địch bắn xa.',
        clan: 'hilichurl',
        rarity: 3
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, Shooter.DEFAULT.name, Shooter.DEFAULT.id, Shooter.DEFAULT.type);
        (this as any).element = Shooter.DEFAULT.element;
        this.description = Shooter.DEFAULT.description;
        (this as any).rarity = Shooter.DEFAULT.rarity;
        this.health = this.GetRandom(3, 10);
        this.score = this.GetRandom(1, 9);
        this.createCard();
        scene.add.existing(this);
    }
}
