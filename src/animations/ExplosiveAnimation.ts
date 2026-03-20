// animations/ExplosiveAnimation.ts

import { soundManager } from '../core/SoundManager.js';
import type Card from '../modules/Card.js';
import { animationBomb } from './Sprites/animationBomb.js';
import type { AnimationManager } from './types.js';

const EXPLOSIVE_DURATION_MS = 510;
const PRIORITY = 9; // Đặt độ ưu tiên cho ExplosiveAnimation, có thể điều chỉnh nếu cần thiết

export class ExplosiveAnimation {
    static run(
        manager: AnimationManager,
        owner: Card,
        cardList: number[],
        onComplete?: () => void
    ): void {
        manager.addToQueue(PRIORITY, (completeCallback) => {
            if (!manager.scene?.gameManager || manager.scene.gameManager.isGameOver) {
                console.warn('ExplosiveAnimation: Game không còn tồn tại, bỏ qua animation');
                completeCallback();
                return;
            }
            soundManager.play('bomb-sound');
            if (!owner || owner.destroyed) {
                completeCallback();
                return;
            }

            cardList.forEach(cardIndex => {
                const card = manager.scene.gameManager!.cardManager.getCard(cardIndex) as Card;
                if (card?.takeDamage) {
                    animationBomb(manager.scene, card.x, card.y);
                }
            });

            // setTimeout(() => {
            //     // Kiểm tra lại trước khi gọi callback phòng trường hợp owner bị destroy giữa chừng
            //     if (manager.scene?.gameManager && !owner.destroyed) {
            //         onComplete?.();
            //     }
            //     completeCallback();
            // }, EXPLOSIVE_DURATION_MS);
            manager.scene.time.delayedCall(EXPLOSIVE_DURATION_MS, () => {
                if (manager.scene?.gameManager && !owner.destroyed) {
                    onComplete?.();
                }
                completeCallback();
            });
        });
    }

    static async runAsync(
        manager: AnimationManager,
        owner: Card,
        cardList: number[]
    ): Promise<void> {
        return manager.animationAsync(
            (cb) => ExplosiveAnimation.run(manager, owner, cardList, cb)
        );
    }
}