import Phaser from 'phaser';
import { dataManager } from '../../core/DataManager.js';
import { themeManager } from '../../core/ThemeManager.js';
import { localizationManager } from '../../core/LocalizationManager.js';
import { I18nText } from '../shared/index.js';
import type { AboutJson, AboutBlock } from './types.js';

function formatParagraphText(raw: string | undefined): string {
    if (raw == null || typeof raw !== 'string') return '';
    return raw.replace(/\/n/g, '\n').replace(/\/tab/g, '\t').toLowerCase();
}

function getBlockDisplayText(block: { key?: string; text?: string }, isParagraph: boolean): string {
    const raw = block.key != null ? localizationManager.t(block.key) : (block.text ?? '');
    return isParagraph ? formatParagraphText(raw) : (raw || '').toUpperCase();
}

/**
 * Text cho từng block trong About popup; tự refresh khi đổi ngôn ngữ (giống I18nText).
 */
class AboutBlockText extends Phaser.GameObjects.Text {
    private i18nKey: string;
    private isParagraph: boolean;
    private boundRefresh: () => void;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        i18nKey: string,
        isParagraph: boolean,
        style: Phaser.Types.GameObjects.Text.TextStyle
    ) {
        const displayText = getBlockDisplayText({ key: i18nKey }, isParagraph);
        super(scene, x, y, displayText, style);
        this.i18nKey = i18nKey;
        this.isParagraph = isParagraph;
        this.boundRefresh = () => this.refreshText();
        scene.game.events.on('languageChanged', this.boundRefresh);
    }

    refreshText(): void {
        if (!this.active || this.scene?.scene?.isActive?.() === false) return;
        this.setText(getBlockDisplayText({ key: this.i18nKey }, this.isParagraph));
    }

    override destroy(fromScene?: boolean): void {
        this.scene?.game?.events?.off('languageChanged', this.boundRefresh);
        super.destroy(fromScene);
    }
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

    const title = new I18nText(scene, 0, -panelHeight / 2 + 120, 'about', {
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
    const data = (dataManager.getFlag<AboutJson>('About') ?? { blocks: [] }) as AboutJson;
    let currentY = 0;
    const lineSpacing = 20;
    const blockSpacing = 35;

    data.blocks.forEach((block: AboutBlock) => {
        const isParagraph = block.type === 'paragraph';
        const fontSize = isParagraph ? 18 : getHeadingFontSize(block.size);
        const style: Phaser.Types.GameObjects.Text.TextStyle = {
            fontSize: `${fontSize}px`,
            color: themeManager.getText(),
            fontFamily: 'Arial',
            wordWrap: localizationManager.getWordWrapOptions(panelWidth - 80),
            align: 'center'
        };
        const textObj =
            block.key != null
                ? new AboutBlockText(scene, 0, currentY, block.key, isParagraph, style).setOrigin(0.5, 0)
                : scene.add.text(0, currentY, getBlockDisplayText(block, isParagraph), style).setOrigin(0.5, 0);
        scene.add.existing(textObj);
        contentContainer.add(textObj);
        currentY += textObj.height + (isParagraph ? lineSpacing : blockSpacing);
    });

    popupContainer.add([overlay, panel, title, closeBtn, contentContainer]);
    popupContainer.setVisible(false);
    return popupContainer;
}
