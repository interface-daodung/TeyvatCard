import Enemy from '../../../modules/typeCard/enemy.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class ElectroSamachurl extends Enemy {
    static DEFAULT = {
        id: 'electro-samachurl',
        name: 'Electro Samachurl',
        element: 'electro',
        type: 'enemy',
        description: 'Electro Samachurl - Kẻ địch caster lôi.',
        clan: 'hilichurl',
        rarity: 3
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, ElectroSamachurl.DEFAULT.name, ElectroSamachurl.DEFAULT.id, ElectroSamachurl.DEFAULT.type);
        (this as any).element = ElectroSamachurl.DEFAULT.element;
        this.description = ElectroSamachurl.DEFAULT.description;
        (this as any).rarity = ElectroSamachurl.DEFAULT.rarity;
        this.health = this.GetRandom(3, 10);
        this.score = this.GetRandom(1, 9);
        this.createCard();
        scene.add.existing(this);
    }
}
