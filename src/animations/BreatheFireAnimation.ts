import { soundManager } from '../core/SoundManager.js';
import type Card from '../modules/Card.js';
import type { AnimationManager } from './types.js';
import { animationBreatheFire } from './Sprites/animationBreatheFire.js';

const BREATHE_FIRE_DURATION_MS = 510;
const PRIORITY = 12;

export class BreatheFireAnimation {
    static run(
        manager: AnimationManager,
        damage: number,
        cardList: number[],
        onComplete?: () => void
    ): void {
        manager.addToQueue(PRIORITY, (completeCallback) => {
            if (!manager.scene?.gameManager || manager.scene.gameManager.isGameOver) {
                console.warn('BreatheFireAnimation: Game không còn tồn tại, bỏ qua animation');
                completeCallback();
                return;
            }
            soundManager.play('breathe-fire-sound');
            cardList.forEach(cardIndex => {
                const card = manager.scene.gameManager!.cardManager.getCard(cardIndex) as Card;
                if (card?.takeDamage) {
                    animationBreatheFire(manager.scene, card.x, card.y);
                }
            });

            // setTimeout(() => {
            //     onComplete?.();
            //     completeCallback();
            // }, BREATHE_FIRE_DURATION_MS);
            manager.scene.time.delayedCall(BREATHE_FIRE_DURATION_MS, () => {
                onComplete?.();
                completeCallback();
            });
        });
    }

    static async runAsync(
        manager: AnimationManager,
        damage: number,
        cardList: number[]
    ): Promise<void> {
        return manager.animationAsync(
            (cb) => BreatheFireAnimation.run(manager, damage, cardList, cb)
        );
    }
}

