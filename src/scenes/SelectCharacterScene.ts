import Phaser from 'phaser';
import { localizationManager } from '../utils/LocalizationManager.js';
import { GradientText } from '../utils/GradientText.js';
import { HeaderUI } from '../utils/HeaderUI.js';
import { themeManager } from '../core/ThemeManager.js';
import { dataManager } from '../core/DataManager.js';
import cardCharacterList from '../data/cardCharacterList.json';
import { SpritesheetWrapper } from '../utils/SpritesheetWrapper.js';

interface CardCharacter {
    id: string;
    name: string;
    element: string;
    description: string;
    hp: number;
    level?: number;
    [key: string]: any;
}

interface HighScores {
    [characterId: string]: number;
}

export default class SelectCharacterScene extends Phaser.Scene {
    private cards: CardCharacter[];
    private currentCardIndex: number;
    private HighScores!: HighScores;
    public headerUI!: any;
    public cardNameText!: Phaser.GameObjects.Text;
    public cardHighScoreText!: Phaser.GameObjects.Text;
    public cardLevelText!: Phaser.GameObjects.Text;
    public cardElementImage!: Phaser.GameObjects.Image;
    public cardDescriptionText!: Phaser.GameObjects.Text;
    public cardHPText!: Phaser.GameObjects.Text & { hp: number };
    public upgradeButton!: Phaser.GameObjects.Text;
    public currentCardContainer!: Phaser.GameObjects.Container;
    public currentCardImage!: Phaser.GameObjects.Image | Phaser.GameObjects.Container;
    public cardBorder!: Phaser.GameObjects.Graphics;
    public prevButton!: Phaser.GameObjects.Text;
    public nextButton!: Phaser.GameObjects.Text;
    public backButton!: Phaser.GameObjects.Text;
    private titleImage?: Phaser.GameObjects.Image;
    private boundOnLanguageChanged: () => void;

    constructor() {
        super({ key: 'SelectCharacterScene' });

        this.cards = cardCharacterList as CardCharacter[];

        // Khởi tạo currentCardIndex với logic thông minh
        this.currentCardIndex = this.initializeCurrentCardIndex();
        this.boundOnLanguageChanged = this.onLanguageChanged.bind(this);
    }

    init(): void {
        this.HighScores = dataManager.get<HighScores>('characterHighScores') ?? {};
        console.log(this.HighScores);
    }

    create(): void {
        const { width, height } = this.scale;

        // Background
        const background = this.add.image(width / 2, height / 2, 'background');
        background.setDisplaySize(width, height);

        this.headerUI = HeaderUI.createHeaderUI(this, width, height);

        // Tiêu đề
        this.titleImage = GradientText.createGameTitle(this, localizationManager.t('character_title'), width / 2, height * 0.12);

        // Panel thông tin thẻ (phía trên)
        this.createInfoPanel(width, height);

        // Hiển thị thẻ hiện tại (giữa màn hình)
        this.createCurrentCardDisplay(width, height);

        // Nút navigation (trái/phải)
        this.createNavigationButtons(width, height);

        // Nút back về MenuScene
        this.createBackButton(width, height);

        // Hiển thị thẻ đầu tiên
        this.updateCardDisplay();

        // Listen for language changes
        const win = window as any;
        if (win.gameEvents?.on) {
            win.gameEvents.on('languageChanged', this.boundOnLanguageChanged);
        }
    }

    onLanguageChanged(): void {
        console.log('[SelectCharacterScene] onLanguageChanged event received');
        // Chỉ update nếu scene đang active và visible
        if (!this.scene.isActive() || !this.scene.isVisible()) {
            console.log('[SelectCharacterScene] Scene not active/visible, skipping update');
            return;
        }
        
        try {
            // Update title
            if (this.titleImage && this.titleImage.active) {
                const { width, height } = this.scale;
                const x = this.titleImage.x;
                const y = this.titleImage.y;
                this.titleImage.destroy();
                this.titleImage = GradientText.createGameTitle(this, localizationManager.t('character_title'), x, y);
            }
            
            // Update card display texts
            this.updateCardDisplay();
            
            console.log('[SelectCharacterScene] onLanguageChanged completed successfully');
        } catch (error) {
            console.error('[SelectCharacterScene] Error in onLanguageChanged:', error);
        }
    }

    shutdown(): void {
        const win = window as any;
        if (win.gameEvents?.off && this.boundOnLanguageChanged) {
            win.gameEvents.off('languageChanged', this.boundOnLanguageChanged);
        }
    }

