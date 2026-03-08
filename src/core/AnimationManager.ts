// AnimationManager.ts
// Quản lý hàng đợi animation trong game

import Phaser from 'phaser';
import Card from '../modules/card/Card.js';
import { runMoveTweens } from './animations/MoveAnimation';
import { runGameOverAnimation } from './animations/GameOverAnimation';
import { runSwapCardsAnimation } from './animations/SwapCardsAnimation';
import { runShuffleAllCardsAnimation } from './animations/ShuffleAllCardsAnimation';
import { runBreatheFireAnimation } from './animations/BreatheFireAnimation';
import { runExplosiveAnimation } from './animations/ExplosiveAnimation';
import { runItemAnimation } from './animations/ItemAnimation';

interface AnimationQueueItem {
    priority: number;
    function: () => Promise<void>;
}

export interface MovementItem {
    from: number;
    to: number;
}

export interface SceneWithGameManager extends Phaser.Scene {
    gameManager?: {
        cardManager: {
            getCard: (index: number) => { view?: Phaser.GameObjects.GameObject } | null;
            getGridPositionCoordinates: (index: number) => { x: number; y: number } | null;
            swapCard: (fromIndex: number, toIndex: number) => boolean;
            getAllCards: () => unknown[];
            cards: unknown[];
        };
        isGameOver: boolean;
    };
    tweens: Phaser.Tweens.TweenManager;
    time: Phaser.Time.Clock;
    add: Phaser.GameObjects.GameObjectFactory;
}

export default class AnimationManager {
    private scene: SceneWithGameManager;
    private animationQueue: AnimationQueueItem[];
    /** Trạng thái đang chạy animation (public để GameManager/Card kiểm tra trước khi di chuyển) */
    public isProcessing: boolean;
    private currentAnimation: AnimationQueueItem | null;

    constructor(scene: SceneWithGameManager) {
        this.scene = scene;
        this.animationQueue = []; // Hàng đợi animation functions với priority
        this.isProcessing = false; // Trạng thái xử lý
        this.currentAnimation = null; // Animation đang chạy

        //console.log('AnimationManager: Đã khởi tạo với scene');
    }

    /**
     * Thêm animation function vào hàng đợi với priority. Hàm trả về Promise, không dùng callback.
     */
    addToQueue(priority: number, animationFunction: () => Promise<void>): void {
        this.animationQueue.push({
            priority: priority,
            function: animationFunction
        });
        if (!this.isProcessing) {
            this.processQueue();
        }
    }

    /**
     * Xử lý hàng đợi animation - tìm animation có priority cao nhất
     */
    processQueue(): void {
        if (this.animationQueue.length === 0 || this.isProcessing) {
            return;
        }

        this.isProcessing = true;

        // Tìm animation có priority cao nhất
        let maxPriorityIndex = 0;
        let maxPriority = this.animationQueue[0].priority;

        for (let i = 1; i < this.animationQueue.length; i++) {
            if (this.animationQueue[i].priority > maxPriority) {
                maxPriority = this.animationQueue[i].priority;
                maxPriorityIndex = i;
            }
        }

        // Lấy animation có priority cao nhất ra khỏi queue
        const animationItem = this.animationQueue.splice(maxPriorityIndex, 1)[0];
        this.currentAnimation = animationItem;

        //console.log(`AnimationManager: Bắt đầu xử lý animation function với priority ${animationItem.priority}`);

        // Thực hiện animation function
        this.executeAnimation(animationItem.function);
    }

    /**
     * Thực hiện animation function (trả về Promise).
     */
    executeAnimation(animationFunction: () => Promise<void>): void {
        animationFunction()
            .then(() => this.completeAnimation())
            .catch((error) => {
                console.error('AnimationManager: Lỗi khi thực hiện animation:', error);
                this.completeAnimation();
            });
    }

    /**
     * Hoàn thành animation và xử lý tiếp theo
     */
    completeAnimation(): void {
        // Chỉ set isProcessing = false sau khi animation hoàn thành
        this.currentAnimation = null;
        this.isProcessing = false;

        // Xử lý animation tiếp theo trong hàng đợi
        if (this.animationQueue.length > 0) {
            this.processQueue();
        } else {
            //console.log('AnimationManager: Hàng đợi animation đã trống');
        }
    }

