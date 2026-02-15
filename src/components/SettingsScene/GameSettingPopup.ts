import Phaser from 'phaser';
import { themeManager } from '../../core/ThemeManager.js';
import { I18nText } from '../shared/index.js';

export function createGameSettingPopup(
    scene: Phaser.Scene,
    width: number,
    height: number,
    onClose: () => void
): Phaser.GameObjects.Container {
    const popupContainer = scene.add.container(width / 2, height / 2);
    popupContainer.setDepth(50);

    const overlay = scene.add.rectangle(0, 0, width + 100, height + 100, themeManager.getBackgroundPhaser(), 0.25);
    overlay.setInteractive({ useHandCursor: false });
    overlay.on('pointerdown', onClose);

    const panelWidth = width * 0.75;
    const panelHeight = height * 0.5;
    const radius = Math.min(panelWidth, panelHeight) * 0.04;
    const panel = scene.add.graphics();
    panel.fillStyle(themeManager.getSurfacePhaser(), 0.7);
    panel.lineStyle(3, themeManager.getPrimaryPhaser());
    panel.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, radius);
    panel.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, radius);

    const title = new I18nText(scene, 0, -panelHeight / 2 + 80, 'gameSetting', {
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

    const placeholder = new I18nText(scene, 0, 0, 'settings', {
        fontSize: '20px',
        color: themeManager.getNeutral(),
        fontFamily: 'Arial'
    }).setOrigin(0.5);
    placeholder.setAlpha(0.7);

    popupContainer.add([overlay, panel, title, closeBtn, placeholder]);
    popupContainer.setVisible(false);
    return popupContainer;
}
