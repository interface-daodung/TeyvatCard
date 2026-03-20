// AnimationManager.ts
// Core engine - chỉ quản lý hàng đợi, không chứa logic animation cụ thể
import type { AnimationQueueItem, SceneWithGameManager } from '../animations/types.js';

// ──────────────────────────────────────────────────────────────────────────────

export default class AnimationManager {
    readonly scene: SceneWithGameManager;

    private animationQueue: AnimationQueueItem[];
    /** Trạng thái đang chạy animation (public để GameManager/Card kiểm tra trước khi di chuyển) */
    public isProcessing: boolean;
    private currentAnimation: AnimationQueueItem | null;

    constructor(scene: SceneWithGameManager) {
        this.scene = scene;
        this.animationQueue = [];
        this.isProcessing = false;
        this.currentAnimation = null;
    }

    // ── Queue engine ────────────────────────────────────────────────────────────

    /**
     * Thêm animation function vào hàng đợi với priority.
     * Priority cao hơn → chạy trước.
     */
    addToQueue(
        priority: number,
        animationFunction: (completeCallback: () => void) => void
    ): void {
        this.animationQueue.push({ priority, function: animationFunction });

        if (!this.isProcessing) {
            this.processQueue();
        }
    }

    /** Xử lý hàng đợi – lấy phần tử có priority cao nhất */
    processQueue(): void {
        if (this.animationQueue.length === 0 || this.isProcessing) return;

        this.isProcessing = true;

        let maxIdx = 0;
        for (let i = 1; i < this.animationQueue.length; i++) {
            if (this.animationQueue[i].priority > this.animationQueue[maxIdx].priority) {
                maxIdx = i;
            }
        }

        const item = this.animationQueue.splice(maxIdx, 1)[0];
        this.currentAnimation = item;
        this.executeAnimation(item.function);
    }

    /** Thực thi một animation function */
    executeAnimation(
        animationFunction: (completeCallback: () => void) => void
    ): void {
        try {
            animationFunction(() => this.completeAnimation());
        } catch (error) {
            console.error('AnimationManager: Lỗi khi thực hiện animation:', error);
            this.completeAnimation();
        }
    }

    /** Đánh dấu animation hiện tại đã xong, kéo tiếp queue */
    completeAnimation(): void {
        this.currentAnimation = null;
        this.isProcessing = false;

        if (this.animationQueue.length > 0) {
            this.processQueue();
        }
    }

    /**
     * Wrap bất kỳ animation nào thành Promise.
     * Dùng cho các class con muốn hỗ trợ async/await.
     */
    animationAsync(runner: (callback: () => void) => void): Promise<void> {
        return new Promise<void>(resolve => runner(resolve));
    }

    // ── Utility ─────────────────────────────────────────────────────────────────

    clearQueue(): void {
        this.animationQueue = [];
    }

    stopCurrentAnimation(): void {
        if (this.currentAnimation) {
            this.scene.tweens.killAll();
        }
    }

    getStatus(): { queueLength: number; isProcessing: boolean; currentAnimation: string | null } {
        return {
            queueLength: this.animationQueue.length,
            isProcessing: this.isProcessing,
            currentAnimation: this.currentAnimation
                ? `priority: ${this.currentAnimation.priority}`
                : null
        };
    }

    destroy(): void {
        console.log('AnimationManager: Đang dọn dẹp...');
        this.clearQueue();
        this.stopCurrentAnimation();
        (this as any).scene = null;
    }
}