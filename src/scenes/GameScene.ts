import Phaser from 'phaser';
import GameManager from '../core/GameManager.js';
import { localizationManager } from '../utils/LocalizationManager.js';
import { themeManager } from '../core/ThemeManager.js';
import { dataManager } from '../core/DataManager.js';
import itemFactory from '../modules/ItemFactory.js';
import dungeonList from '../data/dungeonList.json';

interface SceneData {
    stageId?: string;
}

interface ItemData {
    image: string;
    cooldown: number;
    effect: (gameManager: GameManager) => boolean;
}

interface ItemButton {
    item: ItemData;
    itemButton: Phaser.GameObjects.Container;
    cooldown: () => number;
    cooldowninning: (count: number) => void;
}

interface SellButton {
    updateButton: () => void;
    hideButton: () => void;
}

interface DungeonData {
    stageId: string;
    name: string;
}

export default class GameScene extends Phaser.Scene {
    public stageId!: string;
    public dungeonStageName!: string;
    public gameManager!: GameManager;
    public stageText!: Phaser.GameObjects.Text;
    public highScoreText!: Phaser.GameObjects.Text;
    public coinText!: Phaser.GameObjects.Text;
    public itemEquipment!: ItemButton[];
    public sellButton!: SellButton;
    private textItemNotUse?: Phaser.GameObjects.Text;
    private textItemNotUseTimeout?: ReturnType<typeof setTimeout>;

    constructor() {
        super({ key: 'GameScene' });
    }

    init(data?: SceneData): void {
        const { stageId } = data || {};
        this.stageId = stageId || 'dungeon_abyss_chamber';
        const dungeon = (dungeonList as DungeonData[]).find(d => d.stageId === this.stageId);
        this.dungeonStageName = dungeon?.name || '';
        console.log('GameScene: Dungeon data:', this.dungeonStageName);
        // Tạo GameManager mới cho mỗi game session
        this.gameManager = new GameManager(this);
    }

    create(): void {
        // Lấy kích thước game
        const { width, height } = this.scale;

        // Background
        this.add.image(width / 2, height / 2, 'background');

        // Thêm overlay tối để làm nổi bật màn chơi
        this.add.rectangle(width / 2, height / 2, width, height, themeManager.getBackgroundPhaser()).setAlpha(0.5);

        // UI
        this.createUI();

        // Tạo deck cards - đặt ở bottom
        this.createDeck();

        this.sellButton = this.createSellWeapon();

        // Resume audio context sau user interaction
        // this.resumeAudioContext();
    }

