import Card from '../../modules/Card.js';
import { getCardConfig } from '../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../modules/Card.js';

export default class Empty extends Card {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('Empty') ?? { id: 'coin', name: 'Empty', description: '' };
        super(scene, x, y, index, config.name!, config.id!, 'empty');
        this.applyConfig(config);
        this.type = 'coin';
        this.createCard();
        scene.add.existing(this);
    }

    CardEffect(): Promise<boolean> {
        super.CardEffect();
        return Promise.resolve(false); // Empty không có hiệu ứng gì, nên trả về false để không emit 'completeMove';
    }
}
