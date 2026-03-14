import Phaser from 'phaser';
import { themeManager } from '../../core/ThemeManager.js';
import { I18nText } from '../shared/index.js';
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

    const stageText = I18nText.create(
        scene,
        width * 0.5,
        height * 0.035,
        dungeonStageName,
        {
            fontSize: '30px',
            color: themeManager.getAccent(),
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            stroke: themeManager.getNeutral(),
            strokeThickness: 2
        }).setOrigin(0.5);

    const highScoreText = I18nText.create(scene, width * 0.5, height * 0.07, 'high_score_label', {
        fontSize: '20px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif'
    }, { score: highScore }).setOrigin(0.5).setAlpha(0.8);

    const coinText = I18nText.create(scene, width * 0.75, height * 0.13, 'coin_amount', {
        fontSize: '32px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        strokeThickness: 2
    }, { amount: coin });

    return { stageText, highScoreText, coinText };
}
