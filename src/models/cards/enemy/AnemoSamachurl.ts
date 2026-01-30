import Enemy from '../../../modules/typeCard/enemy.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class AnemoSamachurl extends Enemy {
    static DEFAULT = {
        id: 'anemo-samachurl',
        name: 'Anemo Samachurl',
        element: 'anemo',
        type: 'enemy',
        description: 'Anemo Samachurl - Kẻ địch caster gió có thể tạo gió và làm chậm người chơi.',
        clan: 'hilichurl',
        rarity: 3
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, AnemoSamachurl.DEFAULT.name, AnemoSamachurl.DEFAULT.id, AnemoSamachurl.DEFAULT.type);
        (this as any).element = AnemoSamachurl.DEFAULT.element;
        this.description = AnemoSamachurl.DEFAULT.description;
        (this as any).rarity = AnemoSamachurl.DEFAULT.rarity;
        this.health = this.GetRandom(3, 10);
        this.score = this.GetRandom(1, 9);
        this.createCard();
        scene.add.existing(this);
    }
}
