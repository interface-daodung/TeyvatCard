/**
 * CardView - Lớp hiển thị thẻ (Phaser Container).
 * Tách biệt với logic game: chỉ vẽ, input delegate, và animation destroy/creation.
 */

import Phaser from 'phaser';
import { themeManager } from '../../core/ThemeManager.js';
import { dataManager } from '../../core/DataManager.js';
import { SpritesheetWrapper } from '../../utils/SpritesheetWrapper.js';
import { showCardInfoDialog } from '../../components/LibraryScene/CardInfoDialog.js';
import { I18nText } from '../../components/shared/I18nText.js';
import type { LibraryCardData } from '../../components/LibraryScene/types.js';

export type DisplayPosition = 'leftTop' | 'rightTop' | 'rightBottom' | 'leftBottom';

export interface HudDisplaySpec {
    key: string;
    fillColor: number;
    text: string;
    position: DisplayPosition;
}

export interface CardViewOptions {
    scene: Phaser.Scene;
    x: number;
    y: number;
    index: number;
    type: string;
    nameId: string;
    name: string;
    description?: string;
    config?: { category?: string; clan?: string };
    /** HUD displays (hp, score, durability, etc.) */
    hudDisplays?: HudDisplaySpec[];
    /** Use sprite instead of atlas image (e.g. character level > 2) */
    useSprite?: boolean;
    spriteKey?: string;
    /** Border color (Phaser color number). Default from theme. */
    borderColor?: number;
    /** Optional weapon badge - if set, view will have updateWeaponBadge(visible, textureKey?) */
    hasWeaponBadge?: boolean;
    /** Called when card is clicked (short). Index is the card grid index. */
    onCardClick: (index: number) => void;
    /** Return true to block pointer (e.g. animation in progress). */
    isInputLocked?: () => boolean;
    /** For long-press card info dialog. */
    getCardDataForDialog?: () => LibraryCardData;
}

interface DisplayEntry {
    updateText: (v: string | number) => void;
    updateColor?: (c: number) => void;
    destroy: () => void;
}

export default class CardView extends Phaser.GameObjects.Container {
    declare scene: Phaser.Scene;
    readonly index: number;
    readonly type: string;
    readonly nameId: string;
    private border!: Phaser.GameObjects.Graphics;
    private cardImage!: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
    private displayMap: Map<string, DisplayEntry> = new Map();
    private weaponBadgeImage: Phaser.GameObjects.Image | null = null;
    private pressStartTime: number = 0;
    private cardInfoDialog: { hide: () => void } | null = null;
    private escKey: Phaser.Input.Keyboard.Key | undefined;
    private options: CardViewOptions;
    private unsubscribeOnDestroy: Array<() => void> = [];

    constructor(options: CardViewOptions) {
        const { scene, x, y, index } = options;
        super(scene, x, y);
        this.options = options;
        this.index = index;
        this.type = options.type;
        this.nameId = options.nameId;
        this.buildVisual();
        this.setVisible(false);
    }

    /**
     * Register a callback to run when view is destroyed (e.g. unsubscribe from events).
     */
    onDestroy(cb: () => void): void {
        this.unsubscribeOnDestroy.push(cb);
    }

    private buildVisual(): void {
        const { scene, type, nameId, config, useSprite, spriteKey, borderColor, hudDisplays, hasWeaponBadge } = this.options;

        let atlasKey = type;
        const def = config ?? {};
        if (type === 'weapon' && def.category) {
            atlasKey += '-' + def.category;
        } else if (type === 'enemy' && def.clan) {
            atlasKey += '-' + def.clan;
        }

        if (useSprite && spriteKey) {
            this.cardImage = SpritesheetWrapper.CharacterAnimation(
                scene,
                0,
                0,
                spriteKey,
                160,
                274.3
            ) as Phaser.GameObjects.Sprite;
        } else {
            this.cardImage = scene.add.image(0, 0, atlasKey, nameId);
        }
        this.cardImage.setDisplaySize(160, 274.3);

        const borderColorNum = borderColor ?? themeManager.getTextPhaser();
        this.border = scene.add.graphics();
        this.border.fillStyle(borderColorNum, 1);
        this.border.lineStyle(2, borderColorNum, 1);
        this.border.fillRoundedRect(-82, -139, 164, 278.3, 20);
        this.border.strokeRoundedRect(-82, -139, 164, 278.3, 20);

        this.add([this.border, this.cardImage]);

        if (hudDisplays?.length) {
            for (const hud of hudDisplays) {
                const entry = this.createDisplay(hud.fillColor, hud.text, hud.position);
                this.displayMap.set(hud.key, entry);
            }
        }

        if (hasWeaponBadge) {
            const badge = scene.add.image(0, 0, '').setOrigin(0.5).setPosition(40, 96).setDisplaySize(10, 10);
            badge.setVisible(false);
            this.add(badge);
            this.weaponBadgeImage = badge;
        }

        this.addCardNameIfEnabled();
        this.setInteractive(
            new Phaser.Geom.Rectangle(-80, -137, 160, 274.3),
            Phaser.Geom.Rectangle.Contains
        );
        this.on('pointerdown', () => this.onPointerDown());
        this.on('pointerup', () => this.onPointerUp());
        this.on('pointerover', () => this.setScale(1.05));
        this.on('pointerout', () => this.setScale(1));
    }

