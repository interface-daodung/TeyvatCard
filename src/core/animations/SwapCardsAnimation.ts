import Phaser from 'phaser';
import type { SceneWithGameManager } from '../AnimationManager.js';

export function runSwapCardsAnimation(scene: SceneWithGameManager, form: number, to: number): Promise<void> {
    const cardForm = scene.gameManager?.cardManager.getCard(form);
    const cardTo = scene.gameManager?.cardManager.getCard(to);
    const viewForm =
        cardForm && (cardForm as { view?: Phaser.GameObjects.GameObject }).view
            ? (cardForm as { view: Phaser.GameObjects.GameObject }).view
            : cardForm;
    const viewTo =
        cardTo && (cardTo as { view?: Phaser.GameObjects.GameObject }).view
            ? (cardTo as { view: Phaser.GameObjects.GameObject }).view
            : cardTo;

    if (!viewForm || !viewTo || !scene.gameManager) {
        return Promise.resolve();
    }

    scene.gameManager.cardManager.swapCard(form, to);

    return new Promise<void>((innerResolve) => {
        scene.tweens.add({
            targets: [viewForm, viewTo],
            scaleX: 0,
            scaleY: 1.05,
            duration: 150,
            ease: 'Linear',
            onComplete: () => {
                scene.tweens.add({
                    targets: [viewTo, viewForm],
                    scaleX: 1,
                    scaleY: 1,
                    duration: 150,
                    ease: 'Linear',
                    onComplete: () => {
                        innerResolve();
                    }
                });
            }
        });
    });
}

