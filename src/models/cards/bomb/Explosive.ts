import Bomb from '../../../modules/typeCard/bomb.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import CalculatePositionCard from '../../../utils/CalculatePositionCard.js';

export default class Explosive extends Bomb {
    declare rarity: number;

    static DEFAULT = {
        id: 'explosive',
        name: 'Explosive',
        type: 'bomb',
        description: 'Explosive - Bom nổ gây damage cho tất cả trong bán kính.',
        rarity: 3
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, Explosive.DEFAULT.name, Explosive.DEFAULT.id);
        this.rarity = Explosive.DEFAULT.rarity;
        this.description = Explosive.DEFAULT.description;
        this.damage = this.GetRandom(1, 3);
        this.countdown = 5;

        const unsub = this.scene.gameManager?.emitter.on(
            'completeMove',
            this.BombCountdownEffect.bind(this),
            5
        );
        if (unsub) this.unsubscribeList.push(unsub);

        this.createCard();
        scene.add.existing(this);
    }

    BombCountdownEffect(): void {
        this.countdown--;
        this.countdownDisplay.updateText(this.countdown.toString());
        if (this.countdown <= 0) {
            this.Detonation();
        }
    }

    Detonation(): void {
        this.scene.sound.play('bomb-sound');
        const adjacentPositions = CalculatePositionCard.getAdjacentPositions(this.index);
        this.scene.gameManager?.animationManager.startExplosiveAnimation(
            this.damage,
            adjacentPositions,
            () => this.die()
        );
    }
}
