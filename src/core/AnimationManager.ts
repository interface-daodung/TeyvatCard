import type {
    AnimationManager as IAnimationManager,
    AnimationQueueItem,
    SceneWithGameManager,
} from '../animations/types.js';
import TextureManager from './TextureManager.js';
import { Log } from '../utils/Log.js';

/** JSON atlas tối thiểu (chỉ cần `frames`) — khớp dữ liệu từ `AssetManager.loadAtlas`. */
export interface AtlasJsonWithFrames {
    frames: Record<string, unknown>;
}

/**
 * Queue animation theo priority; dùng bởi MoveAnimation, GameOverAnimation, v.v.
 */
export default class AnimationManager implements IAnimationManager {
    readonly scene: SceneWithGameManager;

    /** `true` khi đang chạy một animation trong queue (hoặc chờ callback hoàn tất). */
    isProcessing = false;

    private readonly queue: AnimationQueueItem[] = [];

    constructor(scene: SceneWithGameManager) {
        this.scene = scene;
    }

    addToQueue(
        priority: number,
        animationFunction: (completeCallback: () => void) => void,
    ): void {
        this.queue.push({ priority, function: animationFunction });
        this.queue.sort((a, b) => b.priority - a.priority);
        if (!this.isProcessing) {
            this.flushQueue();
        }
    }

    completeAnimation(): void {
        this.isProcessing = false;
        this.flushQueue();
    }

    animationAsync(runner: (callback: () => void) => void): Promise<void> {
        return new Promise((resolve) => {
            runner(() => resolve());
        });
    }

    private flushQueue(): void {
        if (this.isProcessing) return;
        const item = this.queue.shift();
        if (!item) return;

        this.isProcessing = true;
        item.function(() => {
            this.isProcessing = false;
            this.flushQueue();
        });
    }
}

/**
 * Đăng ký mặc định vào `TextureManager` khi queue load ảnh/spritesheet:
 * logical key = texture key Phaser (`key` truyền vào `load.image` / `load.spritesheet`).
 */
export function registerDefaultTextureBindingsForImageKey(textureKey: string): void {
    try {
        TextureManager.registerImageDefault(textureKey, textureKey);
    } catch (err) {
        Log.warn('[AnimationManager] registerDefaultTextureBindingsForImageKey:', textureKey, err);
    }
}

/**
 * Đăng ký mặc định mỗi frame trong atlas: logical key = tên frame (trùng giữa atlas → cảnh báo / throw qua TextureManager).
 */
export function registerDefaultTextureBindingsForAtlas(
    atlasKey: string,
    jsonData: AtlasJsonWithFrames,
): void {
    const frames = jsonData.frames;
    if (!frames || typeof frames !== 'object') return;

    for (const frameName of Object.keys(frames)) {
        try {
            TextureManager.registerAtlasDefault(frameName, atlasKey, frameName);
        } catch (err) {
            Log.warn(
                '[AnimationManager] registerDefaultTextureBindingsForAtlas:',
                atlasKey,
                frameName,
                err,
            );
        }
    }
}
