import Card from '../../modules/card/Card.js';
import { SpritesheetWrapper } from '../../utils/SpritesheetWrapper.js';
import type { SceneWithGameManager } from '../AnimationManager.js';

export function runExplosiveAnimation(
    scene: SceneWithGameManager,
    owner: Card,
    cardList: number[],
    resolveOuter: () => void
): Promise<void> {
    if (!scene?.gameManager || scene.gameManager.isGameOver) {
        resolveOuter();
        return Promise.resolve();
    }
    if (!owner || owner.destroyed) {
        resolveOuter();
        return Promise.resolve();
    }

    cardList.forEach((cardIndex) => {
        const card = scene.gameManager!.cardManager.getCard(cardIndex) as Card & { view?: { x: number; y: number } };
        if (card?.view) {
            SpritesheetWrapper.animationBomb(scene, card.view.x, card.view.y);
        }
    });

    return new Promise<void>((r) => {
        scene.time.delayedCall(510, () => {
            if (scene?.gameManager && !owner.destroyed) resolveOuter();
            r();
        });
    });
}

