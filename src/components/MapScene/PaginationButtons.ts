import Phaser from 'phaser';
import { themeManager } from '../../core/ThemeManager.js';

export interface PaginationButtonsResult {
    prevButton: Phaser.GameObjects.Text;
    nextButton: Phaser.GameObjects.Text;
    updatePaginationButtons: (currentPage: number, maxPage: number) => void;
}

/**
 * Tạo nút phân trang «/‹ và ›. Scene gắn pointerdown: prev -> nếu « thì MenuScene else previousPage(); next -> nextPage().
 */
export function createPaginationButtons(scene: Phaser.Scene, width: number, height: number): PaginationButtonsResult {
    const buttonY = height * 0.8;

    const prevButton = scene.add.text(width * 0.3, buttonY, '‹', {
        fontSize: '40px',
        color: themeManager.getText(),
        fontFamily: 'Arial',
        stroke: themeManager.getBackground(),
        strokeThickness: 2
    }).setOrigin(0.5);
    prevButton.setInteractive({ useHandCursor: true });

    const nextButton = scene.add.text(width * 0.7, buttonY, '›', {
        fontSize: '40px',
        color: themeManager.getText(),
        fontFamily: 'Arial',
        stroke: themeManager.getBackground(),
        strokeThickness: 2
    }).setOrigin(0.5);
    nextButton.setInteractive({ useHandCursor: true });

    [prevButton, nextButton].forEach(button => {
        button.on('pointerover', () => button.setStyle({ color: themeManager.getAccent() }));
        button.on('pointerout', () => button.setStyle({ color: themeManager.getText() }));
    });

    function updatePaginationButtons(currentPage: number, maxPage: number): void {
        if (currentPage > 0) {
            prevButton.setText('‹');
            prevButton.setStyle({ color: themeManager.getText() });
            prevButton.setInteractive();
        } else {
            prevButton.setText('«');
            prevButton.setInteractive();
        }
        if (currentPage < maxPage) {
            nextButton.setStyle({ color: themeManager.getText() });
            nextButton.setInteractive();
        } else {
            nextButton.setStyle({ color: themeManager.getNeutral() });
            nextButton.disableInteractive();
        }
    }

    return { prevButton, nextButton, updatePaginationButtons };
}
