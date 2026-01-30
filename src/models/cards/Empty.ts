import Card from '../../modules/Card.js';
import type { SceneWithGameManager } from '../../modules/Card.js';

export default class Empty extends Card {
    static DEFAULT = {
        id: 'empty',
        name: 'Empty',
        type: 'empty',
        description: 'Empty - Thẻ trống không có tác dụng.'
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, Empty.DEFAULT.name, Empty.DEFAULT.id, Empty.DEFAULT.type);
        this.description = Empty.DEFAULT.description;
        this.createCard();
        scene.add.existing(this);
    }

    CardEffect(): boolean {
        super.CardEffect();
        return false;
    }
}
