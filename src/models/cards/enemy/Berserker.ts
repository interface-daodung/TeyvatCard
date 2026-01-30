import Enemy from '../../../modules/typeCard/enemy.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class Berserker extends Enemy {
    static DEFAULT = {
        id: 'berserker',
        name: 'Berserker',
        element: 'physical',
        type: 'enemy',
        description: 'Berserker - Kẻ địch hung hãn tấn công mạnh.',
        clan: 'hilichurl',
        rarity: 4
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, Berserker.DEFAULT.name, Berserker.DEFAULT.id, Berserker.DEFAULT.type);
        (this as any).element = Berserker.DEFAULT.element;
        this.description = Berserker.DEFAULT.description;
        (this as any).rarity = Berserker.DEFAULT.rarity;
        this.health = this.GetRandom(3, 10);
        this.score = this.GetRandom(1, 9);
        this.createCard();
        scene.add.existing(this);
    }
}
