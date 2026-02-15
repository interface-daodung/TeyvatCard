import Phaser from 'phaser';

export interface LibraryCardData {
    type: string;
    id: string;
    name: string;
    description: string;
    cardType?: string;
    category?: string;
    clan?: string;
    element?: string;
    [key: string]: unknown;
}

export interface ContainerWithCardData extends Phaser.GameObjects.Container {
    cardIndex?: number;
    cardData?: LibraryCardData | null;
}
