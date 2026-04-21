import Phaser from 'phaser';
import GameManager from '../core/GameManager.js';
import { dataManager } from '../core/DataManager.js';
import AssetManager from '../core/AssetManager.js';
import TextureManager from '../core/TextureManager.js';
import { themeManager } from '../core/ThemeManager.js';
import {
    createGameUI,
    createIconActionButton,
    createItemButton,
    createItemButtonsFromStorage,
    createSkillButton,
    showItemNotReadyToast,
    createSellWeapon,
    createTutorialLayer,
    type ItemData,
    type ItemButton,
    type SkillButton,
    type SellButton
} from '../components/GameScene/index.js';
import { getShowGuideSetting, setShowGuideSetting } from '../components/SettingsScene/GameSettingPopup.js';
import Character from '../modules/typeCard/character.js';
import Mavuika from '../models/cards/character/Mavuika.js';
import { I18nText } from '../components/shared/index.js';

interface SceneData {
    stageId?: string;
}

interface DungeonData {
    stageId: string;
    name: string;
    map_background?: string;
}

export default class GameScene extends Phaser.Scene {
    public stageId!: string;
    public dungeonStageName!: string;
    public gameManager!: GameManager;
    public stageText!: Phaser.GameObjects.Text;
    public highScoreText!: Phaser.GameObjects.Text;
    public coinText!: Phaser.GameObjects.Text;
    public itemEquipment!: ItemButton[];
    public skillButton?: SkillButton;
    public cardCharacter?: Character;
    public sellButton!: SellButton;
    private backgroundImage?: Phaser.GameObjects.Image;
    private navigationModal?: Phaser.GameObjects.Container;
    private backgroundOverlay?: Phaser.GameObjects.Rectangle;
    private backgroundTextureKey: string = 'background';

    constructor() {
        super({ key: 'GameScene' });
    }

    init(data?: SceneData): void {
        const { stageId } = data || {};
        this.stageId = stageId || 'dungeon_abyss_chamber';
        const list = dataManager.getFlag<DungeonData[]>('dungeonList');
        const arr = Array.isArray(list) ? list : [];
        const dungeon = arr.find(d => d.stageId === this.stageId);
        this.dungeonStageName = dungeon?.name || '';

        // Background per dungeon (from dungeonList.json), key được AssetManager preload + register.
        const stageBackgroundKey = AssetManager.getGameSceneBackgroundTextureKey(this.stageId);
        if (TextureManager.has(stageBackgroundKey)) {
            this.backgroundTextureKey = stageBackgroundKey;
        }

        this.gameManager = new GameManager(this);
    }

