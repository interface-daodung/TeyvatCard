import Phaser from 'phaser';
import { localizationManager } from '../../core/LocalizationManager.js';
import { themeManager } from '../../core/ThemeManager.js';
import { I18nText } from '../shared/index.js';
import { Log } from '../../utils/Log.js';

const DIM_COLOR = 0x000000;
const DIM_ALPHA = 0.6;
const TOTAL_TAPS = 5;
const GUIDE_KEYS = ['tutorial_guide_1', 'tutorial_guide_2', 'tutorial_guide_3', 'tutorial_guide_4', 'tutorial_guide_5'] as const;

/** Sau tap 1: highlight menu. Tap 2–4: setHighlightRegion(...). Tap 5: ẩn màn đen. Tap 6: đóng. */
const HIGHLIGHT_STEPS: Array<null | [number, number, number, number]> = [
    null,
    [653, 31, 706, 82],
    [76, 142, 359, 220],
    [278, 579, 439, 857], 
    [278, 579, 439, 857], 
    null
];

export interface TutorialLayerRef {
    setHighlightRegion: (x1: number, y1: number, x2: number, y2: number) => void;
    setNoHighlight: () => void;
    hide: () => void;
}

/**
 * Tạo layer hướng dẫn: 4 hình chữ nhật đen trong suốt (highlight vùng), overlay chặn bấm,
 * hộp thoại với text I18n. Bấm màn hình để next qua 5 bước, sau đó ẩn layer và gọi onComplete.
 */
export function createTutorialLayer(
    scene: Phaser.Scene,
    width: number,
    height: number,
    onComplete: () => void
): Phaser.GameObjects.Container & TutorialLayerRef {
    const container = scene.add.container(0, 0) as Phaser.GameObjects.Container & TutorialLayerRef;
    container.setDepth(200);

    const graphics = scene.add.graphics();
    container.add(graphics);

    let highlightRegion: { x1: number; y1: number; x2: number; y2: number } | null = null;

    function drawDimOverlay(): void {
        graphics.clear();
        graphics.fillStyle(DIM_COLOR, DIM_ALPHA);

        if (highlightRegion) {
            const left = Math.min(highlightRegion.x1, highlightRegion.x2);
            const right = Math.max(highlightRegion.x1, highlightRegion.x2);
            const top = Math.min(highlightRegion.y1, highlightRegion.y2);
            const bottom = Math.max(highlightRegion.y1, highlightRegion.y2);
            // Top
            if (top > 0) graphics.fillRect(0, 0, width, top);
            // Bottom
            if (bottom < height) graphics.fillRect(0, bottom, width, height - bottom);
            // Left
            if (left > 0) graphics.fillRect(0, top, left, bottom - top);
            // Right
            if (right < width) graphics.fillRect(right, top, width - right, bottom - top);
        } else {
            graphics.fillRect(0, 0, width, height);
        }
    }

    container.setHighlightRegion = (x1: number, y1: number, x2: number, y2: number) => {
        highlightRegion = { x1, y1, x2, y2 };
        drawDimOverlay();
    };

    container.setNoHighlight = () => {
        highlightRegion = null;
        drawDimOverlay();
    };

    container.hide = () => {
        container.setVisible(false);
        container.removeInteractive();
    };

    drawDimOverlay();

    const overlay = scene.add.rectangle(width / 2, height / 2, width + 50, height + 50, 0x000000, 0);
    overlay.setInteractive({ useHandCursor: false });
    container.add(overlay);

    const panelWidth = width * 0.85;
    const panelHeight = height * 0.18;
    const radius = 16;
    const panelX = width / 2;
    const panelY = height * 0.84;

    const panelBg = scene.add.graphics();
    panelBg.fillStyle(themeManager.getSurfacePhaser(), 0.95);
    panelBg.lineStyle(3, themeManager.getPrimaryPhaser());
    panelBg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, radius);
    panelBg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, radius);
    panelBg.setPosition(panelX, panelY);
    container.add(panelBg);

    const padding = 24;
    const guideText = new I18nText(scene, panelX, panelY, GUIDE_KEYS[0], {
        fontSize: '22px',
        color: themeManager.getText(),
        fontFamily: 'Arial',
        wordWrap: localizationManager.getWordWrapOptions(panelWidth - padding * 2),
        align: 'center'
    }).setOrigin(0.5);
    container.add(guideText);

    const tapHint = new I18nText(scene, panelX, panelY + panelHeight / 2 - 28, 'tutorial_tap_next', {
        fontSize: '16px',
        color: themeManager.getNeutral(),
        fontFamily: 'Arial'
    }).setOrigin(0.5);
    container.add(tapHint);

    let stepIndex = 0;

    function nextStep(): void {
        stepIndex++;
        if (stepIndex >= TOTAL_TAPS) {
            container.hide();
            onComplete();
            return;
        }
        if (stepIndex === 5) {
            graphics.setVisible(false);
            return;
        }
        const region = HIGHLIGHT_STEPS[stepIndex];
        if (region === null) {
            container.setNoHighlight();
        } else {
            container.setHighlightRegion(region[0], region[1], region[2], region[3]);
        }
        guideText.setI18nKey(GUIDE_KEYS[stepIndex]);
    }
    

    overlay.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        const x = Math.round(pointer.x);
        const y = Math.round(pointer.y);
        Log.info(
            '[TutorialLayer] Tap — vị trí (x, y) dùng cho setHighlightRegion(x1, y1, x2, y2):',
            x,
            y,
            `→ setHighlightRegion(${x}, ${y}, x2, y2) hoặc (x1, y1, ${x}, ${y})`
        );
        nextStep();
    });

    return container;
}
