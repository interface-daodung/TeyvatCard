import Phaser from 'phaser';
import { localizationManager, type GameLanguageCode } from '../../core/LocalizationManager.js';
import { themeManager } from '../../core/ThemeManager.js';
import { I18nText } from '../shared/index.js';
import type { LangButton } from './types.js';

export interface LanguagePopupResult {
    container: Phaser.GameObjects.Container;
    refreshLanguageButtons: () => void;
    setTitleText: (text: string) => void;
}

export function createLanguagePopup(
    scene: Phaser.Scene,
    width: number,
    height: number,
    onClose: () => void
): LanguagePopupResult {
    const popupContainer = scene.add.container(width / 2, height / 2);
    popupContainer.setDepth(50);

    const overlay = scene.add.rectangle(0, 0, width + 100, height + 100, themeManager.getBackgroundPhaser(), 0.25);
    overlay.setInteractive({ useHandCursor: false });
    overlay.on('pointerdown', onClose);

    const panelWidth = width * 0.85;
    const panelHeight = height * 0.75;
    const radius = Math.min(panelWidth, panelHeight) * 0.04;
    const panel = scene.add.graphics();
    panel.fillStyle(themeManager.getSurfacePhaser(), 0.7);
    panel.lineStyle(3, themeManager.getPrimaryPhaser());
    panel.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, radius);
    panel.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, radius);

    const titleText = new I18nText(scene, 0, -panelHeight / 2 + 120, 'language', {
        fontSize: '36px',
        color: themeManager.getAccent(),
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: themeManager.getBackground(),
        strokeThickness: 2
    }).setOrigin(0.5);

    const closeBtn = scene.add.text(panelWidth / 2 - 35, -panelHeight / 2 + 30, '✕', {
        fontSize: '32px',
        color: themeManager.getText(),
        fontFamily: 'Arial'
    }).setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', onClose);
    closeBtn.on('pointerover', () => closeBtn.setStyle({ color: themeManager.getAccent() }));
    closeBtn.on('pointerout', () => closeBtn.setStyle({ color: themeManager.getText() }));

    const langButtonsContainer = scene.add.container(0, 0);
    const langButtons: LangButton[] = [];
    const buttonWidth = width * 0.65;
    const buttonHeight = height * 0.08;
    const buttonSpacing = 20;
    const languages = localizationManager.getAvailableLanguages();
    const n = languages.length;

    languages.forEach((lang, i) => {
        const buttonY = (i - (n - 1) / 2) * (buttonHeight + buttonSpacing);
        const isActive = lang === localizationManager.currentLanguage;
        const fillColor = isActive ? themeManager.getPrimaryPhaser() : themeManager.getSurfacePhaser();
        const strokeColor = isActive ? themeManager.getTextPhaser() : themeManager.getSecondaryPhaser();

        const rect = scene.add.rectangle(0, buttonY, buttonWidth, buttonHeight, fillColor);
        rect.setStrokeStyle(3, strokeColor);
        rect.setInteractive({ useHandCursor: true });

        const text = scene.add.text(0, buttonY, localizationManager.getLanguageName(lang), {
            fontSize: '32px',
            color: themeManager.getText(),
            fontFamily: 'Arial',
            stroke: themeManager.getBackground(),
            strokeThickness: 2
        }).setOrigin(0.5);

        const currentLang = lang;
        rect.on('pointerover', () => {
            if (currentLang !== localizationManager.currentLanguage) {
                rect.setFillStyle(themeManager.getPrimaryPhaser());
                rect.setStrokeStyle(3, themeManager.getTextPhaser());
            }
        });
        rect.on('pointerout', () => {
            const active = currentLang === localizationManager.currentLanguage;
            rect.setFillStyle(active ? themeManager.getPrimaryPhaser() : themeManager.getSurfacePhaser());
            rect.setStrokeStyle(3, active ? themeManager.getTextPhaser() : themeManager.getSecondaryPhaser());
        });
        rect.on('pointerdown', () => {
            localizationManager.setLanguage(currentLang as GameLanguageCode);
            langButtons.forEach((btn) => {
                if (btn.rect && btn.setActiveState && btn.lang) {
                    btn.setActiveState(btn.lang === localizationManager.currentLanguage);
                    if (btn.text) btn.text.setText(localizationManager.getLanguageName(btn.lang));
                }
            });
        });

        const btnContainer = scene.add.container(0, 0, [rect, text]) as LangButton;
        btnContainer.rect = rect;
        btnContainer.text = text;
        btnContainer.lang = lang;
        btnContainer.setActiveState = (active: boolean) => {
            rect.setFillStyle(active ? themeManager.getPrimaryPhaser() : themeManager.getSurfacePhaser());
            rect.setStrokeStyle(3, active ? themeManager.getTextPhaser() : themeManager.getSecondaryPhaser());
        };
        langButtons.push(btnContainer);
        langButtonsContainer.add(btnContainer);
    });

    popupContainer.add([overlay, panel, titleText, closeBtn, langButtonsContainer]);
    popupContainer.setVisible(false);

    function refreshLanguageButtons(): void {
        langButtons.forEach((btn) => {
            if (btn.setActiveState && btn.text && btn.lang) {
                const isActive = btn.lang === localizationManager.currentLanguage;
                btn.setActiveState(isActive);
                btn.text.setText(localizationManager.getLanguageName(btn.lang));
            }
        });
    }

    function setTitleText(text: string): void {
        titleText.setText(text);
    }

    return { container: popupContainer, refreshLanguageButtons, setTitleText };
}
