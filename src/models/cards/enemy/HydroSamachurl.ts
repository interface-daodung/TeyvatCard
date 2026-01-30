import Enemy from '../../../modules/typeCard/enemy.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class HydroSamachurl extends Enemy {
    static DEFAULT = {
        id: 'hydro-samachurl',
        name: 'Hydro Samachurl',
        element: 'hydro',
        type: 'enemy',
        description: 'Hydro Samachurl - Kẻ địch caster thủy.',
        clan: 'hilichurl',
        rarity: 3
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, HydroSamachurl.DEFAULT.name, HydroSamachurl.DEFAULT.id, HydroSamachurl.DEFAULT.type);
        (this as any).element = HydroSamachurl.DEFAULT.element;
        this.description = HydroSamachurl.DEFAULT.description;
        (this as any).rarity = HydroSamachurl.DEFAULT.rarity;
        this.health = this.GetRandom(3, 10);
        this.score = this.GetRandom(1, 9);
        this.createCard();
        scene.add.existing(this);
    }
}
