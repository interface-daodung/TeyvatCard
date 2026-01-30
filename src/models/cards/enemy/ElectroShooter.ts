import Enemy from '../../../modules/typeCard/enemy.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class ElectroShooter extends Enemy {
    static DEFAULT = {
        id: 'electro-shooter',
        name: 'Electro Shooter',
        element: 'electro',
        type: 'enemy',
        description: 'Electro Shooter - Kẻ địch lôi bắn xa.',
        clan: 'hilichurl',
        rarity: 3
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, ElectroShooter.DEFAULT.name, ElectroShooter.DEFAULT.id );
        (this as any).element = ElectroShooter.DEFAULT.element;
        this.description = ElectroShooter.DEFAULT.description;
        (this as any).rarity = ElectroShooter.DEFAULT.rarity;
        this.health = this.GetRandom(3, 10);
        this.score = this.GetRandom(1, 9);
        this.createCard();
        scene.add.existing(this);
    }
}