    createInfoPanel(width: number, height: number): void {
        // Panel nền
        const panelBg = this.add.graphics();
        panelBg.fillStyle(themeManager.getSecondaryPhaser(), 0.8);
        panelBg.fillRoundedRect(width * 0.1, height * 0.15, width * 0.8, height * 0.25, 20);
        panelBg.lineStyle(3, themeManager.getSurfacePhaser(), 1);
        panelBg.strokeRoundedRect(width * 0.1, height * 0.15, width * 0.8, height * 0.25, 20);

        // Thông tin thẻ
        this.cardNameText = this.add.text(width * 0.5, height * 0.18, '', {
            fontSize: '32px',
            color: themeManager.getText(),
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Thông tin thẻ
        this.cardHighScoreText = this.add.text(width * 0.5, height * 0.202, '', {
            fontSize: '16px',
            color: themeManager.getText(),
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        }).setAlpha(0.5).setOrigin(0.5);

        this.cardLevelText = this.add.text(width * 0.82, height * 0.18, 'level 1', {
            fontSize: '20px',
            color: themeManager.getAccent(),
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.cardElementImage = this.add.image(width * 0.1 + 32, height * 0.15 + 32, 'element', 'element-cryo');
        this.cardElementImage.setDisplaySize(32, 32);

        this.cardDescriptionText = this.add.text(width * 0.5, height * 0.26, '', {
            fontSize: '20px',
            color: themeManager.getText(),
            fontFamily: 'Arial, sans-serif',
            wordWrap: { width: width * 0.75 },
            align: 'center'
        }).setOrigin(0.5);

        this.cardHPText = this.add.text(width * 0.5, height * 0.32, localizationManager.t('hp_label', { hp: 7 }), {
            fontSize: '32px',
            color: themeManager.getText(),
            fontFamily: 'Arial, sans-serif',
            wordWrap: { width: width * 0.75 },
            align: 'center'
        }) as Phaser.GameObjects.Text & { hp: number };
        this.cardHPText.setOrigin(0.5);
        this.cardHPText.hp = 7;

        // Nút Upgrade
        this.upgradeButton = this.add.text(width * 0.5, height * 0.36, localizationManager.t('upgrade'), {
            fontSize: '24px',
            color: themeManager.getText(),
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            backgroundColor: themeManager.getPrimary(),
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        this.upgradeButton.setInteractive({ useHandCursor: true });
        this.upgradeButton.on('pointerover', () => {
            // Chỉ hover nếu chưa max level
            if (this.cards[this.currentCardIndex].level && this.cards[this.currentCardIndex].level! < 9) {
                this.upgradeButton.setTint(themeManager.getNeutralPhaser());
                this.upgradeButton.setScale(1.1);
                this.upgradeButton.setStyle({ color: themeManager.getAccent() });
                this.cardHPText.setText(localizationManager.t('coin_amount', { amount: this.upgradeCharacterPrice() }));
            }
        });
        this.upgradeButton.on('pointerout', () => {
            this.upgradeButton.clearTint();
            this.upgradeButton.setScale(1);
            this.upgradeButton.setStyle({ color: themeManager.getText() });
            this.cardHPText.setText(localizationManager.t('hp_label', { hp: this.cardHPText.hp }));
        });
        this.upgradeButton.on('pointerdown', () => {
            // Chỉ upgrade nếu chưa max level
            if (this.cards[this.currentCardIndex].level && this.cards[this.currentCardIndex].level! < 9) {
                console.log('Upgrade button clicked!');
                this.upgradeCharacter();
            }
        });
    }

    createCurrentCardDisplay(width: number, height: number): void {
        // Container cho thẻ hiện tại
        this.currentCardContainer = this.add.container(width / 2, height * 0.65);

        // Thẻ hiện tại
        this.currentCardImage = this.add.image(0, 0, 'character', 'eula');
        this.currentCardImage.setDisplaySize(300, 514); // Tỷ lệ 7:12

        // Viền thẻ - lưu reference để có thể thay đổi style sau này
        this.cardBorder = this.add.graphics();
        this.cardBorder.lineStyle(4, themeManager.getTextPhaser(), 1);
        this.cardBorder.fillStyle(themeManager.getTextPhaser(), 1);
        this.cardBorder.fillRoundedRect(-152, -259, 304, 518, 28);
        this.cardBorder.strokeRoundedRect(-152, -259, 304, 518, 28);

        this.currentCardContainer.add(this.cardBorder);
        this.currentCardContainer.add(this.currentCardImage);
    }

    createNavigationButtons(width: number, height: number): void {
        // Nút Previous (trái)
        this.prevButton = this.add.text(width * 0.2, height * 0.65, '◀', {
            fontSize: '28px',
            color: themeManager.getText(),
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            padding: { x: 20, y: 15 }
        }).setOrigin(0.5);

        this.prevButton.setInteractive({ useHandCursor: true });
        this.prevButton.on('pointerover', () => {
            // this.prevButton.setBackgroundColor('#2980b9');
        });
        this.prevButton.on('pointerout', () => {
            // this.prevButton.setBackgroundColor('#3498db');
        });
        this.prevButton.on('pointerdown', () => {
            this.previousCard();
        });

        // Nút Next (phải)
        this.nextButton = this.add.text(width * 0.8, height * 0.65, '▶', {
            fontSize: '28px',
            color: themeManager.getText(),
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            padding: { x: 20, y: 15 }
        }).setOrigin(0.5);

        this.nextButton.setInteractive({ useHandCursor: true });
        this.nextButton.on('pointerover', () => {
            this.nextButton.setScale(1.1);
        });
        this.nextButton.on('pointerout', () => {
            this.nextButton.setScale(1);
        });
        this.nextButton.on('pointerdown', () => {
            this.nextCard();
        });
    }

    createBackButton(width: number, height: number): void {
        this.backButton = this.add.text(width * 0.5, height * 0.9, localizationManager.t('select'), {
            fontSize: '24px',
            color: themeManager.getText(),
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            backgroundColor: themeManager.getPrimary(),
            padding: { x: 25, y: 12 }
        }).setOrigin(0.5);

        this.backButton.setInteractive({ useHandCursor: true });
        this.backButton.on('pointerover', () => {
            this.backButton.setScale(1.1);
            this.backButton.setTint(themeManager.getNeutralPhaser());
        });
        this.backButton.on('pointerout', () => {
            this.backButton.setScale(1);
            this.backButton.clearTint();
        });
        this.backButton.on('pointerdown', () => {
            dataManager.set('selectedCharacter', this.cards[this.currentCardIndex].id);
            this.scene.start('MenuScene');
        });
    }

    updateCardDisplay(): void {
        const currentCard = this.cards[this.currentCardIndex];

        // Load level từ dataManager
        const levelData = dataManager.get<Record<string, number>>('characterLevel');
        if (levelData && levelData[currentCard.id]) {
            currentCard.level = levelData[currentCard.id];
        } else {
            currentCard.level = 1;
        }

        // Cập nhật thông tin panel
        this.cardNameText.setText(currentCard.name);
        this.cardElementImage.setTexture('element', `element-${currentCard.element.toLowerCase()}`);
        this.cardDescriptionText.setText(currentCard.description);
        this.cardHPText.setText(localizationManager.t('hp_label', { hp: currentCard.hp + (currentCard.level || 1) - 1 }));
        this.cardLevelText.setText(localizationManager.t('level_text', { level: currentCard.level || 1 }));
        if (this.HighScores[currentCard.id]) {
            this.cardHighScoreText.setText(localizationManager.t('high_score_label', { score: this.HighScores[currentCard.id] }));
        } else {
            this.cardHighScoreText.setText('');
        }


        // Hiển thị level hoặc MAX
        if ((currentCard.level || 1) >= 9) {
            this.upgradeButton.setText(localizationManager.t('level_max'));
            this.upgradeButton.setStyle({ color: themeManager.getText() });
            this.upgradeButton.setScale(1);
        } else {
            this.upgradeButton.setText(localizationManager.t('upgrade'));
        }

        this.cardHPText.hp = currentCard.hp + (currentCard.level || 1) - 1;

        // Cập nhật hình ảnh thẻ và style dựa trên level
        if ((currentCard.level || 1) > 2) {
            // Nếu level > 2, sử dụng SpritesheetCharacter.create và style vàng
            this.currentCardContainer.remove(this.currentCardImage, true);
            this.currentCardImage = SpritesheetWrapper.CharacterAnimation(this, 0, 0,
                currentCard.id + '-sprite', 300, 514);
            this.currentCardContainer.add(this.currentCardImage);

            // Thay đổi style viền thành màu vàng (Accent)
            this.cardBorder.clear();
            this.cardBorder.lineStyle(4, themeManager.getAccentPhaser(), 1);
            this.cardBorder.fillStyle(themeManager.getAccentPhaser(), 1);
            this.cardBorder.fillRoundedRect(-152, -259, 304, 518, 28);
            this.cardBorder.strokeRoundedRect(-152, -259, 304, 518, 28);
        } else {
            // Nếu level ≤ 2, sử dụng image thường và style trắng
            this.currentCardContainer.remove(this.currentCardImage, true);
            this.currentCardImage = this.add.image(0, 0, 'character', currentCard.id);
            this.currentCardImage.setDisplaySize(300, 514);
            this.currentCardContainer.add(this.currentCardImage);

            // Thay đổi style viền thành màu trắng (Text)
            this.cardBorder.clear();
            this.cardBorder.lineStyle(4, themeManager.getTextPhaser(), 1);
            this.cardBorder.fillStyle(themeManager.getTextPhaser(), 1);
            this.cardBorder.fillRoundedRect(-152, -259, 304, 518, 28);
            this.cardBorder.strokeRoundedRect(-152, -259, 304, 518, 28);
        }

        // Cập nhật trạng thái nút navigation
        this.prevButton.setAlpha(this.currentCardIndex === 0 ? 0.5 : 1);
        this.nextButton.setAlpha(this.currentCardIndex === this.cards.length - 1 ? 0.5 : 1);
    }

    previousCard(): void {
        if (this.currentCardIndex > 0) {
            this.currentCardIndex--;
            this.updateCardDisplay();
        }
    }

    nextCard(): void {
        if (this.currentCardIndex < this.cards.length - 1) {
            this.currentCardIndex++;
            this.updateCardDisplay();
        }
    }

    /**
     * Tính giá upgrade character
     */
    upgradeCharacterPrice(): number {
        return (this.cards[this.currentCardIndex].level || 1) * 100;
    }

    /**
     * Upgrade character level và lưu vào localStorage
     */
    upgradeCharacter(): void {
        const currentCard = this.cards[this.currentCardIndex];

        // Kiểm tra max level
        if ((currentCard.level || 1) >= 9) {
            console.log(`Character ${currentCard.name} is already at max level!`);
            return;
        }

        const levelData = dataManager.get<Record<string, number>>('characterLevel') ?? {};
        currentCard.level = (currentCard.level || 1) + 1;
        levelData[currentCard.id] = currentCard.level;
        dataManager.set('characterLevel', levelData);

        // Cập nhật hiển thị
        this.updateCardDisplay();

        console.log(`Character ${currentCard.name} upgraded to level ${currentCard.level}`);
    }

    /**
     * Khởi tạo currentCardIndex với logic thông minh
     */
    initializeCurrentCardIndex(): number {
        // Giá trị mặc định là 0
        let defaultIndex = 0;

        // Kiểm tra xem có selectedCharacter không
        const selectedCharacter = dataManager.get<string>('selectedCharacter');

        if (selectedCharacter !== null) {
            try {
                // Parse selectedCharacter để lấy object card
                const selectedCard = selectedCharacter;

                // Tìm index của card được chọn trong mảng cards
                const selectedIndex = this.cards.findIndex(card => card.id === selectedCard);

                if (selectedIndex !== -1) {
                    // Nếu tìm thấy, trả về index đó
                    console.log(`SelectCharacterScene: Đã tìm thấy selectedCharacter "${selectedCard}" tại index ${selectedIndex}`);
                    return selectedIndex;
                } else {
                    // Nếu không tìm thấy, sử dụng giá trị mặc định
                    console.warn(`SelectCharacterScene: Không tìm thấy selectedCharacter "${selectedCard}" trong mảng cards, sử dụng index mặc định ${defaultIndex}`);
                    return defaultIndex;
                }
            } catch (error) {
                // Nếu có lỗi parse JSON, sử dụng giá trị mặc định
                console.warn(`SelectCharacterScene: Lỗi parse selectedCharacter, sử dụng index mặc định ${defaultIndex}`, error);
                return defaultIndex;
            }
        } else {
            // Nếu không có selectedCharacter, sử dụng giá trị mặc định
            console.log(`SelectCharacterScene: Không có selectedCharacter, sử dụng index mặc định ${defaultIndex}`);
            return defaultIndex;
        }
    }
}
