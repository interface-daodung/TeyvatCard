import Phaser from 'phaser';
import CalculatePositionCard from '../../utils/CalculatePositionCard.js';
import type { SceneWithGameManager } from '../AnimationManager.js';

export function runShuffleAllCardsAnimation(scene: SceneWithGameManager): Promise<void> {
    if (!scene.gameManager) {
        return Promise.resolve();
    }

    const allCards = scene.gameManager.cardManager.getAllCards() as Array<{ view?: Phaser.GameObjects.GameObject; index?: number }>;
    const views = allCards.map((c) => c.view).filter(Boolean) as Phaser.GameObjects.GameObject[];

    return new Promise<void>((innerResolve) => {
        scene.tweens.add({
            targets: views,
            scaleX: 0,
            duration: 150,
            ease: 'Linear',
            onComplete: () => {
                const shuffled = CalculatePositionCard.shuffleArray(allCards) as typeof allCards;
                shuffled.forEach((card, index) => {
                    card.index = index;
                    const coords = scene.gameManager?.cardManager.getGridPositionCoordinates(index);
                    if (coords && card.view) (card.view as any).setPosition(coords.x, coords.y);
                });
                scene.gameManager!.cardManager.cards = shuffled;

                scene.tweens.add({
                    targets: views,
                    scaleX: 1,
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