    createUI(): void {
        const { width, height } = this.scale;

        // Nút ☰ Menu - đặt ở top left
        const menuButton = this.add.text(width * 0.95, height * 0.05, '☰', {
            fontSize: '32px',
            color: themeManager.getText(),
            stroke: themeManager.getSurface(),
            strokeThickness: 2
        });
        menuButton.setInteractive({ useHandCursor: true });
        menuButton.setOrigin(0.5);
        menuButton.on('pointerover', () => {
            menuButton.setScale(1.1);
            menuButton.setTint(themeManager.getNeutralPhaser());
        });
        menuButton.on('pointerout', () => {
            menuButton.setScale(1);
            menuButton.clearTint();
        });
        menuButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });

        //stage  
        this.stageText = this.add.text(width * 0.5, height * 0.035, this.dungeonStageName, {
            fontSize: '30px',
            color: themeManager.getAccent(),
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            stroke: themeManager.getNeutral(),
            strokeThickness: 2
        }).setOrigin(0.5);

        //high score
        this.highScoreText = this.add.text(width * 0.5, height * 0.07, localizationManager.t('high_score_label', { score: this.gameManager.highScore }), {
            fontSize: '20px',
            color: themeManager.getText(),
            fontFamily: 'Arial, sans-serif',
            // stroke: '#E69500',
            // strokeThickness: 2
        }).setOrigin(0.5).setAlpha(0.8);

        // coin với icon 🪙 - đặt ở dưới nút menu
        this.coinText = this.add.text(width * 0.75, height * 0.13, `🪙${this.gameManager.coin}`, {
            fontSize: '32px',
            color: themeManager.getText(),
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            strokeThickness: 2
        });

        this.itemEquipment = [];

        // 3 nút item - lấy từ localStorage và tạo từ itemFactory
        const itemButtons = this.createItemButtonsFromStorage();
        const itemSpacing = 90; // Tăng khoảng cách vì item button lớn hơn
        const startX = width * 0.18;

        itemButtons.forEach((item, index) => {
            this.itemEquipment.push(this.createItemButton(startX + (index * itemSpacing), height * 0.15, item));
        });
        this.gameManager.setItemEquipment(this.itemEquipment);
    }

    createDeck(): void {
        // Khởi tạo CardManager thông qua GameManager Tạo lưới 3x3
        this.gameManager.cardManager.initializeCreateDeck();
    }

    useItem(item: ItemData, countText: Phaser.GameObjects.Text & { cooldown: number }, itemImage: Phaser.GameObjects.Image, itemButton: Phaser.GameObjects.Container): void {
        const { width, height } = this.scale;
        // Xử lý khi sử dụng item
        if (item.effect(this.gameManager)) {
            countText.cooldown = item.cooldown;
            countText.setText(countText.cooldown.toString());
            if (countText.cooldown > 0) {
                countText.setVisible(true);
                itemImage.setTint(themeManager.getNeutralPhaser());
                itemButton.disableInteractive();
            }
        } else {
            console.log('Item không thể sử dụng');
            
            // Kiểm tra nếu đã có textItemNotUse đang hiển thị thì không tạo mới
            if (this.textItemNotUse && this.textItemNotUse.active) {
                return;
            }
            
            // Hủy timeout cũ nếu có
            if (this.textItemNotUseTimeout) {
                clearTimeout(this.textItemNotUseTimeout);
            }
            
            this.textItemNotUse = this.add.text(width * 0.5, height * 0.5, localizationManager.t('item_not_ready'), {
                fontSize: '24px',
                color: themeManager.getText(),
                fontFamily: 'Arial, sans-serif',
                fontStyle: 'bold',
                backgroundColor: themeManager.getBackground(),
                padding: { x: 25, y: 12 },
                stroke: themeManager.getBackground(),
                strokeThickness: 5
            }).setOrigin(0.5).setDepth(2000).setAlpha(0.7);
            
            this.textItemNotUseTimeout = setTimeout(() => {
                if (this.textItemNotUse) {
                    this.textItemNotUse.destroy();
                    this.textItemNotUse = undefined;
                }
                this.textItemNotUseTimeout = undefined;
            }, 1000);
        }
    }

    createItemButton(x: number, y: number, itemData: ItemData): ItemButton {
        // Tạo container chính cho item button
        const itemButton = this.add.container(x, y);

        // Kích thước item button: 120x120
        const buttonSize = 68;

        // 1. Tạo background bo tròn bằng Graphics
        const backgroundItem = this.add.graphics();
        backgroundItem.fillStyle(themeManager.getSurfacePhaser(), 1);
        backgroundItem.fillRoundedRect(-buttonSize / 2, -buttonSize / 2, buttonSize, buttonSize, 20);
        backgroundItem.setAlpha(0.5);

        // 2. Tạo hình ảnh item  
        const itemImage = this.add.image(0, 0, 'item', itemData.image);
        itemImage.setDisplaySize(80, 80); // Kích thước ảnh nhỏ hơn background

        // 3. Tạo text đếm ở góc trên phải
        const countText = this.add.text(buttonSize / 2, -buttonSize / 2, itemData.cooldown.toString(), {
            fontSize: '24px',
            color: themeManager.getText(),
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            stroke: themeManager.getBackground(),
            strokeThickness: 5
        }) as Phaser.GameObjects.Text & { cooldown: number };
        countText.setOrigin(0.5);
        countText.cooldown = itemData.cooldown;

        // Thêm tất cả vào container
        itemButton.add([backgroundItem, itemImage, countText]);

        // Làm cho container có thể click
        itemButton.setSize(buttonSize, buttonSize);
        itemButton.setInteractive();

        // Hiệu ứng hover
        itemButton.on('pointerover', () => {
            itemButton.setScale(1.1);
        });

        itemButton.on('pointerout', () => {
            itemButton.setScale(1);
        });

        // Xử lý click
        itemButton.on('pointerdown', () => {
            this.useItem(itemData, countText, itemImage, itemButton);
        });

        if (itemData.cooldown > 0) {
            countText.setVisible(true);
            itemImage.setTint(themeManager.getNeutralPhaser());
            itemButton.disableInteractive();
        } else {
            countText.setVisible(false);
            itemImage.clearTint();
            itemButton.setInteractive();
        }

        return {
            item: itemData,
            itemButton: itemButton,
            cooldown: () => {
                return countText.cooldown;
            },
            cooldowninning: (count: number) => {
                countText.cooldown = Math.max(0, countText.cooldown - count);
                countText.setText(countText.cooldown.toString());
                if (countText.cooldown <= 0) {
                    countText.setVisible(false);
                    itemImage.clearTint();
                    itemButton.setInteractive();
                }
            }
        };
    }

    /**
     * Tạo item buttons từ localStorage equipment data
     * @returns Array các item button data
     */
    createItemButtonsFromStorage(): ItemData[] {
        try {
            const equipmentData = dataManager.get<string[] | null>('equipment');

            // Kiểm tra nếu equipmentData là array và có dữ liệu
            if (Array.isArray(equipmentData) && equipmentData.length > 0) {
                const itemButtons = equipmentData.map((nameId: string) => {
                    return itemFactory.createItem(nameId);
                });
                console.log('Item buttons created from equipment:', itemButtons);
                return itemButtons;
            }
            // Fallback: nếu không có equipment data, trả về array rỗng
            console.log('No equipment data found, returning empty item buttons');
            return [];

        } catch (error) {
            console.error('Error creating item buttons from storage:', error);
            // Trả về array rỗng nếu có lỗi
            return [];
        }
    }
    /**
     * Tạo nút bán vũ khí cho character
     */
    createSellWeapon(): SellButton {
        const { width, height } = this.scale;
        const x = width * 0.75;
        const y = height * 0.95;

        // Tạo container cho nút bán vũ khí
        const sellButtonContainer = this.add.container(x, y);

        // Tạo background cho nút
        const buttonBackground = this.add.graphics();
        buttonBackground.fillStyle(themeManager.getPrimaryPhaser(), 0.5);
        buttonBackground.fillRoundedRect(-90, -30, 180, 60, 5);
        buttonBackground.lineStyle(2, themeManager.getNeutralPhaser(), 0.5);
        buttonBackground.strokeRoundedRect(-90, -30, 180, 60, 5);


        // Tạo text "→🪙"
        const sellText = this.add.text(16, 0, '→🪙', {
            fontSize: '32px',
            color: themeManager.getText(),
            fontStyle: 'bold',
            fontFamily: 'Arial, sans-serif',
            stroke: themeManager.getBackground(),
            strokeThickness: 2
        }).setOrigin(0.5);

        const PriceText = this.add.text(32, -15, '0', {
            fontSize: '24px',
            color: themeManager.getText(),
            fontStyle: 'bold',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);

        // Tạo hình ảnh vũ khí với texture đúng
        const weaponImage =
            this.add.image(-40, 0, '')
                // 'weapon-' + character.weapon.default.category + '-badge',
                //  character.weapon.default.id + '-badge')
                .setDisplaySize(6, 6);

        // Thêm padding left cho text để phủ lên background
        // sellText.setPadding({ left: 15, right: 5, top: 5, bottom: 5 });

        // Thêm tất cả vào container
        sellButtonContainer.add([buttonBackground, weaponImage, sellText, PriceText]);

        // Làm cho nút có thể click
        sellButtonContainer.setInteractive(new Phaser.Geom.Rectangle(-90, -30, 180, 60), Phaser.Geom.Rectangle.Contains);

        // Thêm event click
        sellButtonContainer.on('pointerdown', () => {
            const weapon = (this.gameManager.cardManager.CardCharacter as any)?.weapon;

            const durability = weapon?.durability;
            if (durability > 0) {
                // Thêm logic bán vũ khí ở đây
                console.log('Bán vũ khí:', weapon.default.id);
                this.gameManager.addCoin(weapon.durability);
                // Xóa vũ khí khỏi character
                (this.gameManager.cardManager.CardCharacter as any).weapon = null;
                (this.gameManager.cardManager.CardCharacter as any).weaponDisplay.updateText(0);
                (this.gameManager.cardManager.CardCharacter as any).weaponBadgeDisplay.updateTexture('');
                this.sellButton.hideButton();
            }
        });

        // Thêm hiệu ứng hover
        sellButtonContainer.on('pointerover', () => {
            sellButtonContainer.setScale(1.1);
        });

        sellButtonContainer.on('pointerout', () => {
            sellButtonContainer.setScale(1);
        });
        sellButtonContainer.setVisible(false);

        return {
            updateButton: () => {
                const weapon = (this.gameManager.cardManager.CardCharacter as any)?.weapon;
                if (weapon?.durability > 0) {
                    sellButtonContainer.setVisible(true);
                    const durability = weapon.durability;
                    PriceText.setText(durability.toString());
                    weaponImage.setTexture('weapon-' + weapon.default.category + '-badge',
                        weapon.default.id + '-badge');
                }
            },
            hideButton: () => {
                sellButtonContainer.setVisible(false);
            }
        };
    }

}
