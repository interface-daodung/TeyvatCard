// AnimationManager.ts
// Quản lý hàng đợi animation trong game

import Phaser from 'phaser';
import CalculatePositionCard from '../utils/CalculatePositionCard.js';
import Card from '../modules/card/Card.js';
import { SpritesheetWrapper } from '../utils/SpritesheetWrapper.js';

interface AnimationQueueItem {
    priority: number;
    function: () => Promise<void>;
}

interface MovementItem {
    from: number;
    to: number;
}

interface SceneWithGameManager extends Phaser.Scene {
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
     * Chạy tween di chuyển (không thêm queue). Dùng khi gom nhiều bước trong một queue item.
     */
    runMoveTweens(movementList: MovementItem | MovementItem[]): Promise<void> {
        const targets = Array.isArray(movementList) ? movementList : [movementList];
        if (targets.length === 0) return Promise.resolve();

        return new Promise<void>((innerResolve) => {
            let completed = 0;
            targets.forEach((movement) => {
                // Sau khi GameManager.apply state, card logic đã ở vị trí movement.to,
                // view vẫn ở vị trí cũ. Tween card tại index "to" tới tọa độ "to".
                const card = this.scene.gameManager?.cardManager.getCard(movement.to);
                const coordinates = this.scene.gameManager?.cardManager.getGridPositionCoordinates(movement.to);
                const view = card && (card as { view?: Phaser.GameObjects.GameObject }).view ? (card as { view: Phaser.GameObjects.GameObject }).view : card;

                if (!view || !coordinates) {
                    completed++;
                    if (completed >= targets.length) innerResolve();
                    return;
                }

                const originalDepth = (view as Phaser.GameObjects.GameObject & { depth?: number }).depth ?? 0;
                (view as Phaser.GameObjects.GameObject & { setDepth?: (d: number) => void }).setDepth?.(100);

                this.scene.tweens.add({
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

    /**
     * Thêm animation di chuyển vào queue. Trả về Promise khi hoàn thành (không dùng callback).
     */
    startMoveAnimation(movementList: MovementItem | MovementItem[]): Promise<void> {
        return new Promise((resolve) => {
            this.addToQueue(8, () => this.runMoveTweens(movementList).then(resolve));
        });
    }


    startGameOverAnimation(deck: Array<{ view?: { playDestroy: () => Promise<void> } }>): Promise<void> {
        return new Promise((resolve) => {
            this.addToQueue(10, () => {
                const runSequence = async (): Promise<void> => {
                    for (let i = 0; i < deck.length; i++) {
                        await new Promise<void>((r) => this.scene.time.delayedCall(200, r));
                        const card = deck[i];
                        if (card?.view?.playDestroy) await card.view.playDestroy();
                    }
                };
                return runSequence().then(resolve);
            });
        });
    }

    startSwapCardsAnimation(form: number, to: number): Promise<void> {
        return new Promise((resolve) => {
            this.addToQueue(8, () => {
                const cardForm = this.scene.gameManager?.cardManager.getCard(form);
                const cardTo = this.scene.gameManager?.cardManager.getCard(to);
                const viewForm = cardForm && (cardForm as { view?: Phaser.GameObjects.GameObject }).view ? (cardForm as { view: Phaser.GameObjects.GameObject }).view : cardForm;
                const viewTo = cardTo && (cardTo as { view?: Phaser.GameObjects.GameObject }).view ? (cardTo as { view: Phaser.GameObjects.GameObject }).view : cardTo;

                if (!viewForm || !viewTo || !this.scene.gameManager) {
                    resolve();
                    return Promise.resolve();
                }

                this.scene.gameManager.cardManager.swapCard(form, to);

                return new Promise<void>((innerResolve) => {
                    this.scene.tweens.add({
                        targets: [viewForm, viewTo],
                        scaleX: 0,
                        scaleY: 1.05,
                        duration: 150,
                        ease: 'Linear',
                        onComplete: () => {
                            this.scene.tweens.add({
                                targets: [viewTo, viewForm],
                                scaleX: 1,
                                scaleY: 1,
                                duration: 150,
                                ease: 'Linear',
                                onComplete: () => {
                                    resolve();
                                    innerResolve();
                                }
                            });
                        }
                    });
                });
            });
        });
    }

    /**
     * Bắt đầu animation shuffle toàn bộ thẻ. Trả về Promise khi hoàn thành.
     */
    startShuffleAllCardsAnimation(): Promise<void> {
        return new Promise((resolve) => {
            this.addToQueue(8, () => {
                if (!this.scene.gameManager) {
                    resolve();
                    return Promise.resolve();
                }

                const allCards = this.scene.gameManager.cardManager.getAllCards() as Array<{ view?: Phaser.GameObjects.GameObject; index?: number }>;
                const views = allCards.map((c) => c.view).filter(Boolean) as Phaser.GameObjects.GameObject[];

                return new Promise<void>((innerResolve) => {
                    this.scene.tweens.add({
                        targets: views,
                        scaleX: 0,
                        duration: 150,
                        ease: 'Linear',
                        onComplete: () => {
                            const shuffled = CalculatePositionCard.shuffleArray(allCards) as typeof allCards;
                            shuffled.forEach((card, index) => {
                                card.index = index;
                                const coords = this.scene.gameManager?.cardManager.getGridPositionCoordinates(index);
                                if (coords && card.view) (card.view as any).setPosition(coords.x, coords.y);
                            });
                            this.scene.gameManager!.cardManager.cards = shuffled;

                            this.scene.tweens.add({
                                targets: views,
                                scaleX: 1,
                                duration: 150,
                                ease: 'Linear',
                                onComplete: () => {
                                    resolve();
                                    innerResolve();
                                }
                            });
                        }
                    });
                });
            });
        });
    }

    /**
     * Animation thở lửa. Trả về Promise khi hoàn thành.
     */
    startBreatheFireAnimation(_damage: number, cardList: number[]): Promise<void> {
        return new Promise((resolve) => {
            this.addToQueue(12, () => {
                if (!this.scene?.gameManager || this.scene.gameManager.isGameOver) {
                    resolve();
                    return Promise.resolve();
                }
                cardList.forEach((cardIndex) => {
                    const card = this.scene.gameManager!.cardManager.getCard(cardIndex) as Card & { view?: { x: number; y: number } };
                    if (card?.view) {
                        SpritesheetWrapper.animationBreatheFire(this.scene, card.view.x, card.view.y);
                    }
                });
                return new Promise<void>((r) =>
                    this.scene.time.delayedCall(510, () => {
                        resolve();
                        r();
                    })
                );
            });
        });
    }

    startExplosiveAnimation(owner: Card, cardList: number[]): Promise<void> {
        return new Promise((resolve) => {
            this.addToQueue(9, () => {
                if (!this.scene?.gameManager || this.scene.gameManager.isGameOver) {
                    resolve();
                    return Promise.resolve();
                }
                if (!owner || owner.destroyed) {
                    resolve();
                    return Promise.resolve();
                }
                cardList.forEach((cardIndex) => {
                    const card = this.scene.gameManager!.cardManager.getCard(cardIndex) as Card & { view?: { x: number; y: number } };
                    if (card?.view) {
                        SpritesheetWrapper.animationBomb(this.scene, card.view.x, card.view.y);
                    }
                });
                return new Promise<void>((r) => {
                    this.scene.time.delayedCall(510, () => {
                        if (this.scene?.gameManager && !owner.destroyed) resolve();
                        r();
                    });
                });
            });
        });
    }

    /**
     * Animation hiệu ứng item. Trả về Promise khi hoàn thành.
     */
    startItemAnimation(itemImage: string): Promise<void> {
        return new Promise((resolve) => {
            this.addToQueue(7, () => {
                if (!this.scene.gameManager) {
                    resolve();
                    return Promise.resolve();
                }
                const coordinates = this.scene.gameManager.cardManager.getGridPositionCoordinates(4);
                if (!coordinates) {
                    resolve();
                    return Promise.resolve();
                }
                const item = this.scene.add.image(coordinates.x, coordinates.y, 'item', itemImage);
                item.setDepth(200);
                item.setScale(0);
                return new Promise<void>((innerResolve) => {
                    this.scene.tweens.add({
                        targets: item,
                        scale: 4.5,
                        alpha: 0.1,
                        duration: 300,
                        ease: 'Power2',
                        onComplete: () => {
                            item.destroy();
                            resolve();
                            innerResolve();
                        }
                    });
                });
            });
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
     */
    destroy(): void {
        console.log('AnimationManager: Đang dọn dẹp...');
        this.clearQueue();
        this.stopCurrentAnimation();
        this.scene = null as any;
    }
}
