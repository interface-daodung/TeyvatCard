import CalculatePositionCard from '../utils/CalculatePositionCard.js';
import type { AnimationManager } from './types.js';

const PRIORITY = 8; // Đặt độ ưu tiên cho ShuffleAllCardsAnimation, có thể điều chỉnh nếu cần thiết

export class ShuffleAllCardsAnimation {
    static run(
        manager: AnimationManager,
        onComplete?: () => void
    ): void {
        manager.addToQueue(PRIORITY, (completeCallback) => {
            if (!manager.scene.gameManager) {
                onComplete?.();
                completeCallback();
                return;
            }

            const allCards = manager.scene.gameManager.cardManager.getAllCards();

            // Bước 1: thu scaleX về 0 để ẩn mặt thẻ
            manager.scene.tweens.add({
                targets: allCards,
                scaleX: 0,
                duration: 150,
                ease: 'Linear',
                onComplete: () => {
                    // Bước 2: xáo trộn vị trí trong data + scene
                    const shuffled = CalculatePositionCard.shuffleArray(allCards);

                    shuffled.forEach((card, index) => {
                        const newCoords = manager.scene.gameManager?.cardManager
                            .getGridPositionCoordinates(index);
                        if (newCoords) {
                            card.setPosition(newCoords.x, newCoords.y);
                            (card as any).index = index;
                        }
                    });

                    allCards.sort(
                        (a, b) => ((a as any).index || 0) - ((b as any).index || 0)
                    );
                    (manager.scene.gameManager!.cardManager as any).cards = allCards;

                    // Bước 3: mở scaleX về 1 để hiển thị vị trí mới
                    manager.scene.tweens.add({
                        targets: allCards,
                        scaleX: 1,
                        duration: 150,
                        ease: 'Linear',
                        onComplete: () => {
                            onComplete?.();
                            completeCallback();
                        }
                    });
                }
            });
        });
    }

    static async runAsync(manager: AnimationManager): Promise<void> {
        return manager.animationAsync(
            (cb) => ShuffleAllCardsAnimation.run(manager, cb)
        );
    }
}