import Card from '../../modules/card/Card.js';
import { SpritesheetWrapper } from '../../utils/SpritesheetWrapper.js';
import type { SceneWithGameManager } from '../AnimationManager.js';

export function runBreatheFireAnimation(
    scene: SceneWithGameManager,
    _damage: number,
    cardList: number[]
): Promise<void> {
    if (!scene?.gameManager || scene.gameManager.isGameOver) {
        return Promise.resolve();
    }

    cardList.forEach((cardIndex) => {
        const card = scene.gameManager!.cardManager.getCard(cardIndex) as Card & { view?: { x: number; y: number } };
        if (card?.view) {
            SpritesheetWrapper.animationBreatheFire(scene, card.view.x, card.view.y);
        }
    });

    return new Promise<void>((r) => {
        scene.time.delayedCall(510, () => {
            r();
        });
    });
}

