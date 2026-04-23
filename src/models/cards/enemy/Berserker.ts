import Enemy from '../../../modules/typeCard/enemy.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class Berserker extends Enemy {
    private unsubLoseHealthPerTurn: (() => void) | undefined;

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('Berserker') ?? { id: 'berserker', name: 'Berserker', description: '', element: 'physical', clan: 'hilichurl', rarity: 4 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        // this.health = this.GetRandom(3, 10);
        // this.score = this.GetRandom(1, 9);
        this.createCard();
        scene.add.existing(this);

        this.unsubLoseHealthPerTurn = this.scene.gameManager?.emitter.on(
            'completeMove',
            this.loseHealthPerTurn.bind(this),
            8
        );
        if (this.unsubLoseHealthPerTurn) this.unsubscribeList.push(this.unsubLoseHealthPerTurn);
    }

    private loseHealthPerTurn(): void {
        this.takeDamage(1, 'damage');
    }
}
