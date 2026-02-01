import Phaser from 'phaser';
import { localizationManager } from '../utils/LocalizationManager.js';
import { SpritesheetWrapper } from '../utils/SpritesheetWrapper.js';
import type GameManager from '../core/GameManager.js';

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
    cardInfoDialog: Phaser.GameObjects.Container | null;
    unsubscribeList: Array<() => void>;
    isLongPressed?: boolean;
    description?: string;
    border!: Phaser.GameObjects.Graphics;
    cardImage!: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
    escKey?: Phaser.Input.Keyboard.Key;

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

    createCard(): void {
        let atlasKey = this.type;
        const Def = (this.constructor as typeof Card).DEFAULT;
        if (this.type === 'weapon' && Def.category) {
            atlasKey += '-' + Def.category;
        } else if (this.type === 'enemy' && Def.clan) {
            atlasKey += '-' + Def.clan;
        }
        this.cardImage = this.scene.add.image(0, 0, atlasKey, this.nameId);
        this.cardImage.setDisplaySize(160, 274.3);

        this.border = this.scene.add.graphics();
        this.border.fillStyle(0xffffff, 1);
        this.border.lineStyle(2, 0xffffff, 1);
        this.border.fillRoundedRect(-82, -139, 164, 278.3, 20);
        this.border.strokeRoundedRect(-82, -139, 164, 278.3, 20);

        this.add([this.border, this.cardImage]);
        this.addDisplayHUD();

        this.setInteractive(new Phaser.Geom.Rectangle(-80, -137, 160, 274.3), Phaser.Geom.Rectangle.Contains);

        this.on('pointerdown', () => this.onCardPointerDown());
        this.on('pointerup', () => this.onCardPointerUp());
        this.on('pointerover', () => this.onCardHover());
        this.on('pointerout', () => this.onCardOut());
    }

    addDisplayHUD(): void {
        // Override in subclasses
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
            this.cardInfoDialog.destroy();
        }
        const { width, height } = this.scene.scale;
        this.cardInfoDialog = this.scene.add.container(width / 2, height / 2);
        this.cardInfoDialog.setDepth(120);

        const bg = this.scene.add.rectangle(-width / 2, -height / 2, width, height, 0x000000, 0.7)
            .setOrigin(0, 0)
            .setInteractive();

        const dialogBg = this.scene.add.graphics();
        dialogBg.fillStyle(0x800080, 0.95);
        dialogBg.lineStyle(3, 0xff3366);
        dialogBg.fillRoundedRect(-200, -150, 400, 300, 20);
        dialogBg.strokeRoundedRect(-200, -150, 400, 300, 20);

        let atlasKey = this.type;
        const Def = (this.constructor as typeof Card).DEFAULT;
        if (this.type === 'weapon' && Def.category) {
            atlasKey += '-' + Def.category;
        } else if (this.type === 'enemy' && Def.clan) {
            atlasKey += '-' + Def.clan;
        }

        const cardImg = this.scene.add.image(0, 0, atlasKey, this.nameId);
        cardImg.setDisplaySize(80, 137.14);

        const nameText = this.scene.add.text(0, -120, this.name, {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial'
        });
        nameText.setOrigin(0.5);

        const typeText = this.scene.add.text(0, -100, localizationManager.t('type_label', { type: localizationManager.t(this.type) || this.type }), {
            fontSize: '16px',
            color: '#ffb3d9',
            fontFamily: 'Arial'
        });
        typeText.setOrigin(0.5);

        const description = this.getDescription();
        const descText = this.scene.add.text(0, 100, description, {
            fontSize: '14px',
            color: '#ecf0f1',
            fontFamily: 'Arial',
            wordWrap: { width: 300 },
            align: 'center'
        });
        descText.setOrigin(0.5);

        const closeBtn = this.scene.add.graphics();
        closeBtn.fillStyle(0xff3366);
        closeBtn.fillRoundedRect(-30, -25, 60, 50, 8);
        closeBtn.setPosition(0, 190);

        const closeText = this.scene.add.text(0, 190, localizationManager.t('close'), {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial'
        });
        closeText.setOrigin(0.5);

        closeBtn.setInteractive(new Phaser.Geom.Rectangle(-30, -25, 60, 50), Phaser.Geom.Rectangle.Contains);

        closeBtn.on('pointerover', () => {
            closeBtn.clear();
            closeBtn.setScale(1.2);
            closeBtn.fillStyle(0xff6b9d);
            closeBtn.fillRoundedRect(-30, -25, 60, 50, 8);
        });

        closeBtn.on('pointerout', () => {
            closeBtn.clear();
            closeBtn.setScale(1);
            closeBtn.fillStyle(0xff3366);
            closeBtn.fillRoundedRect(-30, -25, 60, 50, 8);
        });

        closeBtn.on('pointerdown', () => {
            this.hideCardInfoDialog();
        });

        this.cardInfoDialog.add([bg, dialogBg, cardImg, nameText, typeText, descText, closeBtn, closeText]);
        this.scene.add.existing(this.cardInfoDialog);

        this.escKey = this.scene.input.keyboard!.addKey('ESC');
        this.escKey.on('down', () => {
            this.hideCardInfoDialog();
        });
    }

    hideCardInfoDialog(): void {
        if (this.cardInfoDialog) {
            this.cardInfoDialog.destroy();
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
        return this.description ?? 'Không có mô tả cho thẻ này.';
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
            color: '#ffffff',
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

    CardEffect(): void {
        console.log(`Card ${this.name} (${this.nameId}) đang chạy hiệu ứng...`);
    }

    takeDamage(damage: number, type?: string): void {
        console.log(`Card ${this.name} (${this.nameId}) bị tấn công ${damage} damage`);
        if (type === 'Explosive') {
            SpritesheetWrapper.animationBomb(this.scene, this.x, this.y);
        } else if (type === 'BreatheFire') {
            SpritesheetWrapper.animationBreatheFire(this.scene, this.x, this.y);
        }
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

    ProgressDestroy(): void {
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
                            console.warn(`Card ${this.name || this.nameId}: Lỗi khi unsubscribe:`, error);
                        }
                    }
                });
                this.destroy();
            }
        });
    }

    processCreation(): void {
        this.setAlpha(0);
        this.setScale(0.5);
        this.scene.tweens.add({
            targets: this,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 400,
            ease: 'Back.easeOut',
            onComplete: () => {}
        });
    }
}
