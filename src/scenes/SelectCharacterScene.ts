import Phaser from 'phaser';
import { GradientText } from '../utils/GradientText.js';
import { HeaderUI } from '../utils/HeaderUI.js';
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

    constructor() {
        super({ key: 'SelectCharacterScene' });

        this.cards = cardCharacterList as CardCharacter[];

        // Khởi tạo currentCardIndex với logic thông minh
        this.currentCardIndex = this.initializeCurrentCardIndex();
    }

    init(): void {
        const highScoresStr = localStorage.getItem('characterHighScores');
        if (!highScoresStr) {
            this.HighScores = {};
        } else {
            this.HighScores = JSON.parse(highScoresStr) as HighScores;
        }
        console.log(this.HighScores);
    }

    create(): void {
        const { width, height } = this.scale;

        // Background
        const background = this.add.image(width / 2, height / 2, 'background');
        background.setDisplaySize(width, height);

        this.headerUI = HeaderUI.createHeaderUI(this, width, height);

        // Tiêu đề
        GradientText.createGameTitle(this, 'CHARACTER', width / 2, height * 0.12);

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
    }

    createInfoPanel(width: number, height: number): void {
        // Panel nền
        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x96576a, 0.8);
        panelBg.fillRoundedRect(width * 0.1, height * 0.15, width * 0.8, height * 0.25, 20);
        panelBg.lineStyle(3, 0x1f0614, 1);
        panelBg.strokeRoundedRect(width * 0.1, height * 0.15, width * 0.8, height * 0.25, 20);

        // Thông tin thẻ
        this.cardNameText = this.add.text(width * 0.5, height * 0.18, '', {
            fontSize: '32px',
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Thông tin thẻ
        this.cardHighScoreText = this.add.text(width * 0.5, height * 0.202, '', {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        }).setAlpha(0.5).setOrigin(0.5);

        this.cardLevelText = this.add.text(width * 0.82, height * 0.18, 'level 1', {
            fontSize: '20px',
            color: '#FFD700',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.cardElementImage = this.add.image(width * 0.1 + 32, height * 0.15 + 32, 'element', 'element-cryo');
        this.cardElementImage.setDisplaySize(32, 32);

        this.cardDescriptionText = this.add.text(width * 0.5, height * 0.26, '', {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            wordWrap: { width: width * 0.75 },
            align: 'center'
        }).setOrigin(0.5);

        this.cardHPText = this.add.text(width * 0.5, height * 0.32, '❤️ 7', {
            fontSize: '32px',
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            wordWrap: { width: width * 0.75 },
            align: 'center'
        }) as Phaser.GameObjects.Text & { hp: number };
        this.cardHPText.setOrigin(0.5);
        this.cardHPText.hp = 7;

        // Nút Upgrade
        this.upgradeButton = this.add.text(width * 0.5, height * 0.36, 'UPGRADE', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            backgroundColor: '#95245b',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        this.upgradeButton.setInteractive({ useHandCursor: true });
        this.upgradeButton.on('pointerover', () => {
            // Chỉ hover nếu chưa max level
            if (this.cards[this.currentCardIndex].level && this.cards[this.currentCardIndex].level! < 9) {
                this.upgradeButton.setTint(0xd1d1d1); // Màu vàng gold
                this.upgradeButton.setScale(1.1);
                this.upgradeButton.setStyle({ color: '#ffee8dff' });
                this.cardHPText.setText(`🪙${this.upgradeCharacterPrice()}`);
            }
        });
        this.upgradeButton.on('pointerout', () => {
            this.upgradeButton.clearTint();
            this.upgradeButton.setScale(1);
            this.upgradeButton.setStyle({ color: '#ffffff' });
            this.cardHPText.setText(`❤️ ${this.cardHPText.hp}`);
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
        this.cardBorder.lineStyle(4, 0xffffff, 1);
        this.cardBorder.fillStyle(0xffffff, 1);
        this.cardBorder.fillRoundedRect(-152, -259, 304, 518, 28);
        this.cardBorder.strokeRoundedRect(-152, -259, 304, 518, 28);

        this.currentCardContainer.add(this.cardBorder);
        this.currentCardContainer.add(this.currentCardImage);
    }

    createNavigationButtons(width: number, height: number): void {
        // Nút Previous (trái)
        this.prevButton = this.add.text(width * 0.2, height * 0.65, '◀', {
            fontSize: '28px',
            color: '#ffffff',
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
            color: '#ffffff',
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
        this.backButton = this.add.text(width * 0.5, height * 0.9, 'SELECT', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            backgroundColor: '#622945',
            padding: { x: 25, y: 12 }
        }).setOrigin(0.5);

        this.backButton.setInteractive({ useHandCursor: true });
        this.backButton.on('pointerover', () => {
            this.backButton.setScale(1.1);
            this.backButton.setTint(0xd1d1d1);
        });
        this.backButton.on('pointerout', () => {
            this.backButton.setScale(1);
            this.backButton.clearTint();
        });
        this.backButton.on('pointerdown', () => {
            localStorage.setItem('selectedCharacter', this.cards[this.currentCardIndex].id);
            this.scene.start('MenuScene');
        });
    }

    updateCardDisplay(): void {
        const currentCard = this.cards[this.currentCardIndex];

        // Load level từ localStorage
        let CharacterLevel = localStorage.getItem('characterLevel');
        if (CharacterLevel) {
            try {
                const levelData: Record<string, number> = JSON.parse(CharacterLevel);
                if (levelData[currentCard.id]) {
                    currentCard.level = levelData[currentCard.id];
                } else {
                    currentCard.level = 1;
                }
            } catch (error) {
                console.warn('Error parsing CharacterLevel from localStorage:', error);
                currentCard.level = 1;
            }
        } else {
            currentCard.level = 1;
        }

        // Cập nhật thông tin panel
        this.cardNameText.setText(currentCard.name);
        this.cardElementImage.setTexture('element', `element-${currentCard.element.toLowerCase()}`);
        this.cardDescriptionText.setText(currentCard.description);
        this.cardHPText.setText(`❤️ ${currentCard.hp + (currentCard.level || 1) - 1}`);
        this.cardLevelText.setText(`level ${currentCard.level || 1}`);
        if (this.HighScores[currentCard.id]) {
            this.cardHighScoreText.setText(`High Score: ${this.HighScores[currentCard.id]}`);
        } else {
            this.cardHighScoreText.setText('');
        }


        // Hiển thị level hoặc MAX
        if ((currentCard.level || 1) >= 9) {
            this.upgradeButton.setText('MAX LEVEL');
            this.upgradeButton.setStyle({ color: '#FFFFFF' });
            this.upgradeButton.setScale(1);
        } else {
            this.upgradeButton.setText(`UPGRADE`);
        }

        this.cardHPText.hp = currentCard.hp + (currentCard.level || 1) - 1;

        // Cập nhật hình ảnh thẻ và style dựa trên level
        if ((currentCard.level || 1) > 2) {
            // Nếu level > 2, sử dụng SpritesheetCharacter.create và style vàng
            this.currentCardContainer.remove(this.currentCardImage, true);
            this.currentCardImage = SpritesheetWrapper.CharacterAnimation(this, 0, 0,
                currentCard.id + '-sprite', 300, 514);
            this.currentCardContainer.add(this.currentCardImage);

            // Thay đổi style viền thành màu vàng
            this.cardBorder.clear();
            this.cardBorder.lineStyle(4, 0xdcc06f, 1);
            this.cardBorder.fillStyle(0xdcc06f, 1);
            this.cardBorder.fillRoundedRect(-152, -259, 304, 518, 28);
            this.cardBorder.strokeRoundedRect(-152, -259, 304, 518, 28);
        } else {
            // Nếu level ≤ 2, sử dụng image thường và style trắng
            this.currentCardContainer.remove(this.currentCardImage, true);
            this.currentCardImage = this.add.image(0, 0, 'character', currentCard.id);
            this.currentCardImage.setDisplaySize(300, 514);
            this.currentCardContainer.add(this.currentCardImage);

            // Thay đổi style viền thành màu trắng
            this.cardBorder.clear();
            this.cardBorder.lineStyle(4, 0xffffff, 1);
            this.cardBorder.fillStyle(0xffffff, 1);
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

        // Lấy CharacterLevel từ localStorage
        let CharacterLevel = localStorage.getItem('characterLevel');

        // Nếu chưa có, tạo object mới
        if (!CharacterLevel) {
            CharacterLevel = '{}';
        }

        // Parse JSON nếu có
        let levelData: Record<string, number>;
        try {
            levelData = JSON.parse(CharacterLevel);
        } catch (error) {
            console.warn('Error parsing CharacterLevel from localStorage:', error);
            levelData = {};
        }

        // Tăng level
        currentCard.level = (currentCard.level || 1) + 1;
        levelData[currentCard.id] = currentCard.level;

        // Lưu vào localStorage
        localStorage.setItem('characterLevel', JSON.stringify(levelData));

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

        // Kiểm tra xem có selectedCharacter trong localStorage không
        const selectedCharacter = localStorage.getItem('selectedCharacter');

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
