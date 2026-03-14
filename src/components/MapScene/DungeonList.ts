import Phaser from 'phaser';
import { themeManager } from '../../core/ThemeManager.js';
import type { ButtonWithDungeonData } from './types.js';

export interface DungeonListResult {
    dungeonContainer: Phaser.GameObjects.Container;
    dungeonButtons: Phaser.GameObjects.Container[];
    updateDungeonButton: (buttonContainer: Phaser.GameObjects.Container, newName: string, newStageId: string) => void;
}

/**
 * Tạo container và 5 nút dungeon (ẩn ban đầu). Click nút gọi onDungeonClick(stageId, name).
 */
export function createDungeonButtons(
    scene: Phaser.Scene,
    width: number,
    height: number,
    itemsPerPage: number,
    onDungeonClick: (stageId: string, name: string) => void
): DungeonListResult {
    const dungeonContainer = scene.add.container(width / 2, height * 0.5);
    const buttonWidth = width * 0.7;
    const buttonHeight = height * 0.08;
    const buttonSpacing = 20;
    const dungeonButtons: Phaser.GameObjects.Container[] = [];

    for (let i = 0; i < itemsPerPage; i++) {
        const buttonY = (i - 2) * (buttonHeight + buttonSpacing);
        const button = scene.add.rectangle(0, buttonY, buttonWidth, buttonHeight, themeManager.getPrimaryPhaser()) as ButtonWithDungeonData;
        button.setAlpha(0.5);
        button.setStrokeStyle(3, themeManager.getSecondaryPhaser());
        button.setInteractive();
        button.dungeonData = null;

        const text = scene.add.text(0, buttonY, '', {
            fontSize: '32px',
            color: themeManager.getText(),
            fontFamily: 'Arial',
            stroke: themeManager.getBackground(),
            strokeThickness: 2
        }).setOrigin(0.5);

        button.on('pointerover', () => {
            button.setFillStyle(themeManager.getPrimaryPhaser());
            button.setStrokeStyle(3, themeManager.getTextPhaser());
        });
        button.on('pointerout', () => {
            button.setFillStyle(themeManager.getPrimaryPhaser());
            button.setStrokeStyle(3, themeManager.getSecondaryPhaser());
        });
        button.on('pointerdown', () => {
            if (button.dungeonData) {
                onDungeonClick(button.dungeonData.stageId, button.dungeonData.name);
            }
        });

        const buttonContainer = scene.add.container(0, 0);
        buttonContainer.add([button, text]);
        buttonContainer.setVisible(false);
        dungeonButtons.push(buttonContainer);
        dungeonContainer.add(buttonContainer);
    }

    function updateDungeonButton(buttonContainer: Phaser.GameObjects.Container, newName: string, newStageId: string): void {
        const text = buttonContainer.getAt(1) as Phaser.GameObjects.Text | undefined;
        if (!text) {
            return;
        }

        text.setText(newName);
        const btn = buttonContainer.getAt(0) as ButtonWithDungeonData;
        btn.dungeonData = { name: newName, stageId: newStageId };
    }

    return { dungeonContainer, dungeonButtons, updateDungeonButton };
}