    private createDisplay(
        fillColor: number,
        text: string,
        position: DisplayPosition
    ): DisplayEntry {
        const scene = this.scene;
        const background = scene.add.graphics();
        background.fillStyle(fillColor);
        background.fillCircle(0, 0, 18);

        const textDisplay = scene.add.text(0, 0, text, {
            fontSize: '20px',
            color: themeManager.getText(),
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        });
        textDisplay.setOrigin(0.5);

        const display = scene.add.container(0, 0, [background, textDisplay]);
        if (position === 'leftTop') display.setPosition(-57, -113);
        else if (position === 'rightTop') display.setPosition(57, -113);
        else if (position === 'rightBottom') display.setPosition(57, 113);
        else display.setPosition(-57, 113);

        this.add(display);
        if (parseInt(String(text), 10) === 0) display.setVisible(false);

        return {
            updateText: (newText: string | number) => {
                if (textDisplay?.setText) {
                    textDisplay.setText(String(newText));
                    display.setVisible(parseInt(String(newText), 10) !== 0);
                }
            },
            updateColor: (newColor: number) => {
                background?.fillStyle(newColor, 1);
            },
            destroy: () => display?.destroy()
        };
    }

    private addCardNameIfEnabled(): void {
        if (dataManager.get<boolean>('showCardName') !== true) return;
        const nameText = I18nText.create(this.scene, 0, 115, this.options.name, {
            fontSize: '18px',
            color: themeManager.getText(),
            fontFamily: 'Arial, sans-serif',
            align: 'center',
            wordWrap: { width: 140 },
            stroke: '#000000',
            strokeThickness: 2
        });
        nameText.setOrigin(0.5, 0.5);
        this.add(nameText);
    }

    private onPointerDown(): void {
        if (this.options.isInputLocked?.()) return;
        this.pressStartTime = Date.now();
    }

    private onPointerUp(): void {
        if (this.options.isInputLocked?.()) {
            this.pressStartTime = 0;
            return;
        }
        if (this.pressStartTime === 0) return;
        const duration = Date.now() - this.pressStartTime;
        this.pressStartTime = 0;
        if (duration < 1500) {
            this.options.onCardClick(this.index);
        } else {
            this.showCardInfoDialog();
        }
    }

    private showCardInfoDialog(): void {
        if (this.cardInfoDialog) {
            this.cardInfoDialog.hide();
            this.cardInfoDialog = null;
        }
        const getData = this.options.getCardDataForDialog;
        if (!getData) return;
        const cardData = getData();
        const handle = showCardInfoDialog(this.scene, cardData, () => {
            this.cardInfoDialog = null;
            if (this.escKey) {
                this.escKey.off('down');
                this.escKey = undefined;
            }
        });
        this.cardInfoDialog = handle;
        this.escKey = this.scene.input.keyboard?.addKey('ESC');
        this.escKey?.on('down', () => handle.hide());
    }

    updateText(key: string, value: string | number): void {
        this.displayMap.get(key)?.updateText(value);
    }

    updateTexture(atlasKey: string, frame?: string): void {
        if (this.cardImage && 'setTexture' in this.cardImage) {
            this.cardImage.setTexture(atlasKey, frame ?? this.nameId);
        }
    }

    updateWeaponBadge(visible: boolean, textureKey?: string, frame?: string): void {
        if (!this.weaponBadgeImage) return;
        this.weaponBadgeImage.setVisible(visible);
        if (visible && textureKey) {
            this.weaponBadgeImage.setTexture(textureKey, frame ?? '');
        }
    }

    setCardImageTint(color: number): void {
        if (this.cardImage && 'setTint' in this.cardImage) {
            this.cardImage.setTint(color);
        }
    }

    clearCardImageTint(): void {
        if (this.cardImage && 'clearTint' in this.cardImage) {
            this.cardImage.clearTint();
        }
    }

    showPopup(amount: number, type: 'heal' | 'damage' | 'poisoning' | 'error' = 'error'): void {
        const config: Record<string, { color: string; prefix: string }> = {
            heal: { color: '#00ff00', prefix: '+' },
            damage: { color: '#ff0000', prefix: '-' },
            poisoning: { color: '#800080', prefix: '-' },
            error: { color: '#ffffff', prefix: '' }
        };
        const { color, prefix } = config[type] ?? config.error;
        const popupText = this.scene.add
            .text((Math.random() * 2 - 1) * 30, (Math.random() * 2 - 1) * 30, `${prefix}${amount}`, {
                fontSize: '32px',
                color,
                fontFamily: 'Arial',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            })
            .setOrigin(0.5)
            .setDepth(2002);
        this.add(popupText);
        this.scene.tweens.add({
            targets: popupText,
            y: popupText.y - 50,
            alpha: 0.1,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => popupText.destroy()
        });
    }

    /**
     * Play destroy animation then destroy. Returns a Promise that resolves when done.
     */
    playDestroy(): Promise<void> {
        return new Promise((resolve) => {
            this.unsubscribeOnDestroy.forEach((cb) => {
                try {
                    cb();
                } catch (_) {}
            });
            this.unsubscribeOnDestroy = [];
            if (!this.scene?.tweens) {
                this.destroy();
                resolve();
                return;
            }
            this.scene.tweens.add({
                targets: this,
                alpha: 0,
                scaleX: 0.5,
                scaleY: 0.5,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    this.destroy();
                    resolve();
                }
            });
        });
    }

    /**
     * Play creation (spawn) animation. Returns a Promise that resolves when done.
     */
    playCreation(isGameOver?: boolean): Promise<void> {
        if (isGameOver) {
            this.setVisible(false);
            return Promise.resolve();
        }
        this.setVisible(true);
        this.setAlpha(0);
        this.setScale(0.5);
        return new Promise((resolve) => {
            this.scene.tweens.add({
                targets: this,
                alpha: 1,
                scaleX: 1,
                scaleY: 1,
                duration: 400,
                ease: 'Back.easeOut',
                onComplete: () => resolve()
            });
        });
    }
}
