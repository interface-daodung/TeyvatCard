import { ISceneWithGameManager } from './ISceneWithGameManager.js';

export interface IAnimationManager {
    addToQueue(priority: number, animationFunction: (completeCallback: () => void) => void): void;
    completeAnimation(): void;
    animationAsync(animationFn: (onComplete: () => void) => void): Promise<void>;
    scene: ISceneWithGameManager; // ← expose scene để sub-class dùng
}