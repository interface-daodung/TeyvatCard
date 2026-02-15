export interface CardCharacter {
    id: string;
    name: string;
    element: string;
    description: string;
    hp: number;
    level?: number;
    [key: string]: unknown;
}

export interface HighScores {
    [characterId: string]: number;
}
