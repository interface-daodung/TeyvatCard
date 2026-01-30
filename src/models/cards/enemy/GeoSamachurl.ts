import Enemy from '../../../modules/typeCard/enemy.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class GeoSamachurl extends Enemy {
    static DEFAULT = {
        id: 'geo-samachurl',
        name: 'Geo Samachurl',
        element: 'geo',
        type: 'enemy',
        description: 'Geo Samachurl - Kẻ địch caster nham.',
        clan: 'hilichurl',
        rarity: 3
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, GeoSamachurl.DEFAULT.name, GeoSamachurl.DEFAULT.id, GeoSamachurl.DEFAULT.type);
        (this as any).element = GeoSamachurl.DEFAULT.element;
        this.description = GeoSamachurl.DEFAULT.description;
        (this as any).rarity = GeoSamachurl.DEFAULT.rarity;
        this.health = this.GetRandom(3, 10);
        this.score = this.GetRandom(1, 9);
        this.createCard();
        scene.add.existing(this);
    }
}
