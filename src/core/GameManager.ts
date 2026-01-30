import Phaser from 'phaser';
import CalculatePositionCard from '../utils/CalculatePositionCard.js';
import CardManager from './CardManager.js';
import AnimationManager from './AnimationManager.js';
import PriorityEmitter from '../utils/PriorityEmitter.js';

interface MovementItem {
    from: number;
    to: number;
}

interface SceneWithGameManager extends Phaser.Scene {
    gameManager?: GameManager;
    stageId?: string;
    coinText?: Phaser.GameObjects.Text;
    sellButton?: {
        hideButton: () => void;
    };
    itemEquipment?: any[];
    scale: Phaser.Scale.ScaleManager;
    tweens: Phaser.Tweens.TweenManager;
    add: Phaser.GameObjects.GameObjectFactory;
}

interface Card extends Phaser.GameObjects.Container {
    CardEffect?: () => boolean;
    ProgressDestroy?: () => void;
    processCreation?: () => void;
    index?: number;
    name?: string;
    type?: string;
}

// Khởi tạo instance

export default class GameManager {
    public scene: SceneWithGameManager;
    public coin: number;
    public OnCompleteMoveCount: number;
    public isGameOver: boolean;
    public highScore: number;
    public cardManager: CardManager;
    public emitter: PriorityEmitter;
    public animationManager: AnimationManager;
    public itemEquipment?: any[];

    constructor(scene: SceneWithGameManager) {
        this.scene = scene;
        this.coin = 0;
        this.OnCompleteMoveCount = 0;
        this.isGameOver = false;
        // Khởi tạo highScores object từ localStorage
        this.highScore = this.getHighScore();

        // Tạo CardManager mới cho mỗi game session
        this.cardManager = new CardManager(scene);

        this.emitter = new PriorityEmitter();

        // Tạo AnimationManager để quản lý animation (sẽ được khởi tạo với scene sau)
        this.animationManager = new AnimationManager(scene);
    }

    setItemEquipment(itemEquipment: any[]): void {
        this.itemEquipment = itemEquipment;
    }


    /**
     * Di chuyển card từ vị trí cũ sang vị trí mới
     * @param index - Vị trí card cũ
     */
    moveCharacter(index: number): void {

        // Nếu đang xử lý animation thì không di chuyển
        if (this.animationManager.isProcessing || this.OnCompleteMoveCount !== 0) {
            return;
        }

        const characterIndex = this.cardManager.getCharacterIndex();

        if (CalculatePositionCard.isValidMove(characterIndex, index)) {
            const card = this.cardManager.getCard(index);
            if (card && (card as Card).CardEffect && (card as Card).CardEffect()) {

                // Emit event completeMove để tất cả card có thể xử lý
                this.emitter.emit('completeMove');
                return;
            }
            if (this.isGameOver) {
                return;
            }
            const movement = CalculatePositionCard.calculateMovement(characterIndex, index);

            // hủy card cũ ở vị trí index
            const cardToDestroy = this.cardManager.getCard(index);
            if (cardToDestroy && (cardToDestroy as Card).ProgressDestroy) {
                (cardToDestroy as Card).ProgressDestroy();
            }

            this.animationManager.startMoveAnimation(movement, () => {

                movement.forEach(move => {
                    // Sử dụng hàm moveCard an toàn từ CardManager
                    this.cardManager.moveCard(move.from, move.to);
                });

                // Tạo card mới ở vị trí cuối của movement
                const newCardIndex = movement[movement.length - 1].from;
                const newCard = this.cardManager.cardFactory.createRandomCard(this.scene, newCardIndex) as Card;
                if (newCard && newCard.processCreation) {
                    this.cardManager.addCard(newCard, newCardIndex).processCreation();
                }
                // Emit event completeMove để tất cả card có thể xử lý
                this.emitter.emit('completeMove');
            });

        }
    }

    /**
     * Lấy highScore của stage hiện tại
     */
    getHighScore(): number {
        const stageId = this.scene.stageId;

        let saved = localStorage.getItem('highScores');

        if (saved === null) {
            // Tạo object mới với stageId từ dungeonList = 0
            const newHighScores = {};

            // Lưu vào localStorage
            const json_highScores = JSON.stringify(newHighScores);
            localStorage.setItem('highScores', json_highScores);
            saved = json_highScores;
        }

        const highScores: Record<string, number> = JSON.parse(saved) || {};
        return highScores[stageId || ''] || 0;
    }

    /**
     * Set highScore cho stage hiện tại
     */
    setHighScore(score: number): void {
        const stageId = this.scene.stageId;

        let saved = localStorage.getItem('highScores');
        let highScores: Record<string, number> = {};

        if (saved === null) {
            // Tạo object mới với stageId từ dungeonList = 0
            highScores = {};
        } else {
            highScores = JSON.parse(saved) || {};
        }

        // Cập nhật highScore cho stage hiện tại
        if (stageId) {
            highScores[stageId] = score;
        }

        // Lưu vào localStorage
        localStorage.setItem('highScores', JSON.stringify(highScores));
        console.log(`GameManager: High score set for ${stageId}: ${score}`);
    }


    /**
     * Thêm coin vào coin
     */
    addCoin(points: number, energy: number | null = null): void {
        this.coin += points;

        if (energy && this.itemEquipment) {
            this.itemEquipment.forEach(item => {
                if (item.cooldowninning) {
                    item.cooldowninning(energy);
                }
            });
        }
        // Cập nhật hiển thị coin trong GameScene
        if (this.scene && this.scene.coinText) {
            this.scene.coinText.setText(`🪙${this.coin}`);
            console.log(`GameManager: UI coin updated to ${this.coin}`);
        } else {
            console.warn(`GameManager: Cannot update coin UI - scene: ${!!this.scene}, coinText: ${!!this.scene?.coinText}`);
        }

        console.log(`GameManager: Added ${points} coins, total: ${this.coin}`);
    }

