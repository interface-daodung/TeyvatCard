import Phaser from 'phaser';
import { GradientText } from '../utils/GradientText.js';
import { HeaderUI } from '../utils/HeaderUI.js';
import { localizationManager } from '../utils/LocalizationManager.js';
import libraryCardsData from '../data/libraryCards.json';

interface CardData {
    type: string;
    id: string;
    name: string;
    description: string;
    cardType?: string;
    category?: string;
    clan?: string;
    element?: string;
    [key: string]: any;
}

interface ContainerWithCardData extends Phaser.GameObjects.Container {
    cardIndex?: number;
    cardData?: CardData | null;
}

// === BẢNG MÀU CHỦ ĐẠO ===
const COLOR_LIGHT = 0x96576a;      // Màu sáng (nâu nhạt) - dùng cho viền, thumb slider
const COLOR_DARK = 0x1f0614;       // Màu tối (nâu rất đậm) - dùng cho nền thẻ, track slider

export default class LibraryScene extends Phaser.Scene {
    public cardInfoDialog?: Phaser.GameObjects.Container;
    private escKey?: Phaser.Input.Keyboard.Key;

    constructor() {
        super({ key: 'LibraryScene' });
    }

    preload(): void {
        // Load ảnh empty cho thẻ
        this.load.image('empty', 'assets/images/cards/empty.webp');
    }

    create(): void {
        const { width, height } = this.scale;

        // Background
        this.add.image(width / 2, height / 2, 'background');

        // Thêm overlay tối để làm nổi bật màn chơi
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000).setAlpha(0.5);

        // Tiêu đề
        GradientText.createGameTitle(this, 'Library Cards', width / 2, height * 0.12);

        // Tạo UI header (coin và settings)
        HeaderUI.createHeaderUI(this, width, height);

        // Tạo panel con trước
        const cardPanel = this.createCardPanel();

        // Tạo scrollable panel với logic mới
        const panel = (this as any).rexUI.add.scrollablePanel({
            // === VỊ TRÍ VÀ KÍCH THƯỚC ===
            x: width / 2,                    // Vị trí X (giữa màn hình)
            y: height * 0.52,                 // Vị trí Y (60% từ trên xuống)
            height: height * 0.7,            // Chiều cao panel (60% chiều cao màn hình)
            width: width * 0.9,

            // === CHẾ ĐỘ CUỘN ===
            scrollMode: 'y',                 // Chỉ cho phép cuộn theo chiều dọc ('y', 'x', hoặc 'xy')

            // === NỀN PANEL ===
            background: (this as any).rexUI.add.roundRectangle({
                strokeColor: COLOR_LIGHT,    // Màu viền nền
                radius: 10                   // Độ bo góc nền
            }),

            // === PANEL NỘI DUNG ===
            panel: {
                child: cardPanel,            // Nội dung chính (grid thẻ)
                mask: { padding: 10 }        // Vùng che nội dung (padding 1px)
            },

            // === THANH CUỘN (SLIDER) ===
            slider: {
                track: (this as any).rexUI.add.roundRectangle({
                    width: 20,               // Chiều rộng thanh track
                    radius: 10,              // Độ bo góc track
                    color: COLOR_DARK        // Màu thanh track
                }),
                thumb: (this as any).rexUI.add.roundRectangle({
                    radius: 13,              // Độ bo góc thumb (nút kéo)
                    color: COLOR_LIGHT       // Màu thumb
                })
            },

            // === CUỘN BẰNG CHUỘT ===
            mouseWheelScroller: {
                focus: false,                // Không cần focus để cuộn
                speed: 0.1                   // Tốc độ cuộn (0.1 = chậm, 1.0 = bình thường)
            },

            // === HỖ TRỢ TOUCH ===
            touchScroll: true,               // Bật touch scroll
            touchScrollBehavior: 'pan',      // Hành vi touch scroll

            // === KHOẢNG CÁCH GIỮA CÁC PHẦN ===
            space: {
                left: 20,                    // Khoảng cách trái
                right: 20,                   // Khoảng cách phải
                top: 20,                     // Khoảng cách trên
                bottom: 20,                  // Khoảng cách dưới
                panel: 5,                    // Khoảng cách với panel
            }
        })
            .layout()

            // === THIẾT LẬP TƯƠNG TÁC CHO CHILDREN ===
            .setChildrenInteractive({
                targets: cardPanel.children  // Sử dụng tất cả cardContainer
            })

            // === XỬ LÝ CLICK EVENT ===
            .on('child.click', (child: ContainerWithCardData) => {
                if (child.cardData) {
                    // Hiển thị dialog thông tin card
                    this.showCardInfoDialog(child.cardData);
                }
                // child chính là card container được click
            });

