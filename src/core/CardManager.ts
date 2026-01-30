import Phaser from 'phaser';
import cardFactory from '../modules/CardFactory.js';

/** Card: Container + field/method dùng trong game. Không Omit type/name/setInteractive/disableInteractive để tương thích GameObject. */
interface Card extends Phaser.GameObjects.Container {
    index?: number;
    nameId?: string;
    resonance?: () => void;
    processCreation?: () => void;
}

interface SceneWithGameManager extends Phaser.Scene {
    gameManager?: {
        emitter: {
            on: (event: string, callback: () => void, priority?: number) => void;
        };
    };
    stageId?: string;
}

export default class CardManager {
    private scene: SceneWithGameManager;
    private gridSize: number;
    private cards: (Card | null)[];
    private cardWidth: number;
    private cardHeight: number;
    private spacing: number;
    private gridStartX: number;
    private gridStartY: number;
    public cardFactory: any; // CardFactory type sẽ được định nghĩa sau
    public CardCharacter: Card | null;

    constructor(scene: SceneWithGameManager) {
        this.scene = scene;
        // Lưới thẻ 3x3
        this.gridSize = 3;
        this.cards = new Array(9).fill(null); // 9 vị trí từ 0-8

        // Kích thước và spacing của card
        this.cardWidth = 160;
        this.cardHeight = 274.3;
        this.spacing = 16;

        // Vị trí bắt đầu của grid - sẽ được khởi tạo sau
        this.gridStartX = 0;
        this.gridStartY = 0;

        // Liên kết đến CardFactory singleton
        this.cardFactory = cardFactory;
        this.cardFactory.setCurrentStage(scene.stageId);

        this.CardCharacter = null;
    }

    /**
     * Khởi tạo grid coordinates với kích thước màn hình
     */
    initializeGridCoordinates(): void {
        if (this.scene && this.scene.scale) {
            const { width, height } = this.scene.scale;
            this.gridStartX = (width - (3 * this.cardWidth + 2 * this.spacing)) / 2;
            this.gridStartY = height * 0.23; // 23% height - giữa màn hình
        } else {
            console.warn('CardManager: Scene or scale not available, using default coordinates');
        }
    }

    /**
     * Thêm card vào vị trí cụ thể trong grid
     * // hàm này chưa dc dùng ở bất cứ đâu
     */
    addCard(card: Card, gridIndex: number): Card {
        if (gridIndex >= 0 && gridIndex < 9) {
            this.cards[gridIndex] = card;
        } else {
            console.warn(`CardManager: Invalid grid index ${gridIndex}`);
        }
        return card;
    }

    /**
     * Lấy card từ vị trí grid
     * // hàm này chưa dc dùng ở bất cứ đâu
     */
    getCard(gridIndex: number): Card | null {
        if (gridIndex >= 0 && gridIndex < 9) {
            return this.cards[gridIndex];
        }
        return null;
    }

    /**
     * Lấy tất cả cards
     * // hàm này chưa dc dùng ở bất cứ đâu
     */
    getAllCards(): Card[] {
        return this.cards.filter(card => card !== null) as Card[];
    }

    /**
     * Lấy tọa độ center của vị trí grid
     * // hàm này chưa dc dùng ở bất cứ đâu
     */
    getGridPositionCoordinates(gridIndex: number): { x: number; y: number } | null {
        if (gridIndex < 0 || gridIndex >= 9) {
            return null;
        }

        const row = Math.floor(gridIndex / this.gridSize);
        const col = gridIndex % this.gridSize;

        const x = this.gridStartX + col * (this.cardWidth + this.spacing) + this.cardWidth / 2;
        const y = this.gridStartY + row * (this.cardHeight + this.spacing) + this.cardHeight / 2;

        return { x, y };
    }