    gameOver(): void {
        console.log('gameOver!');
        this.emitter.emit('gameOver');
        this.isGameOver = true;
        if (this.scene.sellButton) {
            this.scene.sellButton.hideButton();
        }

        // Lấy tên character hiện tại
        const characterName = (this.cardManager.CardCharacter as any)?.constructor?.DEFAULT?.id;

        if (characterName) {
            // Lấy characterHighScore từ localStorage
            let characterHighScores: Record<string, number> = JSON.parse(localStorage.getItem('characterHighScores') || '{}') || {};

            // Kiểm tra và cập nhật highScore cho character
            if (!characterHighScores[characterName] || this.coin > characterHighScores[characterName]) {
                characterHighScores[characterName] = this.coin;
                localStorage.setItem('characterHighScores', JSON.stringify(characterHighScores));
                console.log(`GameManager: New character high score for ${characterName}: ${this.coin}`);
            }
        }

        // Kiểm tra và cập nhật highScore cho stage hiện tại
        if (this.coin > this.highScore) {
            this.setHighScore(this.coin);
            this.highScore = this.coin; // Cập nhật highScore local
            console.log(`GameManager: New high score for ${this.scene.stageId}: ${this.coin}`);
        }

        // Cộng dồn coin vào totalCoin trong localStorage
        const currentTotalCoin = parseInt(localStorage.getItem('totalCoin') || '0') || 0;
        const newTotalCoin = currentTotalCoin + this.coin;
        localStorage.setItem('totalCoin', newTotalCoin.toString());

        // Destroy từng thẻ một cách tuần tự với delay 200ms

        this.animationManager.startGameOverAnimation(CalculatePositionCard.
            shuffleArray(this.cardManager.getAllCards()) as Card[], () => {
                this.showGameOverDialog();
            });

    }

    /**
     * Hiển thị dialog game over
     */
    showGameOverDialog(): void {
        // Tạo dialog game over
        const dialog = this.scene.add.container(0, 0);

        // Sử dụng scene.scale để lấy kích thước màn hình
        const { width, height } = this.scene.scale;

        // Tạo background mờ - đặt ở vị trí (0,0) để che toàn bộ màn hình
        const background = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.8)
            .setOrigin(0, 0)
            .setInteractive();
        dialog.add(background);

        // Container chính cho dialog - đặt ở giữa màn hình
        const dialogContainer = this.scene.add.container(width / 2, height / 2);

        // Background cho dialog với màu chủ đề mới
        const dialogBg = this.scene.add.graphics();
        dialogBg.fillStyle(0x1f0614, 0.95);
        dialogBg.lineStyle(3, 0x622945, 1);
        dialogBg.fillRoundedRect(-200, -150, 400, 300, 20);
        dialogBg.strokeRoundedRect(-200, -150, 400, 300, 20);
        dialogContainer.add(dialogBg);

        // Tiêu đề với màu chữ tương phản cao
        const title = this.scene.add.text(0, -100, 'GAME OVER', {
            fontSize: '32px',
            color: '#e74c3c',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5);
        dialogContainer.add(title);

        // Thông tin điểm số với màu chữ tương phản
        const scoreText = this.scene.add.text(0, -50, `Coin: ${this.coin}`, {
            fontSize: '24px',
            color: '#cbbd1b',
            fontFamily: 'Arial, sans-serif'
        });
        scoreText.setOrigin(0.5);
        dialogContainer.add(scoreText);

        // High score với màu chữ tương phản
        const highScoreText = this.scene.add.text(0, -10, `High Score: ${this.highScore}`, {
            fontSize: '20px',
            color: '#e0e0e0',
            fontFamily: 'Arial, sans-serif'
        });
        highScoreText.setOrigin(0.5);
        dialogContainer.add(highScoreText);

        // Nút Restart với màu chữ tương phản
        const restartButton = this.scene.add.text(0, 50, 'Restart', {
            fontSize: '24px',
            color: '#2ecc71',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        });
        restartButton.setOrigin(0.5);
        restartButton.setInteractive();
        restartButton.on('pointerdown', () => {
            this.scene.scene.restart();
            dialog.destroy();
        });
        restartButton.on('pointerover', () => {
            restartButton.setTint(0xd1d1d1);
        });
        restartButton.on('pointerout', () => {
            restartButton.clearTint();
        });
        dialogContainer.add(restartButton);

        // Nút Menu với màu chữ tương phản
        const menuButton = this.scene.add.text(0, 100, 'Menu', {
            fontSize: '24px',
            color: '#f0f0f0',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        });
        menuButton.setOrigin(0.5);
        menuButton.setInteractive();
        menuButton.on('pointerdown', () => {
            this.scene.scene.start('MenuScene');
            dialog.destroy();
        });
        menuButton.on('pointerover', () => {
            menuButton.setTint(0xd1d1d1);
        });
        menuButton.on('pointerout', () => {
            menuButton.clearTint();
        });
        dialogContainer.add(menuButton);

        // Thêm vào scene
        dialog.add(dialogContainer);
        this.scene.add.existing(dialog);

        // Làm cho dialog có thể tương tác
        dialog.setDepth(100);
    }
}
