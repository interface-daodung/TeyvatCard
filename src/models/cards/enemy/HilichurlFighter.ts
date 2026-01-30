import Enemy from '../../../modules/typeCard/enemy.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class HilichurlFighter extends Enemy {
    static DEFAULT = {
        id: 'fighter',
        name: 'Hilichurl Fighter',
        element: 'physical',
        type: 'enemy',
        description: 'Hilichurl Fighter - Kẻ địch cơ bản có thể tấn công người chơi.',
        clan: 'hilichurl',
        rarity: 4
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, HilichurlFighter.DEFAULT.name, HilichurlFighter.DEFAULT.id);
        (this as any).element = HilichurlFighter.DEFAULT.element;
        this.description = HilichurlFighter.DEFAULT.description;
        (this as any).rarity = HilichurlFighter.DEFAULT.rarity;
        this.health = this.GetRandom(3, 10);
        this.score = this.GetRandom(1, 9);
        this.createCard();
        scene.add.existing(this);
    }
}
