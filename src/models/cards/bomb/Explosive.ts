import Bomb from '../../../modules/typeCard/bomb.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import CalculatePositionCard from '../../../utils/CalculatePositionCard.js';
import { soundManager } from '../../../core/SoundManager.js';
import Card from '../../../modules/Card.js';
import { ExplosiveAnimation } from '@/src/animations/ExplosiveAnimation.js';

export default class Explosive extends Bomb {
    declare rarity: number;

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('Explosive') ?? (() => {
            console.error('Missing card config: Explosive, using fallback');

            return {
                id: 'explosive',
                name: 'fallback Explosive',
                description: 'fallback description',
                rarity: 5
            };
        })();
        // this.damage 
        // this.countdown  
        super(scene, x, y, index, config.name!, config.id!);

        this.applyConfig(config);

        const unsub = this.scene.gameManager?.emitter.on(
            'completeMove',
            this.BombCountdownEffect.bind(this),
            4
        );
        if (unsub) this.unsubscribeList.push(unsub);

        this.createCard();
        scene.add.existing(this);
    }

    BombCountdownEffect(): void {
        this.countdown--;
        console.log(`Bomb at index ${this.index} countdown: ${this.countdown}`);
        this.countdownDisplay.updateText(this.countdown.toString());
        if (this.countdown <= 0) {
            this.Detonation();
        }
    }

    async Detonation(): Promise<void> {

        const adjacentPositions = CalculatePositionCard.getAdjacentPositions(this.index);

        await ExplosiveAnimation.runAsync(this.scene.gameManager!.animationManager, this, adjacentPositions);

        if (this.destroyed) {
            console.warn('Explosive already destroyed, skipping damage application');
            return;
        }

        adjacentPositions.forEach(cardIndex => {
            const card = this.scene.gameManager.cardManager.getCard(cardIndex) as Card;
            if (card?.takeDamage) {
                card.takeDamage(this.damage, 'damage');
            }
        });

        this.die();

        // this.scene.gameManager?.animationManager.startExplosiveAnimation(
        //     this,
        //     adjacentPositions,
        //     () => {
        //         if (this.destroyed) return;

        //         soundManager.play('bomb-sound');

        //         adjacentPositions.forEach(cardIndex => {
        //             const card = this.scene.gameManager.cardManager.getCard(cardIndex) as Card;
        //             if (card?.takeDamage) {
        //                 card.takeDamage(this.damage, 'damage');
        //             }
        //         });

        //         this.die();
        //     }
        // );

    }
}
