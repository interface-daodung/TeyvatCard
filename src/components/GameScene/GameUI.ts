import Phaser from 'phaser';
import { localizationManager } from '../../utils/LocalizationManager.js';
import { themeManager } from '../../core/ThemeManager.js';
import type { GameUIRefs } from './types.js';

export function createGameUI(
    scene: Phaser.Scene,
    width: number,
    height: number,
    dungeonStageName: string,
    highScore: number,
    coin: number,
    onMenuClick: () => void
): GameUIRefs {
    const menuButton = scene.add.text(width * 0.95, height * 0.05, '☰', {
        fontSize: '32px',
        color: themeManager.getText(),
        stroke: themeManager.getSurface(),
        strokeThickness: 2
    });
    menuButton.setInteractive({ useHandCursor: true });
    menuButton.setOrigin(0.5);
    menuButton.on('pointerover', () => {
        menuButton.setScale(1.1);
        menuButton.setTint(themeManager.getNeutralPhaser());
    });
    menuButton.on('pointerout', () => {
        menuButton.setScale(1);
        menuButton.clearTint();
    });
    menuButton.on('pointerdown', onMenuClick);

    const stageText = scene.add.text(width * 0.5, height * 0.035, dungeonStageName, {
        fontSize: '30px',
        color: themeManager.getAccent(),
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        stroke: themeManager.getNeutral(),
        strokeThickness: 2
    }).setOrigin(0.5);

    const highScoreText = scene.add.text(width * 0.5, height * 0.07, localizationManager.t('high_score_label', { score: highScore }), {
        fontSize: '20px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5).setAlpha(0.8);

    const coinText = scene.add.text(width * 0.75, height * 0.13, `🪙${coin}`, {
        fontSize: '32px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        strokeThickness: 2
    });

    return { stageText, highScoreText, coinText };
}
