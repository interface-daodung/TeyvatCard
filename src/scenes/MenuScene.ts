import Phaser from 'phaser';
import { GradientText } from '../utils/GradientText.js';
import { HeaderUI } from '../utils/HeaderUI.js';
import { SpritesheetWrapper } from '../utils/SpritesheetWrapper.js';
import cardCharacterList from '../data/cardCharacterList.json';

interface CardCharacter {
    id: string;
    [key: string]: any;
}

export default class MenuScene extends Phaser.Scene {
    private cards: CardCharacter[];

    constructor() {
        super({ key: 'MenuScene' });
        this.cards = cardCharacterList as CardCharacter[];
    }

    preload(): void {
        // KHÔNG CẦN preload gì nữa!
        // Assets đã được load bởi LoadingScene
    }

    create(): void {
        // Lấy kích thước game
        const { width, height } = this.scale;

        // Tạo background thực tế
        const background = this.add.image(width / 2, height / 2, 'background');
        background.setDisplaySize(width, height);

        // Tạo UI header (coin và settings)
        HeaderUI.createHeaderUI(this, width, height);

        // Tạo tiêu đề game với gradient text
        GradientText.createGameTitle(this, 'DUNGEON CARD', width / 2, height * 0.18);

        // Tạo container có 3 hình ảnh kiểu xòe bài
        this.createCardSpreadContainer(width / 2, height * 0.5);

        // Tạo nút library
        this.createButton(width / 2 - width * 0.3, height * 0.8, 'library', 'Thư viện', 'LibraryScene');

        // Tạo nút Start Game compass 
        this.createButton(width / 2, height * 0.8, 'compass', 'Thám hiểm', 'MapScenes');
        // Tạo nút equip Game
        this.createButton(width / 2 + width * 0.3, height * 0.8, 'equip', 'Trang bị', 'EquipScene');

        // Tạo nút Test Graphics
        // this.createButton(width / 2, height * 0.7, 'sword', 'Test Graphics', 'TestGraphicsRenderTexture');

        // Nút Options - đặt ở 75% height
        const optionsButton = this.add.text(width / 2, height * 0.95, 'Test dev', {
            fontSize: '24px',
            color: '#95a5a6',
            fontFamily: 'Arial',
            stroke: '#2c3e50',
            strokeThickness: 1
        }).setOrigin(0.5);
        optionsButton.on('pointerdown', () => {
            // Chuyển qua LoadingScene để load assets cho scene đích
            this.scene.stop('GameScene');
            this.scene.start('LoadingScene', { targetScene: 'GameScene' });
        });
        optionsButton.setInteractive({ useHandCursor: true });
        optionsButton.on('pointerover', () => {
            optionsButton.setStyle({ color: '#7f8c8d' });
        });
        optionsButton.on('pointerout', () => {
            optionsButton.setStyle({ color: '#95a5a6' });
        });
    }

