import Phaser from 'phaser';
import { themeManager } from '../../core/ThemeManager.js';
import { dataManager } from '../../core/DataManager.js';
import { I18nText } from '../shared/index.js';

const SHOW_CARD_NAME_KEY = 'showCardName';
const SHOW_GUIDE_FLAG_KEY = 'showGuide';

/** Hiển thị tên thẻ bài: mặc định false, lưu localStorage */
function getShowCardName(): boolean {
    const v = dataManager.get<boolean>(SHOW_CARD_NAME_KEY);
    return v === true;
}

function setShowCardName(value: boolean): void {
    dataManager.set(SHOW_CARD_NAME_KEY, value);
}

/** Hiển thị hướng dẫn: mặc định true, lưu session (setFlag) */
function getShowGuide(): boolean {
    return dataManager.getFlagOr<boolean>(SHOW_GUIDE_FLAG_KEY, false );
}

function setShowGuide(value: boolean): void {
    dataManager.setFlag(SHOW_GUIDE_FLAG_KEY, value);
}

/**
 * Tạo một hàng tick/checkbox: label (i18n) + ô vuông (tick khi checked).
 * getValue/setValue đọc ghi giá trị, onToggle gọi sau khi đổi.
 * centered: true thì đặt hàng căn giữa theo x (x là center).
 */
function createToggleRow(
    scene: Phaser.Scene,
    x: number,
    y: number,
    labelKey: string,
    getValue: () => boolean,
    setValue: (v: boolean) => void,
    onToggle: () => void,
    centered: boolean
): Phaser.GameObjects.Container {
    const boxSize = 36;
    const padding = 24;
    const label = new I18nText(scene, 0, 0, labelKey, {
        fontSize: '26px',
        color: themeManager.getText(),
        fontFamily: 'Arial'
    }).setOrigin(0, 0.5);

    const rowWidth = label.width + padding + boxSize;
    const labelX = centered ? -rowWidth / 2 : 0;
    const boxX = centered ? labelX + label.width + padding : label.width + padding;
    label.setX(labelX);

    const box = scene.add.rectangle(boxX, 0, boxSize, boxSize, themeManager.getSurfacePhaser());
    box.setStrokeStyle(2, themeManager.getPrimaryPhaser());
    box.setInteractive({ useHandCursor: true });

    const tick = scene.add.text(boxX, 0, '✓', {
        fontSize: `${boxSize - 8}px`,
        color: themeManager.getAccent(),
        fontFamily: 'Arial'
    }).setOrigin(0.5);
    tick.setVisible(getValue());

    function updateTick(): void {
        tick.setVisible(getValue());
    }

    box.on('pointerdown', () => {
        setValue(!getValue());
        updateTick();
        onToggle();
    });

    const container = scene.add.container(x, y, [label, box, tick]);
    (container as Phaser.GameObjects.Container & { refreshToggle: () => void }).refreshToggle = updateTick;
    return container;
}

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
    const panelHeight = height * 0.58;
    const radius = Math.min(panelWidth, panelHeight) * 0.04;
    const panel = scene.add.graphics();
    panel.fillStyle(themeManager.getSurfacePhaser(), 0.7);
    panel.lineStyle(3, themeManager.getPrimaryPhaser());
    panel.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, radius);
    panel.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, radius);

    const title = new I18nText(scene, 0, -panelHeight / 2 + 50, 'gameSetting', {
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

    const btnWidth = panelWidth * 0.35;
    const btnHeight = 48;
    const gap = 20;
    const rowGap = 28;
    const toggleRowHeight = 50;
    const totalContentHeight = btnHeight + rowGap + toggleRowHeight + rowGap + toggleRowHeight;
    const contentStartY = -totalContentHeight / 2 + btnHeight / 2;
    const contentY = contentStartY;

    const loadBtn = scene.add.rectangle(-btnWidth / 2 - gap / 2, contentY, btnWidth, btnHeight, themeManager.getPrimaryPhaser());
    loadBtn.setStrokeStyle(2, themeManager.getSecondaryPhaser());
    loadBtn.setInteractive({ useHandCursor: true });
    const loadText = new I18nText(scene, -btnWidth / 2 - gap / 2, contentY, 'load', {
        fontSize: '24px',
        color: themeManager.getText(),
        fontFamily: 'Arial'
    }).setOrigin(0.5);
    loadBtn.on('pointerover', () => loadBtn.setStrokeStyle(2, themeManager.getTextPhaser()));
    loadBtn.on('pointerout', () => loadBtn.setStrokeStyle(2, themeManager.getSecondaryPhaser()));
    loadBtn.on('pointerdown', () => { /* TODO: load save */ });

    const saveBtn = scene.add.rectangle(btnWidth / 2 + gap / 2, contentY, btnWidth, btnHeight, themeManager.getPrimaryPhaser());
    saveBtn.setStrokeStyle(2, themeManager.getSecondaryPhaser());
    saveBtn.setInteractive({ useHandCursor: true });
    const saveText = new I18nText(scene, btnWidth / 2 + gap / 2, contentY, 'save', {
        fontSize: '24px',
        color: themeManager.getText(),
        fontFamily: 'Arial'
    }).setOrigin(0.5);
    saveBtn.on('pointerover', () => saveBtn.setStrokeStyle(2, themeManager.getTextPhaser()));
    saveBtn.on('pointerout', () => saveBtn.setStrokeStyle(2, themeManager.getSecondaryPhaser()));
    saveBtn.on('pointerdown', () => { /* TODO: save game */ });

    const toggleY1 = contentY + btnHeight / 2 + rowGap + toggleRowHeight / 2;
    const toggleY2 = toggleY1 + toggleRowHeight / 2 + rowGap + toggleRowHeight / 2;

    const toggleCardName = createToggleRow(
        scene,
        0,
        toggleY1,
        'show_card_name',
        getShowCardName,
        setShowCardName,
        () => {},
        true
    );

    const toggleShowGuide = createToggleRow(
        scene,
        0,
        toggleY2,
        'show_guide',
        getShowGuide,
        setShowGuide,
        () => {},
        true
    );

    popupContainer.add([
        overlay,
        panel,
        title,
        closeBtn,
        loadBtn,
        loadText,
        saveBtn,
        saveText,
        toggleCardName,
        toggleShowGuide
    ]);
    popupContainer.setVisible(false);
    return popupContainer;
}

/** Dùng khi tạo game: đọc từ DataManager, mặc định false. */
export function getShowCardNameSetting(): boolean {
    return getShowCardName();
}

/** Dùng khi cần hiển thị hướng dẫn: đọc từ DataManager, mặc định true. */
export function getShowGuideSetting(): boolean {
    return getShowGuide();
}

/** Ghi cờ hiển thị hướng dẫn (session). Gọi khi đã xem xong tutorial. */
export function setShowGuideSetting(value: boolean): void {
    setShowGuide(value);
}
