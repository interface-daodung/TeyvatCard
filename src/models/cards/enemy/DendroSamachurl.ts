import Enemy from '../../../modules/typeCard/enemy.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class DendroSamachurl extends Enemy {
    static DEFAULT = {
        id: 'dendro-samachurl',
        name: 'Dendro Samachurl',
        element: 'dendro',
        type: 'enemy',
        description: 'Dendro Samachurl - Kẻ địch caster thảo.',
        clan: 'hilichurl',
        rarity: 3
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, DendroSamachurl.DEFAULT.name, DendroSamachurl.DEFAULT.id);
        (this as any).element = DendroSamachurl.DEFAULT.element;
        this.description = DendroSamachurl.DEFAULT.description;
        (this as any).rarity = DendroSamachurl.DEFAULT.rarity;
        this.health = this.GetRandom(3, 10);
        this.score = this.GetRandom(1, 9);
        this.createCard();
        scene.add.existing(this);
    }
}
