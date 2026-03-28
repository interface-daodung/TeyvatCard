import type Card from '../Card.js';
import type { SceneWithGameManager } from '../Card.js';

export type CardFactoryCardConstructor = new (
    scene: SceneWithGameManager,
    x: number,
    y: number,
    index: number,
    ...args: any[]
) => Card;

export interface CardClassesMap {
    add: (classes: (typeof Card)[]) => void;
    [key: string]: ((classes: (typeof Card)[]) => void) | (new (...args: any[]) => Card) | undefined;
}

export interface StageCardPool {
    name: string;
    typeRatios: Record<string, number>;
    availableCards: Record<string, string[]>;
}

export interface DungeonItem {
    stageId: string;
    name: string;
    typeRatios: Record<string, number>;
    availableCards: Record<string, string[]>;
}

/** Entry trong flag `libraryCards` dùng khi đăng ký class (không trùng với `card/view.ts`). */
export interface LibraryCardsFactoryEntry {
    className?: string;
    element?: string;
}

export type LibraryCards = Record<string, LibraryCardsFactoryEntry[]>;

export type CardClassRegistry = Record<string, typeof Card>;
