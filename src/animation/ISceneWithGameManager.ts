import Phaser from 'phaser';

export interface ISceneWithGameManager extends Phaser.Scene {
    gameManager?: {
        cardManager: {
            getCard: (index: number) => Phaser.GameObjects.GameObject | null;
            getGridPositionCoordinates: (index: number) => { x: number; y: number } | null;
            swapCard: (fromIndex: number, toIndex: number) => boolean;
            getAllCards: () => Phaser.GameObjects.GameObject[];
        },
        isGameOver: boolean;
    };
    tweens: Phaser.Tweens.TweenManager;
    time: Phaser.Time.Clock;
    add: Phaser.GameObjects.GameObjectFactory;
}