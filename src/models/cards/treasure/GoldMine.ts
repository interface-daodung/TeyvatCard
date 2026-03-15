import Treasure from '../../../modules/typeCard/treasure.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class GoldMine extends Treasure {
    Reserves: number;
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('GoldMine') ?? { id: 'gold-mine', name: 'GoldMine', description: '', rarity: 2 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        this.durability = this.GetRandom(5, 10);
        this.Reserves = 5;// sau này lấy từ config    
        this.createCard();
        scene.add.existing(this);
    }

    CardEffect(): Promise<boolean> {
        this.Reserves--;
        if (this.Reserves <= 0) {
            this.scene.gameManager?.addCoin(this.durability);
            this.ProgressDestroy();
            return Promise.resolve(false);
        }
        // thêm hiệu ứng fade out  
        this.scene.gameManager?.addCoin(this.GetRandom(1, 10));
        return Promise.resolve(true); // vẫn còn vàng, nên trả về true để không emit 'completeMove';
    }
}
