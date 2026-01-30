import Enemy from '../../../modules/typeCard/enemy.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class HilistrayWater extends Enemy {
    static DEFAULT = {
        id: 'hilistray-water',
        name: 'Hilistray Water',
        element: 'hydro',
        type: 'enemy',
        description: 'Hilistray Water - Kẻ địch thủy.',
        clan: 'hilichurl',
        rarity: 3
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, HilistrayWater.DEFAULT.name, HilistrayWater.DEFAULT.id);
        (this as any).element = HilistrayWater.DEFAULT.element;
        this.description = HilistrayWater.DEFAULT.description;
        (this as any).rarity = HilistrayWater.DEFAULT.rarity;
        this.health = this.GetRandom(3, 10);
        this.score = this.GetRandom(1, 9);
        this.createCard();
        scene.add.existing(this);
    }
}