    create(): void {
        const { width, height } = this.scale;

        this.backgroundImage = TextureManager.image(this, width / 2, 0, this.backgroundTextureKey)
            .setDepth(-1000);
        this.backgroundOverlay = this.add.rectangle(width / 2, height / 2, width, height, themeManager.getBackgroundPhaser())
            .setAlpha(0.5)
            .setDepth(-999);

        // COVER mode: giữ tỉ lệ và phủ kín full màn hình theo overlay.
        // Để giảm hiện tượng bị cắt "phía trên", mình căn ảnh theo mép trên
        // (cắt chủ yếu ở phía dưới khi tỉ lệ không khớp).
        this.applyBackgroundCover(width, height);

        const uiRefs = createGameUI(
            this,
            width,
            height,
            this.dungeonStageName,
            this.gameManager.highScore,
            this.gameManager.coin,
            () => this.openNavigationModal()
        );
        this.stageText = uiRefs.stageText;
        this.highScoreText = uiRefs.highScoreText;
        this.coinText = uiRefs.coinText;

        this.itemEquipment = [];
        const itemButtonsData = createItemButtonsFromStorage();
        const itemSpacing = 90;
        const startX = width * 0.18;
        itemButtonsData.forEach((item, index) => {
            this.itemEquipment.push(
                createItemButton(
                    this,
                    startX + index * itemSpacing,
                    height * 0.15,
                    item,
                    (itemData: ItemData) => itemData.effect(this.gameManager),
                    () => showItemNotReadyToast(this)
                )
            );
        });
        this.gameManager.setItemEquipment(this.itemEquipment);

        this.gameManager.cardManager.initializeCreateDeck();

        this.cardCharacter = this.gameManager.cardManager.CardCharacter as Character;
        if (this.cardCharacter instanceof Mavuika) {
            this.cardCharacter.setToken();
        }
        if ((this.cardCharacter?.level ?? 0) >= 3) {
            const skillIconKey = `${this.cardCharacter.nameId}-icon-skill`;
            this.skillButton = createSkillButton(
                this,
                width * 0.6,
                height * 0.15,
                skillIconKey,
                this.cardCharacter.elementalBurstCooldown,
                () => {
                    if ((this.cardCharacter?.elementalBurstCooldown ?? 1) > 0) {
                        return false;
                    }
                    this.cardCharacter?.elementalBurst();
                    return true;
                },
                () => showItemNotReadyToast(this)
            );
            this.updateSkillButtonCooldown();
        }

        this.sellButton = createSellWeapon(
            this,
            width * 0.75,
            height * 0.95,
            () => this.cardCharacter?.weapon,
            () => {
                const weapon = this.cardCharacter?.weapon;
                if (weapon?.durability > 0) {
                    this.gameManager.addCoin(weapon.price);
                    this.cardCharacter!.weapon = null;
                    this.cardCharacter!.weaponDisplay?.updateText(0);
                    this.cardCharacter!.weaponBadgeDisplay?.updateTexture('');
                    this.sellButton.hideButton();
                }
            }
        );

        if (getShowGuideSetting()) {
            setShowGuideSetting(false);
            createTutorialLayer(this, width, height, () => {});
        }

        this.input.keyboard?.on('keydown-ESC', this.handleEscKey, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.input.keyboard?.off('keydown-ESC', this.handleEscKey, this);
        });
    }

    public updateSkillButtonCooldown(): void {
        if (!this.skillButton || !this.cardCharacter) return;

        try {
            this.skillButton.setCooldown(this.cardCharacter.elementalBurstCooldown);
        } catch (err) {
            console.warn('updateSkillButtonCooldown failed (ignored):', err);
        }
    }

    /**
     * Đổi texture của nền màn hình real-time.
     * Lưu ý: không destroy/add lại để hạn chế lỗi render order/depth.
     */
    public setBackgroundTexture(textureKey?: string | 'default'): void {
        // Quy ước:
        // - Gọi `setBackgroundTexture()` hoặc `setBackgroundTexture('default')` => khôi phục nền theo dungeon (`backgroundTextureKey`)
        // - Gọi với `textureKey` cụ thể => đổi nền sang texture đó (không ghi đè `backgroundTextureKey`)
        const keyToSet =
            textureKey === undefined || textureKey === 'default'
                ? this.backgroundTextureKey
                : textureKey;

        if (!this.backgroundImage) return;

        if (!TextureManager.has(keyToSet)) {
            console.warn('setBackgroundTexture failed (logical key not found):', keyToSet);
            return;
        }
        TextureManager.applyThemeTextureToImage(this.backgroundImage, keyToSet);

        // Khi đổi sang texture có tỉ lệ khác, cần re-apply cover để tránh bị lệch crop.
        const { width, height } = this.scale;
        if (typeof width === 'number' && typeof height === 'number') {
            this.applyBackgroundCover(width, height);
        }
    }

    private applyBackgroundCover(width: number, height: number): void {
        if (!this.backgroundImage) return;
        const textureKey = this.backgroundImage.texture.key;
        const texture = this.textures.get(textureKey);
        const sourceImage = texture?.getSourceImage?.() as HTMLImageElement | undefined;
        const imgW = sourceImage?.width ?? 0;
        const imgH = sourceImage?.height ?? 0;

        if (!imgW || !imgH) {
            // Fallback: không lấy được kích thước ảnh nguồn thì giữ nguyên hiển thị.
            this.backgroundImage.setOrigin(0.5, 0);
            this.backgroundImage.setPosition(width / 2, 0);
            return;
        }

        const scaleX = width / imgW;
        const scaleY = height / imgH;
        const coverScale = Math.max(scaleX, scaleY);

        this.backgroundImage
            .setOrigin(0.5, 0)
            .setPosition(width / 2, 0)
            .setScale(coverScale)
            .setDepth(-1000);
    }

    private closeNavigationModal(): void {
        if (!this.navigationModal) return;
        this.navigationModal.destroy(true);
        this.navigationModal = undefined;
    }

    private handleEscKey(): void {
        if (this.navigationModal) {
            this.closeNavigationModal();
            return;
        }
        this.openNavigationModal();
    }

    private openNavigationModal(): void {
        if (this.navigationModal || this.gameManager.animationManager.isProcessing) return;

        const { width, height } = this.scale;
        const modal = this.add.container(0, 0).setDepth(200);
        const overlay = this.add.rectangle(0, 0, width, height, themeManager.getBackgroundPhaser(), 0.75)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true });
        overlay.on('pointerdown', () => this.closeNavigationModal());

        const panel = this.add.graphics();
        panel.fillStyle(themeManager.getSurfacePhaser(), 0.96);
        panel.lineStyle(3, themeManager.getPrimaryPhaser(), 1);
        panel.fillRoundedRect(width / 2 - 235, height / 2 - 125, 470, 250, 20);
        panel.strokeRoundedRect(width / 2 - 235, height / 2 - 125, 470, 250, 20);

        modal.add([overlay, panel]);

        const modalTitle = I18nText.create(this, width / 2, height / 2 - 68, 'paused', {
            fontSize: '34px',
            color: themeManager.getPrimary(),
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            stroke: themeManager.getBackground(),
            strokeThickness: 3
        }).setOrigin(0.5);
        modal.add(modalTitle);

        createIconActionButton({
            scene: this,
            parent: modal,
            x: width / 2 - 120,
            y: height / 2 + 40,
            icon: '↻',
            tooltipKey: 'restart',
            color: themeManager.getSuccessPhaser(),
            onClick: async () => {
                this.closeNavigationModal();
                await this.gameManager.gameOver({ withAnimation: false, withDialog: false });
                this.scene.restart();
            }
        });

        createIconActionButton({
            scene: this,
            parent: modal,
            x: width / 2,
            y: height / 2 + 40,
            icon: '⌂',
            tooltipKey: 'menu_button',
            color: themeManager.getWarningPhaser(),
            onClick: () => {
                this.closeNavigationModal();
                this.scene.start('MenuScene');
            }
        });

        createIconActionButton({
            scene: this,
            parent: modal,
            x: width / 2 + 120,
            y: height / 2 + 40,
            icon: '▶',
            tooltipKey: 'continue',
            color: themeManager.getInfoPhaser(),
            onClick: () => this.closeNavigationModal()
        });

        this.navigationModal = modal;
    }
}