    createButton(x: number, y: number, iconName: string, buttonText: string, sceneName: string): void {
        // Tạo container cho nút
        const button = this.add.container(x, y);

        // Icon
        const icon = this.add.image(0, 20, 'item', iconName);
        icon.setDisplaySize(180, 180);

        // Text - mặc định ẩn
        const text = this.add.text(0, -80, buttonText, {
            fontSize: '28px',
            color: '#ffffffff',
            fontFamily: 'Arial',
            stroke: '#000000ff',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Ẩn text mặc định
        text.setAlpha(0);

        button.add([icon, text]);

        // Làm cho nút có thể click - điều chỉnh theo kích thước icon 180x180
        button.setInteractive(new Phaser.Geom.Rectangle(-90, -90, 180, 180), Phaser.Geom.Rectangle.Contains);

        button.on('pointerdown', () => {
            // Chuyển qua LoadingScene để load assets cho scene đích
            this.scene.start('LoadingScene', { targetScene: sceneName });
        });

        // Hiệu ứng hover - hiện text với fade in
        button.on('pointerover', () => {
            this.tweens.add({
                targets: text,
                alpha: 1,
                duration: 200,
                ease: 'Power2'
            });
            button.setScale(1.1);
        });

        button.on('pointerout', () => {
            this.tweens.add({
                targets: text,
                alpha: 0,
                duration: 200,
                ease: 'Power2'
            });
            button.setScale(1);
        });
    }

    /**
     * Tạo một card riêng lẻ với viền và hình ảnh
     * @param i - Index của card (0, 1, 2)
     * @param TextureCard - Texture của card
     * @param cardWidth - Chiều rộng của card
     * @param cardHeight - Chiều cao của card
     * @param spacing - Khoảng cách giữa các card
     * @param rotationAngles - Mảng các góc xoay
     * @returns Container của card
     */
    createIndividualCard(i: number, TextureCard: string, cardWidth: number, cardHeight: number, spacing: number, rotationAngles: number[]): Phaser.GameObjects.Container {
        // Tính toán vị trí để tạo hiệu ứng xòe bài
        const offsetX = (i - 1) * (cardWidth + spacing);
        const offsetY = Math.abs(i - 1) * 10; // Tạo độ cao khác nhau

        // Kiểm tra xem TextureCard có đuôi '-sprite' hay không
        const hasSpriteSuffix = TextureCard.endsWith('-sprite');

        // Tạo viền với màu khác nhau dựa trên loại card
        const cardBorder = this.add.graphics();
        cardBorder.lineStyle(4, hasSpriteSuffix ? 0xdcc06f : 0xffffff, 1);
        cardBorder.strokeRoundedRect(-(cardWidth + 2) / 2, -(cardHeight + 2) / 2, cardWidth + 2, cardHeight + 2, 20); // Bo tròn 12px

        // Tạo cardImage khác nhau dựa trên loại card
        let cardImage: Phaser.GameObjects.GameObject;
        if (hasSpriteSuffix) {
            // Nếu có đuôi '-sprite', dùng SpritesheetCharacter.create
            cardImage = SpritesheetWrapper.CharacterAnimation(
                this, 0, 0, TextureCard, cardWidth, cardHeight);
        } else {
            // Nếu không có đuôi '-sprite', dùng this.add.image
            cardImage = this.add.image(0, 0, 'character', TextureCard)
                .setDisplaySize(cardWidth, cardHeight);
        }

        // Tạo container cho mỗi hình ảnh
        const individualCardContainer = this.add.container(offsetX, offsetY);

        if (i === 1) {
            individualCardContainer.setScale(1.02);
            individualCardContainer.setPosition(offsetX, offsetY - 10);
        }

        // Thêm viền vào container trước, sau đó mới thêm cardImage
        individualCardContainer.add([cardBorder, cardImage]);

        // Xoay hình ảnh để tạo hiệu ứng xòe bài
        individualCardContainer.setRotation(Phaser.Math.DegToRad(rotationAngles[i]));

        return individualCardContainer;
    }

    /**
     * Tạo container có 3 hình ảnh kiểu xòe bài
     * @param x - Vị trí x của container
     * @param y - Vị trí y của container
     */
    createCardSpreadContainer(x: number, y: number): void {
        // Tạo container chính
        const cardContainer = this.add.container(x, y);

        // Kích thước mỗi hình ảnh (7:12 tỷ lệ)
        const cardWidth = 260; // 7 * 20
        const cardHeight = 445.7142; // 12 * 20

        // Khoảng cách giữa các hình ảnh
        const spacing = -180;

        // TextureCard là mảng các texture cards
        let TextureCard: string[] = [this.cards[this.cards.length - 1].id, this.cards[0].id, this.cards[1].id];

        // Lấy selectedCharacter từ localStorage
        let selectedCharacter = localStorage.getItem('selectedCharacter');
        if (selectedCharacter !== null) {
            try {
                // Parse selectedCharacter để lấy object card
                const selectedCardName = selectedCharacter;

                // Tìm index của card được chọn trong mảng cards
                const selectedIndex = this.cards.findIndex(card => card.id === selectedCardName);

                if (selectedIndex !== -1) {
                    // Tính toán các texture cards với phép tính modulo để tránh out of array
                    TextureCard = [this.cards[(selectedIndex - 1 + this.cards.length) % this.cards.length].id,
                    this.cards[selectedIndex].id,
                    this.cards[(selectedIndex + 1) % this.cards.length].id];

                    // Lấy CharacterLevel từ localStorage
                    let characterLevels = localStorage.getItem('characterLevel');
                    if (characterLevels !== null) {
                        try {
                            const levelData: Record<string, number> = JSON.parse(characterLevels);
                            // Kiểm tra level của từng nhân vật và thêm đuôi '-sprite' nếu level > 2
                            TextureCard = TextureCard.map(texture => {
                                const level = levelData[texture];
                                if (level && level > 2) {
                                    return texture + '-sprite';
                                }
                                return texture;
                            });
                        } catch (error) {
                            console.warn('Không thể parse CharacterLevel:', error);
                        }
                    }
                } else {
                    // Fallback nếu không tìm thấy card
                    console.warn('Không tìm thấy card');
                }
            } catch (error) {
                console.warn('Không tìm thấy card');
            }
        } else {
            // Fallback nếu không có selectedCharacter
            console.warn('Không tìm thấy card');
        }
        // Góc xoay cho hiệu ứng xòe bài
        const rotationAngles = [-15, 0, 15]; // Độ xoay của 3 hình

        // Tạo 3 hình ảnh với hiệu ứng xòe bài
        // Tạo card bên trái trước (i = 0), sau đó card phải (i = 2), cuối cùng card giữa (i = 1)
        const cardOrder = [0, 2, 1]; // Thay đổi thứ tự tạo để card giữa nổi lên trên
        const cardContainers: Phaser.GameObjects.Container[] = []; // Lưu trữ các card container để xử lý hover

        cardOrder.forEach((i) => {
            const individualCardContainer = this.createIndividualCard(i, TextureCard[i], cardWidth, cardHeight, spacing, rotationAngles);

            // Thêm vào container chính
            cardContainer.add(individualCardContainer);

            // Lưu trữ card container theo thứ tự thực tế
            cardContainers.push(individualCardContainer);
        });

        // Thêm hiệu ứng hover cho toàn bộ cardContainer
        cardContainer.setInteractive(new Phaser.Geom.Rectangle(-200, -200, 400, 400), Phaser.Geom.Rectangle.Contains);

        cardContainer.on('pointerover', () => {
            // Khi hover, chỉ thay đổi rotation, không thay đổi position
            const hoverRotationAngles = [-18, 18, 0];
            const newOffsetX = [-120, 120, 0];
            const newOffsetY = [0, 0, -30];
            const newScale = [1.02, 1.02, 1.02];
            // Cập nhật từng card theo thứ tự thực tế trong container
            cardContainers.forEach((cardContainer, index) => {

                const newRotation = Phaser.Math.DegToRad(hoverRotationAngles[index]);

                // Animation mượt mà - chỉ thay đổi rotation
                this.tweens.add({
                    targets: cardContainer,
                    x: newOffsetX[index],
                    y: newOffsetY[index],
                    rotation: newRotation,
                    scale: newScale[index],
                    duration: 300,
                    ease: 'Power2'
                });
            });
        });

        cardContainer.on('pointerout', () => {
            // Khi không hover, trở về trạng thái ban đầu
            const originalRotationAngles = [-15, 15, 0];
            const originalOffsetX = [-80, 80, 0];
            const originalOffsetY = [0, 0, -20];
            const originalScale = [1, 1, 1.02];
            // Cập nhật từng card về rotation ban đầu
            cardContainers.forEach((cardContainer, index) => {

                const originalRotation = Phaser.Math.DegToRad(originalRotationAngles[index]);
                // Animation mượt mà về rotation ban đầu
                this.tweens.add({
                    targets: cardContainer,
                    rotation: originalRotation,
                    x: originalOffsetX[index],
                    y: originalOffsetY[index],
                    scale: originalScale[index],
                    duration: 300,
                    ease: 'Power2'
                });
            });
        });

        cardContainer.on('pointerdown', () => {
            // TODO: Thêm logic xử lý khi click vào card container
            // this.scene.start('SelectCharacterScene');
            this.scene.start('LoadingScene', { targetScene: 'SelectCharacterScene' });
        });
    }
}
