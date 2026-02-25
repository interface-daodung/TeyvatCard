export interface LevelStat {
    level: number;
    price: number;
}

export interface CardCharacter {
    id: string;
    name: string;
    element: string;
    description: string;
    hp: number;
    level?: number;
    maxLevel?: number;
    levelStats?: LevelStat[];
    [key: string]: unknown;
}

export interface HighScores {
    [characterId: string]: number;
}
