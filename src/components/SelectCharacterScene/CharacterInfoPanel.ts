import Phaser from 'phaser';
import { themeManager } from '../../core/ThemeManager.js';
import { I18nText } from '../shared/index.js';

export interface CharacterInfoPanelRefs {
    cardNameText: Phaser.GameObjects.Text;
    cardHighScoreText: Phaser.GameObjects.Text;
    cardLevelText: Phaser.GameObjects.Text;
    cardElementImage: Phaser.GameObjects.Image;
    cardDescriptionText: Phaser.GameObjects.Text;
    cardHPText: I18nText & { hp: number };
    upgradeButton: Phaser.GameObjects.Text;
}

export interface CharacterInfoPanelCallbacks {
    onUpgradeClick: () => void;
    onUpgradeHover: () => void;
    onUpgradeOut: () => void;
}

export function createInfoPanel(
    scene: Phaser.Scene,
    width: number,
    height: number,
    callbacks: CharacterInfoPanelCallbacks
): CharacterInfoPanelRefs {
    const panelBg = scene.add.graphics();
    panelBg.fillStyle(themeManager.getSecondaryPhaser(), 0.8);
    panelBg.fillRoundedRect(width * 0.1, height * 0.15, width * 0.8, height * 0.25, 20);
    panelBg.lineStyle(3, themeManager.getSurfacePhaser(), 1);
    panelBg.strokeRoundedRect(width * 0.1, height * 0.15, width * 0.8, height * 0.25, 20);

    const cardNameText = scene.add.text(width * 0.5, height * 0.18, '', {
        fontSize: '32px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    const cardHighScoreText = scene.add.text(width * 0.5, height * 0.202, '', {
        fontSize: '16px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }).setAlpha(0.5).setOrigin(0.5);

    const cardLevelText = I18nText.create(scene, width * 0.82, height * 0.18, 'level_text', {
        fontSize: '20px',
        color: themeManager.getAccent(),
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }, { level: 1 }).setOrigin(0.5);

    const cardElementImage = scene.add.image(width * 0.1 + 32, height * 0.15 + 32, 'element', 'element-cryo');
    cardElementImage.setDisplaySize(32, 32);

    const cardDescriptionText = scene.add.text(width * 0.5, height * 0.26, '', {
        fontSize: '20px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        wordWrap: { width: width * 0.75 },
        align: 'center'
    }).setOrigin(0.5);

    const cardHPText = I18nText.create(scene, width * 0.5, height * 0.32, 'hp_label', {
        fontSize: '32px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        wordWrap: { width: width * 0.75 },
        align: 'center'
    }, { hp: 7 }) as I18nText & { hp: number };
    cardHPText.setOrigin(0.5);
    cardHPText.hp = 7;

    const upgradeButton = I18nText.create(scene, width * 0.5, height * 0.36, 'upgrade', {
        fontSize: '24px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        backgroundColor: themeManager.getPrimary(),
        padding: { x: 20, y: 10 }
    }).setOrigin(0.5);

    upgradeButton.setInteractive({ useHandCursor: true });
    upgradeButton.on('pointerover', () => {
        callbacks.onUpgradeHover();
    });
    upgradeButton.on('pointerout', () => {
        callbacks.onUpgradeOut();
    });
    upgradeButton.on('pointerdown', () => {
        callbacks.onUpgradeClick();
    });

    return {
        cardNameText,
        cardHighScoreText,
        cardLevelText,
        cardElementImage,
        cardDescriptionText,
        cardHPText,
        upgradeButton
    };
}
