import Phaser from 'phaser';
import { localizationManager } from '../../core/LocalizationManager.js';
import { themeManager } from '../../core/ThemeManager.js';
import TextureManager from '../../core/TextureManager.js';
import { I18nText } from '../shared/index.js';
import type { CardCharacter } from './types.js';

/** Dữ liệu đã load sẵn để tạo panel với đúng thông tin từ đầu, tránh cache mặc định */
export interface CharacterInfoInitialData {
    card: CardCharacter;
    hp: number;
    highScore: string;
    level: number;
}

export interface CharacterInfoPanelRefs {
    cardNameText: I18nText;
    cardHighScoreText: Phaser.GameObjects.Text;
    cardLevelText: Phaser.GameObjects.Text;
    cardElementImage: Phaser.GameObjects.Image;
    cardDescriptionText: I18nText;
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
    callbacks: CharacterInfoPanelCallbacks,
    initialData?: CharacterInfoInitialData
): CharacterInfoPanelRefs {
    const panelBg = scene.add.graphics();
    panelBg.fillStyle(themeManager.getSecondaryPhaser(), 0.8);
    panelBg.fillRoundedRect(width * 0.1, height * 0.15, width * 0.8, height * 0.25, 20);
    panelBg.lineStyle(3, themeManager.getSurfacePhaser(), 1);
    panelBg.strokeRoundedRect(width * 0.1, height * 0.15, width * 0.8, height * 0.25, 20);

    const card = initialData?.card;
    const nameKey = card ? `character.${card.id}.name` : '';
    const level = initialData?.level ?? 1;
    const hp = initialData?.hp ?? 7;
    const elementKey = initialData?.card?.element?.toLowerCase() ?? 'cryo';
    const descriptionKey = card?.description ?? '';
    const highScore = initialData?.highScore ?? '';

    const cardNameText = I18nText.create(scene, width * 0.5, height * 0.18, nameKey, {
        fontSize: '32px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    const cardHighScoreText = scene.add.text(width * 0.5, height * 0.202, highScore, {
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
    }, { level }).setOrigin(0.5);

    const cardElementImage = TextureManager.image(scene, width * 0.1 + 32, height * 0.15 + 32, `${elementKey}`);
    cardElementImage.setDisplaySize(32, 32);

    const cardDescriptionText = I18nText.create(scene, width * 0.5, height * 0.26, descriptionKey, {
        fontSize: '20px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        wordWrap: localizationManager.getWordWrapOptions(width * 0.75),
        align: 'center'
    }).setOrigin(0.5);

    const cardHPText = I18nText.create(scene, width * 0.5, height * 0.32, 'hp_label', {
        fontSize: '32px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        wordWrap: localizationManager.getWordWrapOptions(width * 0.75),
        align: 'center'
    }, { hp }) as I18nText & { hp: number };
    cardHPText.setOrigin(0.5);
    cardHPText.hp = hp;

    const maxLevel = card?.maxLevel ?? 10;
    const upgradeButton = I18nText.create(scene, width * 0.5, height * 0.36, level >= maxLevel ? 'level_max' : 'upgrade', {
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
