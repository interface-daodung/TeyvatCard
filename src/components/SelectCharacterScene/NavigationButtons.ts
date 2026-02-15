import Phaser from 'phaser';
import { themeManager } from '../../core/ThemeManager.js';

export interface NavigationButtonsRefs {
    prevButton: Phaser.GameObjects.Text;
    nextButton: Phaser.GameObjects.Text;
}

export function createNavigationButtons(
    scene: Phaser.Scene,
    width: number,
    height: number,
    onPrev: () => void,
    onNext: () => void
): NavigationButtonsRefs {
    const prevButton = scene.add.text(width * 0.2, height * 0.65, '◀', {
        fontSize: '28px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        padding: { x: 20, y: 15 }
    }).setOrigin(0.5);
    prevButton.setInteractive({ useHandCursor: true });
    prevButton.on('pointerdown', onPrev);

    const nextButton = scene.add.text(width * 0.8, height * 0.65, '▶', {
        fontSize: '28px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        padding: { x: 20, y: 15 }
    }).setOrigin(0.5);
    nextButton.setInteractive({ useHandCursor: true });
    nextButton.on('pointerover', () => nextButton.setScale(1.1));
    nextButton.on('pointerout', () => nextButton.setScale(1));
    nextButton.on('pointerdown', onNext);

    return { prevButton, nextButton };
}