    /**
     * Khởi tạo và tạo deck với 9 cards
     */
    initializeCreateDeck(): void {
        // Khởi tạo grid coordinates trước
        this.initializeGridCoordinates();
        // Tạo card nhân vật tại vị trí 4
        const coord_start = this.getGridPositionCoordinates(4);
        if (!coord_start) {
            console.error('CardManager: Cannot get coordinates for position 4');
            return;
        }

        this.CardCharacter = this.cardFactory.createCharacter(this.scene, coord_start.x, coord_start.y, 4) as Card;
        this.addCard(this.CardCharacter, 4);

        // Tạo 9 cards mới
        for (let i = 0; i < 9; i++) {
            const coords = this.getGridPositionCoordinates(i);
            if (coords) {
                // Tạo card mới sử dụng CardFactory
                if (i === 4) continue;
                // Tạo card ngẫu nhiên
                const card = this.cardFactory.createRandomCard(this.scene, i) as Card;
                // Thêm card vào vị trí grid
                this.addCard(card, i);
            }
        }
        this.checkElementResonance();
        // Kiểm tra Element Resonance sau khi di chuyển card
        if (this.scene.gameManager) {
            this.scene.gameManager.emitter
                .on('completeMove', this.checkElementResonance.bind(this), 2);
        }
    }

    /**
     * Di chuyển card từ vị trí cũ sang vị trí mới một cách an toàn
     * @param fromIndex - Vị trí cũ
     * @param toIndex - Vị trí mới
     * @returns True nếu di chuyển thành công
     */
    moveCard(fromIndex: number, toIndex: number): boolean {
        if (fromIndex < 0 || fromIndex >= 9 || toIndex < 0 || toIndex >= 9) {
            console.warn(`CardManager: Invalid indices for move: ${fromIndex} -> ${toIndex}`);
            return false;
        }

        const card = this.cards[fromIndex];
        if (!card) {
            console.warn(`CardManager: No card at position ${fromIndex}`);
            return false;
        }

        // Cập nhật index của card
        card.index = toIndex;

        // Xóa card khỏi vị trí cũ
        this.cards[fromIndex] = null;

        // Thêm card vào vị trí mới
        this.addCard(card, toIndex);

        //console.log(`CardManager: Moved card ${card.type} from ${fromIndex} to ${toIndex}`);
        return true;
    }

    /**
     * Hoán đổi vị trí của hai card
     * @param fromIndex - Vị trí card thứ nhất
     * @param toIndex - Vị trí card thứ hai
     * @returns True nếu hoán đổi thành công
     */
    swapCard(fromIndex: number, toIndex: number): boolean {
        if (fromIndex < 0 || fromIndex >= 9 || toIndex < 0 || toIndex >= 9) {
            console.warn(`CardManager: Invalid indices for swap: ${fromIndex} <-> ${toIndex}`);
            return false;
        }

        const cardFrom = this.cards[fromIndex];
        const cardTo = this.cards[toIndex];

        if (!cardFrom || !cardTo) {
            console.warn(`CardManager: Missing card at position ${fromIndex} or ${toIndex}`);
            return false;
        }

        // Hoán đổi index của hai card
        const tempIndex = cardFrom.index;
        if (cardFrom.index !== undefined && cardTo.index !== undefined) {
            cardFrom.index = cardTo.index;
            cardTo.index = tempIndex;
        }

        // Hoán đổi vị trí trong array
        this.cards[fromIndex] = cardTo;
        this.cards[toIndex] = cardFrom;

        // Cập nhật vị trí hiển thị của hai card
        const coordsFrom = this.getGridPositionCoordinates(toIndex);
        const coordsTo = this.getGridPositionCoordinates(fromIndex);

        if (coordsFrom && coordsTo) {
            cardFrom.setPosition(coordsFrom.x, coordsFrom.y);
            cardTo.setPosition(coordsTo.x, coordsTo.y);
        }

        //console.log(`CardManager: Swapped cards ${cardFrom.type} and ${cardTo.type} between positions ${fromIndex} and ${toIndex}`);
        return true;
    }

    /**
     * Disable tất cả card để tránh nhận sự kiện khi đang di chuyển
     */
    disableAllCards(): void {
        const allCards = this.getAllCards();
        allCards.forEach(card => {
            if (card && card.disableInteractive) {
                card.disableInteractive();
                //console.log(`CardManager: Disabled card ${card.name} at position ${card.index}`);
            }
        });
        //console.log('CardManager: Disabled all cards');
    }

