import Phaser from 'phaser';
import { localizationManager } from '../../utils/LocalizationManager.js';
import { themeManager } from '../../core/ThemeManager.js';
import aboutData from '../../data/About.json';
import type { AboutJson } from './types.js';

function formatParagraphText(raw: string): string {
    return raw.replace(/\/n/g, '\n').replace(/\/tab/g, '\t').toLowerCase();
}

function getHeadingFontSize(size?: number): number {
    if (size === 1) return 28;
    if (size === 2) return 24;
    return size && size > 0 ? Math.max(18, 32 - size * 4) : 28;
}

export function createAboutPopup(
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

    const panelWidth = width * 0.85;
    const panelHeight = height * 0.75;
    const radius = Math.min(panelWidth, panelHeight) * 0.04;
    const panel = scene.add.graphics();
    panel.fillStyle(themeManager.getSurfacePhaser(), 0.7);
    panel.lineStyle(3, themeManager.getPrimaryPhaser());
    panel.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, radius);
    panel.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, radius);

    const title = scene.add.text(0, -panelHeight / 2 + 120, localizationManager.t('about'), {
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

    const contentContainer = scene.add.container(0, -panelHeight / 2 + 180);
    const data = aboutData as AboutJson;
    let currentY = 0;
    const lineSpacing = 20;
    const blockSpacing = 35;

    data.blocks.forEach((block) => {
        const isParagraph = block.type === 'paragraph';
        const displayText = isParagraph ? formatParagraphText(block.text) : (block.text || '').toUpperCase();
        const fontSize = isParagraph ? 18 : getHeadingFontSize(block.size);
        const textObj = scene.add.text(0, currentY, displayText, {
            fontSize: `${fontSize}px`,
            color: themeManager.getText(),
            fontFamily: 'Arial',
            wordWrap: { width: panelWidth - 80 },
            align: 'center'
        }).setOrigin(0.5, 0);
        contentContainer.add(textObj);
        currentY += textObj.height + (isParagraph ? lineSpacing : blockSpacing);
    });

    popupContainer.add([overlay, panel, title, closeBtn, contentContainer]);
    popupContainer.setVisible(false);
    return popupContainer;
}
