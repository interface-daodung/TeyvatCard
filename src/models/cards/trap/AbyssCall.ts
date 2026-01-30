import Trap from '../../../modules/typeCard/trap.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class AbyssCall extends Trap {
    static DEFAULT = {
        id: 'abyss-call',
        name: 'AbyssCall',
        type: 'trap',
        description: 'AbyssCall - Bẫy gọi thêm enemy vào trận đấu khi kích hoạt.'
    };

    declare enemyCount: number;
    declare enemyLevel: number;

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, AbyssCall.DEFAULT.name, AbyssCall.DEFAULT.id, AbyssCall.DEFAULT.type);
        (this as any).rarity = (AbyssCall.DEFAULT as any).rarity;
        this.description = AbyssCall.DEFAULT.description;
        this.enemyCount = this.GetRandom(1, 3);
        this.enemyLevel = this.GetRandom(1, 3);
        this.createCard();
        scene.add.existing(this);
    }
}
