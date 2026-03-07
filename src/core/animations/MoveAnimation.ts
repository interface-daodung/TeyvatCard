import Phaser from 'phaser';
import type { SceneWithGameManager, MovementItem } from '../AnimationManager.js';

/**
 * Chạy tween di chuyển (không thêm queue). Dùng khi gom nhiều bước trong một queue item.
 */
export function runMoveTweens(scene: SceneWithGameManager, movementList: MovementItem | MovementItem[]): Promise<void> {
    const targets = Array.isArray(movementList) ? movementList : [movementList];
    if (targets.length === 0) return Promise.resolve();

    return new Promise<void>((innerResolve) => {
        let completed = 0;
        targets.forEach((movement) => {
            // Sau khi GameManager.apply state, card logic đã ở vị trí movement.to,
            // view vẫn ở vị trí cũ. Tween card tại index "to" tới tọa độ "to".
            const card = scene.gameManager?.cardManager.getCard(movement.to);
            const coordinates = scene.gameManager?.cardManager.getGridPositionCoordinates(movement.to);
            const view =
                card && (card as { view?: Phaser.GameObjects.GameObject }).view
                    ? (card as { view: Phaser.GameObjects.GameObject }).view
                    : card;

            if (!view || !coordinates) {
                completed++;
                if (completed >= targets.length) innerResolve();
                return;
            }

            const originalDepth = (view as Phaser.GameObjects.GameObject & { depth?: number }).depth ?? 0;
            (view as Phaser.GameObjects.GameObject & { setDepth?: (d: number) => void }).setDepth?.(100);

            scene.tweens.add({
                targets: view,
                x: coordinates.x,
                y: coordinates.y,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    (view as Phaser.GameObjects.GameObject & { setDepth?: (d: number) => void }).setDepth?.(originalDepth);
                    completed++;
                    if (completed >= targets.length) innerResolve();
                }
            });
        });
    });
}

