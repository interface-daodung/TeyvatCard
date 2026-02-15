import type Phaser from 'phaser';

export interface DungeonData {
    name: string;
    stageId: string;
    [key: string]: unknown;
}

export interface ButtonWithDungeonData extends Phaser.GameObjects.Rectangle {
    dungeonData?: DungeonData | null;
}