    /**
     * Enable lại tất cả card sau khi di chuyển hoàn thành
     */
    enableAllCards(): void {
        const allCards = this.getAllCards();
        allCards.forEach(card => {
            if (card && card.setInteractive) {
                card.setInteractive();
                //console.log(`CardManager: Enabled card ${card.name} at position ${card.index}`);
            }
        });
        //console.log('CardManager: Enabled all cards');
    }

    /**
     * Lấy index của card có type "character"
     * @returns Index của character card, -1 nếu không tìm thấy
     */
    getCharacterIndex(): number {
        // Kiểm tra this.CardCharacter.index
        if (this.CardCharacter && this.CardCharacter.index !== undefined) {
            const characterIndex = this.CardCharacter.index;

            // Kiểm tra xem card tại vị trí đó có type 'character' không
            if (this.cards[characterIndex] && this.cards[characterIndex]?.type === 'character') {
                return characterIndex;
            } else {
                console.error(`CardManager: Card tại vị trí ${characterIndex} không phải là character. Type: ${this.cards[characterIndex]?.type || 'undefined'}`);
                return -1;
            }
        } else {
            console.error('CardManager: CardCharacter.index không tồn tại hoặc undefined');
            return -1;
        }
    }

    /**
     * Kiểm tra Element Resonance trên lưới 3x3
     * Tìm các hàng hoặc cột có TOÀN BỘ 3 thẻ coin cùng id với đuôi "fragment"
     * Gọi hàm Resonance() cho các thẻ này, mỗi thẻ chỉ được gọi 1 lần
     */
    checkElementResonance(): number {
        const cardsToResonate = new Set<Card>(); // Lưu các card cần gọi Resonance()
        
        // BƯỚC 1: Kiểm tra tất cả hàng và cột để tìm các card cần xử lý
        // Kiểm tra các hàng (0-2)
        for (let row = 0; row < 3; row++) {
            const rowCards: Card[] = [];
            
            // Lấy các card trong hàng
            for (let col = 0; col < 3; col++) {
                const index = row * 3 + col;
                const card = this.cards[index];
                
                if (card && card.type === 'coin' && card.nameId && card.nameId.endsWith('fragment')) {
                    rowCards.push(card);
                }
            }
            
            // Kiểm tra xem có đúng 3 card cùng nameId trong hàng không
            if (rowCards.length === 3) {
                const firstCardNameId = rowCards[0].nameId;
                const allSameNameId = rowCards.every(card => card.nameId === firstCardNameId);
                
                if (allSameNameId && firstCardNameId) {
                    // Thêm các card vào danh sách cần xử lý
                    rowCards.forEach(card => {
                        cardsToResonate.add(card);
                    });
                    console.log(`✓ Element Resonance: Row ${row} with nameId ${firstCardNameId} triggered`);
                }
            }
        }
        
        // Kiểm tra các cột (0-2)
        for (let col = 0; col < 3; col++) {
            const colCards: Card[] = [];
            
            // Lấy các card trong cột
            for (let row = 0; row < 3; row++) {
                const index = row * 3 + col;
                const card = this.cards[index];
                
                if (card && card.type === 'coin' && card.nameId && card.nameId.endsWith('fragment')) {
                    colCards.push(card);
                }
            }
            
            // Kiểm tra xem có đúng 3 card cùng nameId trong cột không
            if (colCards.length === 3) {
                const firstCardNameId = colCards[0].nameId;
                const allSameNameId = colCards.every(card => card.nameId === firstCardNameId);
                
                if (allSameNameId && firstCardNameId) {
                    // Thêm các card vào danh sách cần xử lý
                    colCards.forEach(card => {
                        cardsToResonate.add(card);
                    });
                    console.log(`✓ Element Resonance: Column ${col} with nameId ${firstCardNameId} triggered`);
                }
            }
        }
        
        // BƯỚC 2: Gọi Resonance() cho tất cả card đã được xác định
        if (cardsToResonate.size > 0) {
            console.log(`Element Resonance: ${cardsToResonate.size} cards triggered`);
            cardsToResonate.forEach(card => {
                if (card.resonance) {
                    card.resonance();
                }
            });
        }
        
        return cardsToResonate.size; // Trả về số lượng card đã được xử lý
    }
    
}
