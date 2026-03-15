import Phaser from 'phaser';
import { localizationManager } from '../core/LocalizationManager.js';
import { dataManager } from '../core/DataManager.js';
import { SpritesheetWrapper } from '../utils/SpritesheetWrapper.js';
import { themeManager } from '../core/ThemeManager.js';
import { showCardInfoDialog } from '../components/LibraryScene/CardInfoDialog.js';
import { I18nText } from '../components/shared/I18nText.js';
import type GameManager from '../core/GameManager.js';
import { Log } from '../utils/Log.js';

export interface SceneWithGameManager extends Phaser.Scene {
    gameManager?: GameManager;
}

export interface CardDefault {
    category?: string;
    clan?: string;
    id?: string;
    name?: string;
    description?: string;
    rarity?: number;
    element?: string;
    hp?: number;
    type?: string;
    /** Mô tả khi coin ở trạng thái cộng hưởng (dùng cho Coin) */
    resonanceDescription?: string;
    /** Các chỉ số cho Enemy */
    healthMin?: number;
    healthMax?: number;
    scoreMin?: number;
    scoreMax?: number;
    /** Các chỉ số cho Bomb và Trap */
    countdown?: number;
    damageMin?: number;
    damageMax?: number;
    /** Các chỉ số cho Treasure và Weapon */
    durabilityMin?: number;
    durabilityMax?: number;
    /** Các chỉ số cho Food */
    foodMin?: number;
    foodMax?: number;
    /** Treasure: danh sách className của thẻ có thể rơi ra khi mở rương */
    contents?: string[];
}

export interface CreateDisplayOptions {
    fillColor?: number;
    text?: string;
}

export type DisplayPosition = 'leftTop' | 'rightTop' | 'rightBottom' | 'leftBottom';

export interface CreateDisplayResult {
    container: Phaser.GameObjects.Container;
    text: Phaser.GameObjects.Text;
    updateText: (newText: string | number) => void;
    updateColor: (newColor: number) => void;
    destroy: () => void;
}

export default class Card extends Phaser.GameObjects.Container {
    declare scene: SceneWithGameManager;
    index: number;
    name: string;
    nameId: string;
    type: string;
    pressStartTime: number;
    cardInfoDialog: Phaser.GameObjects.Container | { hide: () => void } | null;
    unsubscribeList: Array<() => void>;
    isLongPressed?: boolean;
    description?: string;
    border!: Phaser.GameObjects.Graphics;
    cardImage!: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
    escKey?: Phaser.Input.Keyboard.Key;
    /** Config đã áp dụng (từ JSON), dùng cho createCard / atlas category-clan */
    protected config?: CardDefault;

    static DEFAULT: CardDefault = {};

    constructor(
        scene: SceneWithGameManager,
        x: number,
        y: number,
        index: number,
        name: string,
        nameId: string,
        type: string
    ) {
        super(scene, x, y);
        this.index = index;
        this.name = name;
        this.nameId = nameId;
        this.type = type;
        this.pressStartTime = 0;
        this.cardInfoDialog = null;
        this.unsubscribeList = [];
    }

    /**
     * Gán các chỉ số từ config (JSON hoặc DEFAULT) xuống instance.
     * Gọi trong constructor của subclass sau super(). Subclass có thể override để set thêm field.
     */
    applyConfig(config: CardDefault): void {
        this.config = { ...this.config, ...config };
        if (config.name != null) this.name = config.name;
        if (config.id != null) this.nameId = config.id;
        if (config.description != null) this.description = config.description;
        if (config.rarity != null) (this as any).rarity = config.rarity;
    }

    createCard(): void {
        let atlasKey = this.type;
        const def = this.config ?? (this.constructor as typeof Card).DEFAULT;
        if (this.type === 'weapon' && def.category) {
            atlasKey += '-' + def.category;
        } else if (this.type === 'enemy' && def.clan) {
            atlasKey += '-' + def.clan;
        }
        this.cardImage = this.scene.add.image(0, 0, atlasKey, this.nameId);
        this.cardImage.setDisplaySize(160, 274.3);

        this.border = this.scene.add.graphics();
        this.border.fillStyle(themeManager.getTextPhaser(), 1);
        this.border.lineStyle(2, themeManager.getTextPhaser(), 1);
        this.border.fillRoundedRect(-82, -139, 164, 278.3, 20);
        this.border.strokeRoundedRect(-82, -139, 164, 278.3, 20);

        this.add([this.border, this.cardImage]);
        this.addDisplayHUD();
        this.addCardNameIfEnabled();

        this.setInteractive(new Phaser.Geom.Rectangle(-80, -137, 160, 274.3), Phaser.Geom.Rectangle.Contains);

        this.on('pointerdown', () => this.onCardPointerDown());
        this.on('pointerup', () => this.onCardPointerUp());
        this.on('pointerover', () => this.onCardHover());
        this.on('pointerout', () => this.onCardOut());
    }

    addDisplayHUD(): void {
        // Override in subclasses
    }