    /**
     * Chạy tween di chuyển trực tiếp, không qua queue.
     * Chủ yếu dùng nội bộ trong các queue item phức tạp.
     */
    runMoveTweens(movementList: MovementItem | MovementItem[]): Promise<void> {
        return runMoveTweens(this.scene, movementList);
    }

    /**
     * Thêm animation di chuyển vào queue. Trả về Promise khi hoàn thành (không dùng callback).
     */
    startMoveAnimation(movementList: MovementItem | MovementItem[]): Promise<void> {
        return new Promise((resolve) => {
            this.addToQueue(8, () => runMoveTweens(this.scene, movementList).then(resolve));
        });
    }


    startGameOverAnimation(deck: Array<{ view?: { playDestroy: () => Promise<void> } }>): Promise<void> {
        return new Promise((resolve) => {
            this.addToQueue(10, () => runGameOverAnimation(this.scene, deck).then(resolve));
        });
    }

    startSwapCardsAnimation(form: number, to: number): Promise<void> {
        return new Promise((resolve) => {
            this.addToQueue(8, () => runSwapCardsAnimation(this.scene, form, to).then(resolve));
        });
    }

    /**
     * Bắt đầu animation shuffle toàn bộ thẻ. Trả về Promise khi hoàn thành.
     */
    startShuffleAllCardsAnimation(): Promise<void> {
        return new Promise((resolve) => {
            this.addToQueue(8, () => runShuffleAllCardsAnimation(this.scene).then(resolve));
        });
    }

    /**
     * Animation thở lửa. Trả về Promise khi hoàn thành.
     */
    startBreatheFireAnimation(_damage: number, cardList: number[]): Promise<void> {
        return new Promise((resolve) => {
            this.addToQueue(12, () => runBreatheFireAnimation(this.scene, _damage, cardList).then(resolve));
        });
    }

    // startExplosiveAnimation(owner: Card, cardList: number[]): Promise<void> {
    //     return new Promise((resolve) => {
    //         this.addToQueue(9, () => runExplosiveAnimation(this.scene, owner, cardList, resolve));
    //     });
    // }

    startExplosiveAnimation(owner: Card, cardList: number[]): Promise<void> {
        return new Promise((resolve) => {
            this.addToQueue(9, () => runExplosiveAnimation(this.scene, owner, cardList).then(resolve));
        });
    }

    /**
     * Animation hiệu ứng item. Trả về Promise khi hoàn thành.
     */
    startItemAnimation(itemImage: string): Promise<void> {
        return new Promise((resolve) => {
            this.addToQueue(7, () => runItemAnimation(this.scene, itemImage).then(resolve));
        });
    }


    //hàm có đang chưa dc dùng 
    /**
     * Xóa tất cả animation trong hàng đợi
     */
    clearQueue(): void {
        this.animationQueue = [];
        //console.log('AnimationManager: Đã xóa tất cả animation trong hàng đợi');
    }

    /**
     * Dừng animation hiện tại
     */
    stopCurrentAnimation(): void {
        if (this.currentAnimation) {
            // Không thể dừng trực tiếp function, nhưng có thể dừng tweens đang chạy
            this.scene.tweens.killAll();
            //console.log('AnimationManager: Đã dừng tất cả tweens');
        }
    }

    /**
     * Lấy thông tin trạng thái
     * @returns Thông tin trạng thái
     */
    getStatus(): { queueLength: number; isProcessing: boolean; currentAnimation: string | null } {
        return {
            queueLength: this.animationQueue.length,
            isProcessing: this.isProcessing,
            currentAnimation: this.currentAnimation ? `priority: ${this.currentAnimation.priority}` : null
        };
    }

    /**
     * Dọn dẹp tài nguyên
     * hàm này ko nên dùng 
     */
    destroy(): void {
        console.log('AnimationManager: Đang dọn dẹp...');
        this.clearQueue();
        this.stopCurrentAnimation();
        this.scene = null as any;
    }
}
