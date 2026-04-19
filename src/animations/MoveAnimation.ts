import type { MovementItem, AnimationManager } from './types.js';

const PRIORITY = 6; // Đặt độ ưu tiên cho MoveAnimation, có thể điều chỉnh nếu cần thiết

export class MoveAnimation {
    static run(
        manager: AnimationManager,
        movementList: MovementItem | MovementItem[],
        onComplete?: () => void
    ): void {
        manager.addToQueue(PRIORITY, (completeCallback) => {
            const targets = Array.isArray(movementList) ? movementList : [movementList];

            let completedAnimations = 0;
            const totalAnimations = targets.length;

            targets.forEach(movement => {
                const card = manager.scene.gameManager?.cardManager.getCard(movement.from);
                const coordinates = manager.scene.gameManager?.cardManager.getGridPositionCoordinates(movement.to);

                if (!card || !coordinates) {
                    completedAnimations++;
                    if (completedAnimations >= totalAnimations) {
                        onComplete?.();
                        completeCallback();
                    }
                    return;
                }

                const originalDepth = (card as any).depth || 0;
                (card as any).setDepth(100);

                manager.scene.tweens.add({
                    targets: card,
                    x: coordinates.x,
                    y: coordinates.y,
                    duration: 500,
                    ease: 'Power2',
                    onComplete: () => {
                        (card as any).setDepth(originalDepth);
                        completedAnimations++;

                        if (completedAnimations >= totalAnimations) {
                            onComplete?.();
                            completeCallback();
                        }
                    }
                });
            });
        });
    }

    static async runAsync(
        manager: AnimationManager,
        movementList: MovementItem | MovementItem[]
    ): Promise<void> {
        return manager.animationAsync(
            (cb) => MoveAnimation.run(manager, movementList, cb)
        );
    }
}