    /** Hiển thị tên thẻ khi showCardName = true. Gọi sau addDisplayHUD() trong createCard(). */
    protected addCardNameIfEnabled(): void {
        if (dataManager.get<boolean>('showCardName') !== true) return;
        const nameText = I18nText.create(this.scene, 0, 115, this.name, {
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

    onCardPointerDown(): void {
        if (this.scene.gameManager?.animationManager.isProcessing) {
            return;
        }
        this.pressStartTime = Date.now();
        this.isLongPressed = false;
    }

    onCardPointerUp(): void {
        if (this.scene.gameManager?.animationManager.isProcessing) {
            this.pressStartTime = 0;
            this.isLongPressed = false;
            return;
        }
        if (this.pressStartTime === 0) return;

        const pressDuration = Date.now() - this.pressStartTime;

        if (!this.isLongPressed && pressDuration > 0) {
            if (pressDuration < 1500) {
                this.onCardClick();
            } else {
                this.isLongPressed = true;
                this.onLongPress();
            }
        }

        this.pressStartTime = 0;
    }

    onLongPress(): void {
        this.showCardInfoDialog();
    }

    showCardInfoDialog(): void {
        if (this.cardInfoDialog) {
            if ('hide' in this.cardInfoDialog) this.cardInfoDialog.hide();
            else this.cardInfoDialog.destroy();
            this.cardInfoDialog = null;
        }
        const def = this.config ?? (this.constructor as typeof Card).DEFAULT;
        const cardData = {
            type: this.type,
            id: this.nameId,
            name: this.name,
            description: this.type === 'character' ? (this.getDescription()) : (this.description ?? 'adventureCard._no_key.description'),
            category: def.category,
            clan: def.clan
        };
        const handle = showCardInfoDialog(this.scene, cardData, () => {
            this.cardInfoDialog = null;
            this.escKey = undefined;
            this.isLongPressed = false;
            this.pressStartTime = 0;
        });
        this.cardInfoDialog = handle;
    }

    hideCardInfoDialog(): void {
        if (this.cardInfoDialog) {
            if ('hide' in this.cardInfoDialog) this.cardInfoDialog.hide();
            else this.cardInfoDialog.destroy();
            this.cardInfoDialog = null;
        }
        if (this.escKey) {
            this.escKey.off('down');
            this.escKey = undefined;
        }
        this.isLongPressed = false;
        this.pressStartTime = 0;
    }

    getDescription(): string {
        if (this.type === 'character') {
            return this.description ?? 'Không có mô tả cho thẻ này.';
        }
        const key = this.description ?? 'adventureCard._no_key.description';
        return localizationManager.t(key) || key;
    }

    onCardClick(): void {
        this.scene.gameManager?.moveCharacter(this.index);
    }

    onCardHover(): void {
        this.setScale(1.05);
    }

    onCardOut(): void {
        this.setScale(1.0);
    }

    createDisplay(
        options: CreateDisplayOptions = {},
        position: DisplayPosition
    ): CreateDisplayResult {
        const { fillColor = 0x00ff00, text = '0' } = options;

        const background = this.scene.add.graphics();
        background.fillStyle(fillColor);
        background.fillCircle(0, 0, 18);

        const textDisplay = this.scene.add.text(0, 0, text.toString(), {
            fontSize: '20px',
            color: themeManager.getText(),
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        });
        textDisplay.setOrigin(0.5);

        const display = this.scene.add.container(0, 0, [background, textDisplay]);

        if (position === 'leftTop') display.setPosition(-57, -113);
        else if (position === 'rightTop') display.setPosition(57, -113);
        else if (position === 'rightBottom') display.setPosition(57, 113);
        else if (position === 'leftBottom') display.setPosition(-57, 113);

        this.add(display);

        if (parseInt(text, 10) === 0) {
            display.setVisible(false);
        }

        return {
            container: display,
            text: textDisplay,
            updateText: (newText: string | number) => {
                if (textDisplay?.setText) {
                    textDisplay.setText(String(newText));
                    display.setVisible(parseInt(String(newText), 10) !== 0);
                }
            },
            updateColor: (newColor: number) => {
                if (background?.fillStyle) {
                    background.fillStyle(newColor);
                }
            },
            destroy: () => {
                display?.destroy();
            }
        };
    }

    GetRandom(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    CardEffect(): Promise<boolean> { 
        Log.info(`Card ${this.name} (${this.nameId}) đang chạy hiệu ứng...`);
        return Promise.resolve(false);
    }

    takeDamage(damage: number, type?: string): void {
        Log.info(`Card ${this.name} (${this.nameId}) bị tấn công ${damage} damage`);
    }

    die(): void {
        this.ProgressDestroy();
        if (this.scene?.gameManager) {
            const newCard = this.scene.gameManager.cardManager.cardFactory.createCoin(
                this.scene,
                this.index,
                this.GetRandom(1, 3)
            );
            if (newCard) {
                this.scene.gameManager.cardManager.addCard(newCard, this.index).processCreation?.();
            }
        }
    }

    destroyed: boolean = false;

    ProgressDestroy(): void {

        this.destroyed = true;

        if (!this.scene?.tweens) {
            this.destroy();
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
                this.unsubscribeList.forEach(unsubscribe => {
                    if (typeof unsubscribe === 'function') {
                        try {
                            unsubscribe();
                        } catch (error) {
                            Log.warn(`Card ${this.name || this.nameId}: Lỗi khi unsubscribe:`, error);
                        }
                    }
                });
                this.destroy();
            }
        });
    }

    processCreation(): void {

        if (this.scene?.gameManager?.isGameOver) {
            this.setVisible(false);
            return;
        }

        this.setAlpha(0);
        this.setScale(0.5);
        this.scene.tweens.add({
            targets: this,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 400,
            ease: 'Back.easeOut',
            onComplete: () => { }
        });
    }
}
