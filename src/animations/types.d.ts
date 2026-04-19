import Phaser from 'phaser';

export interface SceneWithGameManager extends Phaser.Scene {
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

export interface AnimationManager {
    /** Scene Phaser hiện tại */
    readonly scene: SceneWithGameManager;

    /** Thêm animation vào queue với priority */
    addToQueue(
        priority: number,
        animationFunction: (completeCallback: () => void) => void
    ): void;

    /** Đánh dấu animation hiện tại đã xong, xử lý queue tiếp */
    completeAnimation(): void;

    /** Wrap một animation thành Promise để dùng async/await */
    animationAsync(
        runner: (callback: () => void) => void
    ): Promise<void>;
}

export interface MovementItem {
    from: number;
    to: number;
}

export interface AnimationQueueItem {
    priority: number;
    function: (completeCallback: () => void) => void;
}


