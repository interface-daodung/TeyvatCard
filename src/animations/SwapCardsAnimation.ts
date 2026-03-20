import type { AnimationManager } from './types.js';

const PRIORITY = 8; // Đặt độ ưu tiên cho SwapCardsAnimation, có thể điều chỉnh nếu cần thiết

export class SwapCardsAnimation {
    static run(
        manager: AnimationManager,
        from: number,
        to: number,
        onComplete?: () => void
    ): void {
        manager.addToQueue(PRIORITY, (completeCallback) => {
            const cardFrom = manager.scene.gameManager?.cardManager.getCard(from);
            const cardTo   = manager.scene.gameManager?.cardManager.getCard(to);

            if (!cardFrom || !cardTo || !manager.scene.gameManager) {
                onComplete?.();
                completeCallback();
                return;
            }

            // Đổi dữ liệu thẻ trước khi chạy hiệu ứng lật
            manager.scene.gameManager.cardManager.swapCard(from, to);

            // Bước 1: thu scaleX về 0 (mặt sau)
            manager.scene.tweens.add({
                targets: [cardFrom, cardTo],
                scaleX: 0,
                scaleY: 1.05,
                duration: 150,
                ease: 'Linear',
                onComplete: () => {
                    // Bước 2: mở scaleX về 1 (mặt trước mới)
                    manager.scene.tweens.add({
                        targets: [cardTo, cardFrom],
                        scaleX: 1,
                        scaleY: 1,
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

    static async runAsync(
        manager: AnimationManager,
        from: number,
        to: number
    ): Promise<void> {
        return manager.animationAsync(
            (cb) => SwapCardsAnimation.run(manager, from, to, cb)
        );
    }
}