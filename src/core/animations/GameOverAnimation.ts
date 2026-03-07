import type { SceneWithGameManager } from '../AnimationManager.js';

export function runGameOverAnimation(
    scene: SceneWithGameManager,
    deck: Array<{ view?: { playDestroy: () => Promise<void> } }>
): Promise<void> {
    const runSequence = async (): Promise<void> => {
        for (let i = 0; i < deck.length; i++) {
            await new Promise<void>((r) => scene.time.delayedCall(200, r));
            const card = deck[i];
            if (card?.view?.playDestroy) {
                await card.view.playDestroy();
            }
        }
    };

    return runSequence();
}