        // Nút quay về Menu
        this.createBackButton(width, height);
    }


    createBackButton(width: number, height: number): void {
        // Nút quay về Menu
        const backButton = this.add.text(width * 0.5, height * 0.9, localizationManager.t('back_short'), {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            backgroundColor: '#622945',
            padding: { x: 25, y: 12 }
        }).setOrigin(0.5);

        // Làm cho nút có thể click
        backButton.setInteractive({ useHandCursor: true });

        // Hiệu ứng hover
        backButton.on('pointerover', () => {
            backButton.setScale(1.1);
            backButton.setTint(0xd1d1d1);
        });

        backButton.on('pointerout', () => {
            backButton.setScale(1);
            backButton.clearTint();
        });

        // Event click
        backButton.on('pointerdown', () => {
            // Chuyển về MenuScene
            this.scene.start('MenuScene');
        });
    }

    createCardPanel(): any {
        // Tạo sizer chính (container dọc)
        const panel = (this as any).rexUI.add.sizer({
            orientation: 'y',                    // Sắp xếp theo chiều dọc (y-axis)
            space: { item: 30 }                 // Khoảng cách giữa các item (10px)
        });

        // Lấy tất cả cards từ libraryCardsData
        const allCards = this.getAllCardsFromData();

        // === TẠO LƯỚI ĐỘNG KHÔNG GIỚI HẠN ===
        const cardsPerRow = 3;
        
        // Ưu tiên hiển thị coin trước, sau đó là các cards khác
        const coinCards = allCards.filter(card => card.cardType === 'coin');
        const otherCards = allCards.filter(card => card.cardType !== 'coin');
        
        // Sắp xếp lại: coin trước, sau đó là cards khác
        const sortedCards = [...coinCards, ...otherCards];
        
        // Hiển thị tất cả cards
        const cardsToShow = sortedCards;
        const totalRows = Math.ceil(cardsToShow.length / cardsPerRow);
        
        
        for (let row = 0; row < totalRows; row++) {
            // Tạo sizer cho mỗi hàng (container ngang)
            const rowSizer = (this as any).rexUI.add.sizer({
                orientation: 'x',                // Sắp xếp theo chiều ngang (x-axis)
                space: { item: 30 }             // Khoảng cách giữa các thẻ (10px)
            });

            // === THÊM CARDS VÀO HÀNG NÀY ===
            const startIndex = row * cardsPerRow;
            const endIndex = Math.min(startIndex + cardsPerRow, cardsToShow.length);
            
            for (let col = 0; col < cardsPerRow; col++) {
                const cardIndex = startIndex + col;
                
                // Luôn tạo card, nhưng ẩn nếu không có dữ liệu
                if (cardIndex < cardsToShow.length) {
                    const cardData = cardsToShow[cardIndex];
                    const cardContainer = this.createCard(cardIndex + 1, cardData);
                    rowSizer.add(cardContainer);
                } else {
                    // Tạo card trống và ẩn đi
                    const emptyContainer = this.createCard(cardIndex + 1, null);
                    emptyContainer.setVisible(false); // Ẩn card trống
                    rowSizer.add(emptyContainer);
                }
            }

            // Thêm hàng vào panel chính
            panel.add(rowSizer);
        }

        return panel;
    }

    getAllCardsFromData(): CardData[] {
        const allCards: CardData[] = [];
        
        // Duyệt qua tất cả các loại card trong libraryCardsData
        const cardsData = libraryCardsData as unknown as Record<string, CardData[]>;
        Object.keys(cardsData).forEach(cardType => {
            const cardsOfType = cardsData[cardType];
            
            // Xử lý đặc biệt cho coin - tạo 7 coin cho 7 nguyên tố
            if (cardType === 'coin' && cardsOfType.length > 0) {
                const coinData = cardsOfType[0]; // Lấy dữ liệu coin đầu tiên
                
                // Kiểm tra nếu coin có cấu trúc đặc biệt với name/id/description là object
                if (coinData.name && typeof coinData.name === 'object' && !Array.isArray(coinData.name)) {
                    const elements = Object.keys(coinData.name as Record<string, string>);
                    
                    // Tạo 7 coin riêng biệt cho từng nguyên tố
                    elements.forEach((element) => {
                        const coinElement: CardData = {
                            type: coinData.type,
                            rarity: (coinData as any).rarity,
                            name: (coinData.name as unknown as Record<string, string>)[element],
                            id: (coinData.id as unknown as Record<string, string>)[element],
                            description: (coinData.description as unknown as Record<string, string>)[element],
                            element: element,
                            className: (coinData as any).className,
                            cardType: cardType
                        };
                        allCards.push(coinElement);
                    });
                } else {
                    // Coin thông thường (fallback)
                    cardsOfType.forEach(card => {
                        allCards.push({
                            ...card,
                            cardType: cardType
                        });
                    });
                }
            } else {
                // Các loại card khác xử lý bình thường
                cardsOfType.forEach(card => {
                    allCards.push({
                        ...card,
                        cardType: cardType // Thêm loại card vào dữ liệu
                    });
                });
            }
        });
        
        return allCards;
    }

    createCard(cardIndex: number, cardData: CardData | null, width = 160, height = 274.3): ContainerWithCardData {
        
        // === NỀN THẺ ===
        const background = (this as any).rexUI.add.roundRectangle({
            x: 0, y: 0,                          // Vị trí (0,0) - sẽ được đặt bởi container
            width: width + 4,                        // Chiều rộng thẻ (từ tham số)
            height: height + 4,                      // Chiều cao thẻ (từ tham số)
            strokeColor: 0xffffff,            // Màu viền thẻ
            strokeThickness: 2,
            radius: Math.min(width, height) * 0.08, // Độ bo góc scale theo kích thước
        });

        // === ẢNH THẺ ===
        let cardImage: Phaser.GameObjects.Image;
        if (cardData) {
            try {
                // Tạo atlas key dựa trên loại card và thông tin từ JSON
                let atlasKey = cardData.type;
                if (cardData.type === 'weapon') {
                    // Với weapon, sử dụng category từ JSON (ví dụ: 'sword', 'polearm', etc.)
                    atlasKey = 'weapon-' + cardData.category;
                } else if (cardData.type === 'enemy') {
                    // Với enemy, sử dụng clan từ JSON
                    atlasKey = 'enemy-' + cardData.clan;
                }
                // Các loại khác (food, trap, treasure, bomb) giữ nguyên type làm atlas key
                
                // Kiểm tra xem atlas có tồn tại không
                if (this.textures.exists(atlasKey)) {
                    // Kiểm tra xem frame có tồn tại không
                    const texture = this.textures.get(atlasKey);
                    const frameNames = texture.getFrameNames();
                    
                    if (frameNames.includes(cardData.id)) {
                        // Sử dụng ảnh thực tế từ atlas
                        cardImage = this.add.image(0, 0, atlasKey, cardData.id)
                            .setDisplaySize(width, height);
                    } else {
                        // Fallback về ảnh empty
                        cardImage = this.add.image(0, 0, 'empty')
                            .setDisplaySize(width, height);
                    }
                } else {
                    // Fallback về ảnh empty
                    cardImage = this.add.image(0, 0, 'empty')
                        .setDisplaySize(width, height);
                }
            } catch (error) {
                // Fallback về ảnh empty
                cardImage = this.add.image(0, 0, 'empty')
                    .setDisplaySize(width, height);
            }
        } else {
            // Sử dụng ảnh empty nếu không có dữ liệu
            cardImage = this.add.image(0, 0, 'empty')
                .setDisplaySize(width, height);
        }

        // === TÊN THẺ ===
        const cardName = cardData ? cardData.name : `Card ${cardIndex}`;
        const text = this.add.text(0, height * 0.35, cardName, {  // Vị trí text (dưới giữa thẻ)
            fontSize: Math.max(8, width * 0.12), // Kích thước chữ scale theo width
            color: '#ffffff',                     // Màu chữ trắng
            wordWrap: { width: 175 },
            fontFamily: 'Arial',                 // Font chữ
            stroke: '#000000',                   // Màu viền chữ (đen)
            strokeThickness: Math.max(1, width * 0.02) // Độ dày viền chữ scale theo width
        }).setOrigin(0.5);                       // Căn giữa text

        // === CONTAINER CHỨA TẤT CẢ ===
        const child = (this.add.container(0, 0, [cardImage, background, text]) as ContainerWithCardData);
        child.setSize(width, height);

        // Lưu cardIndex và cardData vào container để có thể truy cập sau này
        child.cardIndex = cardIndex;
        child.cardData = cardData;
        child.name = `card_${cardIndex}`;  // Thêm name để dễ nhận diện

        return child;
    }

    showCardInfoDialog(cardData: CardData): void {
        // Hiển thị dialog thông tin thẻ
        // Background mờ chặn tương tác với game bên dưới
        // Dialog chỉ có thể đóng bằng nút X hoặc phím ESC

        // Xóa dialog cũ nếu có
        if (this.cardInfoDialog) {
            this.cardInfoDialog.destroy();
        }
        const { width, height } = this.scale;
        // Tạo container cho dialog ở giữa màn hình
        this.cardInfoDialog = this.add.container(width / 2, height / 2);
        this.cardInfoDialog.setDepth(120);

        // Tạo background mờ - đặt trong container với gốc tọa độ tương đối
        const bg = this.add.rectangle(-width / 2, -height / 2, width, height, 0x000000, 0.7)
            .setOrigin(0, 0)
            .setInteractive();

        // Tạo background cho dialog - sử dụng màu chủ đạo của game với góc bo tròn
        const dialogBg = this.add.graphics();
        dialogBg.fillStyle(0x800080, 0.95);
        dialogBg.lineStyle(3, 0xff3366);
        dialogBg.fillRoundedRect(-200, -150, 400, 300, 20);
        dialogBg.strokeRoundedRect(-200, -150, 400, 300, 20);

        // Tạo ảnh thẻ (scale nhỏ hơn)
        let cardImg: Phaser.GameObjects.Image;
        try {
            // Tạo atlas key dựa trên loại card và thông tin từ JSON
            let atlasKey = cardData.type;
            if (cardData.type === 'weapon') {
                atlasKey = 'weapon-' + cardData.category;
            } else if (cardData.type === 'enemy') {
                atlasKey = 'enemy-' + cardData.clan;
            }
            
            if (this.textures.exists(atlasKey) && this.textures.get(atlasKey).getFrameNames().includes(cardData.id)) {
                cardImg = this.add.image(0, 0, atlasKey, cardData.id);
            } else {
                cardImg = this.add.image(0, 0, 'empty');
            }
        } catch (error) {
            cardImg = this.add.image(0, 0, 'empty');
        }
        cardImg.setDisplaySize(80, 137.14);

        // Tạo text cho tên thẻ
        const nameText = this.add.text(0, -120, cardData.name, {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial'
        });
        nameText.setOrigin(0.5);

        // Tạo text cho loại thẻ
        const typeText = this.add.text(0, -100, localizationManager.t('type_label', { type: localizationManager.t(cardData.type) || cardData.type }), {
            fontSize: '16px',
            color: '#ffb3d9',
            fontFamily: 'Arial'
        });
        typeText.setOrigin(0.5);

        // Tạo text cho mô tả thẻ
        const descText = this.add.text(0, 100, cardData.description, {
            fontSize: '14px',
            color: '#ecf0f1',
            fontFamily: 'Arial',
            wordWrap: { width: 300 },
            align: 'center'
        });
        descText.setOrigin(0.5);

        // Tạo nút đóng với màu theme và góc bo tròn
        const closeBtn = this.add.graphics();
        closeBtn.fillStyle(0xff3366);
        closeBtn.fillRoundedRect(-30, -25, 60, 50, 8);

        // Đặt vị trí của nút
        closeBtn.setPosition(0, 190);

        const closeText = this.add.text(0, 190, localizationManager.t('close'), {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial'
        });
        closeText.setOrigin(0.5);

        // Làm cho nút đóng có thể click và có hiệu ứng hover
        closeBtn.setInteractive(new Phaser.Geom.Rectangle(-30, -25, 60, 50), Phaser.Geom.Rectangle.Contains);

        // Hiệu ứng hover
        closeBtn.on('pointerover', () => {
            closeBtn.clear();
            closeBtn.setScale(1.2);
            closeBtn.fillStyle(0xff6b9d); // Màu sáng hơn khi hover
            closeBtn.fillRoundedRect(-30, -25, 60, 50, 8);
        });

        closeBtn.on('pointerout', () => {
            closeBtn.clear();
            closeBtn.setScale(1);
            closeBtn.fillStyle(0xff3366); // Màu gốc khi không hover
            closeBtn.fillRoundedRect(-30, -25, 60, 50, 8);
        });

        closeBtn.on('pointerdown', () => {
            this.hideCardInfoDialog();
        });

        // Thêm tất cả elements vào dialog container
        this.cardInfoDialog.add([bg, dialogBg, cardImg, nameText, typeText, descText, closeBtn, closeText]);

        // Thêm vào scene
        this.add.existing(this.cardInfoDialog);

        // Chỉ có 2 cách để đóng dialog:
        // 1. Click vào nút X (closeBtn)
        // 2. Nhấn phím ESC
        this.escKey = this.input.keyboard.addKey('ESC');
        this.escKey.on('down', () => {
            this.hideCardInfoDialog();
        });
    }

    hideCardInfoDialog(): void {
        if (this.cardInfoDialog) {
            this.cardInfoDialog.destroy();
            this.cardInfoDialog = undefined;
        }
        if (this.escKey) {
            this.escKey.destroy();
            this.escKey = undefined;
        }
    }
}
