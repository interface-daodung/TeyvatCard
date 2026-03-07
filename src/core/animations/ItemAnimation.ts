import type { SceneWithGameManager } from '../AnimationManager.js';

export function runItemAnimation(scene: SceneWithGameManager, itemImage: string): Promise<void> {
    if (!scene.gameManager) {
        return Promise.resolve();
    }
    const coordinates = scene.gameManager.cardManager.getGridPositionCoordinates(4);
    if (!coordinates) {
        return Promise.resolve();
    }

    const item = scene.add.image(coordinates.x, coordinates.y, 'item', itemImage);
    item.setDepth(200);
    item.setScale(0);

    return new Promise<void>((innerResolve) => {
        scene.tweens.add({
            targets: item,
            scale: 4.5,
            alpha: 0.1,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                item.destroy();
                innerResolve();
            }
        });
    });
}

