import Treasure from '../../../modules/typeCard/treasure.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/card/Card.js';

export default class GoldMine extends Treasure {
    Reserves: number;
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('GoldMine') ?? { id: 'gold-mine', name: 'GoldMine', description: '', rarity: 2 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        this.durability = this.GetRandom(5, 10);
        this.Reserves = 5;// sau này lấy từ config    
    }

    override CardEffect(): boolean {
        this.Reserves--;
        if (this.Reserves <= 0) {
            this.scene.gameManager?.addCoin(this.durability);
            // Khi mỏ cạn: phá mỏ và thay thẻ mới theo Treasure.die (contents hoặc random).
            this.die();
            return true;
        }
        // Mỗi lần đào còn trữ lượng: cộng coin ngẫu nhiên.
        this.scene.gameManager?.addCoin(this.GetRandom(1, 10));
        return true;
    }
}
