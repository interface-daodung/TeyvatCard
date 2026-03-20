import Phaser from 'phaser';
import type { AnimationManager } from './types.js';

const PRIORITY = 99; // Đặt độ ưu tiên cho GameOverAnimation, có thể điều chỉnh nếu cần thiết

export class GameOverAnimation {
    static run(
        manager: AnimationManager,
        deck: Phaser.GameObjects.Container[],
        onComplete?: () => void
    ): void {
        manager.addToQueue(PRIORITY, (completeCallback) => {
            let currentIndex = 0;
            const totalCards = deck.length;

            const timer = manager.scene.time.addEvent({
                delay: 200,
                callback: () => {
                    if (currentIndex >= totalCards) {
                        timer.destroy();
                        onComplete?.();
                        completeCallback();
                        return;
                    }

                    const card = deck[currentIndex];
                    if (card && (card as any).ProgressDestroy) {
                        (card as any).ProgressDestroy();
                    }
                    currentIndex++;
                },
                loop: true
            });
        });
    }

    static async runAsync(
        manager: AnimationManager,
        deck: Phaser.GameObjects.Container[]
    ): Promise<void> {
        return manager.animationAsync(
            (cb) => GameOverAnimation.run(manager, deck, cb)
        );
    }
}