import Enemy from '../../../modules/typeCard/enemy.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class CryoShooter extends Enemy {
    static DEFAULT = {
        id: 'cryo-shooter',
        name: 'Cryo Shooter',
        element: 'cryo',
        type: 'enemy',
        description: 'Cryo Shooter - Kẻ địch băng bắn xa.',
        clan: 'hilichurl',
        rarity: 3
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, CryoShooter.DEFAULT.name, CryoShooter.DEFAULT.id);
        (this as any).element = CryoShooter.DEFAULT.element;
        this.description = CryoShooter.DEFAULT.description;
        (this as any).rarity = CryoShooter.DEFAULT.rarity;
        this.health = this.GetRandom(3, 10);
        this.score = this.GetRandom(1, 9);
        this.createCard();
        scene.add.existing(this);
    }
}
