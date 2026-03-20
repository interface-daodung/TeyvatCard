import type { AnimationManager } from './types.js';

const PRIORITY = 7; // Đặt độ ưu tiên cho ItemAnimation, có thể điều chỉnh nếu cần thiết

export class ItemAnimation {
    static run(
        manager: AnimationManager,
        itemImage: string,
        onComplete?: () => void
    ): void {
        manager.addToQueue(PRIORITY, (completeCallback) => {
            if (!manager.scene.gameManager) {
                onComplete?.();
                completeCallback();
                return;
            }

            const coordinates = manager.scene.gameManager.cardManager
                .getGridPositionCoordinates(4);

            if (!coordinates) {
                onComplete?.();
                completeCallback();
                return;
            }

            const item = manager.scene.add.image(
                coordinates.x,
                coordinates.y,
                'item',
                itemImage
            );
            item.setDepth(200);
            item.setScale(0);

            manager.scene.tweens.add({
                targets: item,
                scale: 4.5,
                alpha: 0.1,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    item.destroy();
                    onComplete?.();
                    completeCallback();
                }
            });
        });
    }

    static async runAsync(
        manager: AnimationManager,
        itemImage: string
    ): Promise<void> {
        return manager.animationAsync(
            (cb) => ItemAnimation.run(manager, itemImage, cb)
        );
    }
}