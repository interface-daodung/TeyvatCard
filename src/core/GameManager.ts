import Phaser from 'phaser';
import CalculatePositionCard from '../utils/CalculatePositionCard.js';
import { I18nText } from '../components/shared/index.js';
import CardManager from './CardManager.js';
import AnimationManager from './AnimationManager.js';
import PriorityEmitter from '../utils/PriorityEmitter.js';
import { themeManager } from './ThemeManager.js';
import { dataManager } from './DataManager.js';
import Card from '../modules/card/Card.js';
import { Log } from '../utils/Log.js';
import { soundManager } from './SoundManager.js';
import { ItemButton } from '../components/GameScene/index.js';

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

export interface IMove {
	from: number;
	to: number;
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
    public itemEquipment?: ItemButton[];

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
     * Di chuyển card: logic xong → apply state → enqueue animation (Promise) → emit completeMove khi xong.
     */
    moveCharacter(index: number): void {
        if (this.animationManager.isProcessing || this.OnCompleteMoveCount !== 0) {
            return;
        }

        const characterIndex = this.cardManager.getCharacterIndex();
        if (!CalculatePositionCard.isValidMove(characterIndex, index)) return;

        const card = this.cardManager.getCard(index) as Card | null;
        if (card?.CardEffect()) {
            dataManager.setFlag('cardAtOldCharacterPos', undefined);
            this.emitter.emit('completeMove');
            return;
        }
        if (this.isGameOver) return;

        const movement = CalculatePositionCard.calculateMovement(characterIndex, index);
        const cardToDestroy = this.cardManager.getCard(index) as Card | null;

        // 1) Apply state trước (không đợi animation)
        dataManager.setFlag('cardAtOldCharacterPos', this.cardManager.getCard(movement[1].from));
        this.cardManager.removeCard(index);
        movement.forEach((move: IMove) => this.cardManager.moveCard(move.from, move.to));
        const newCardIndex = movement[movement.length - 1].from;
        const newCard = this.cardManager.cardFactory.createRandomCard(this.scene, newCardIndex) as Card;
        this.cardManager.addCard(newCard, newCardIndex);

        // 2) Enqueue animation: destroy view → move tweens → creation; không dùng callback
        const destroyPromise = cardToDestroy?.view
            ? cardToDestroy.view.playDestroy()
            : Promise.resolve();
        this.animationManager.addToQueue(8, () =>
            destroyPromise
                .then(() => this.animationManager.runMoveTweens(movement))
                .then(() => newCard.view?.playCreation(this.isGameOver) ?? Promise.resolve())
                .then(() => {
                    this.emitter.emit('completeMove');
                })
        );
    }

    /**
     * Lấy highScore của stage hiện tại
     */
    getHighScore(): number {
        const stageId = this.scene.stageId;

        let highScores = dataManager.get<Record<string, number>>('highScores');

        if (!highScores) {
            highScores = {};
            dataManager.set('highScores', highScores);
        }

        return highScores[stageId || ''] || 0;
    }

    /**
     * Set highScore cho stage hiện tại
     */
    setHighScore(score: number): void {
        const stageId = this.scene.stageId;

        const highScores = dataManager.get<Record<string, number>>('highScores') || {};

        // Cập nhật highScore cho stage hiện tại
        if (stageId) {
            highScores[stageId] = score;
        }

        dataManager.set('highScores', highScores);
        Log.info(`GameManager: High score set for ${stageId}: ${score}`);
    }


    /**
     * Cộng tiền vào tổng coin hiện tại (đã chạy xong: cộng points, play sound, cập nhật UI).
     */
    addCoin(points: number, energy: number | null = null): void {
        this.coin += points;
        soundManager.play('Coin-sound');
        if (energy && this.itemEquipment) {
            this.itemEquipment.forEach((item: ItemButton | undefined) => {
                if (item?.cooldowninning) {
                    item.cooldowninning(energy);
                }
            });
        }
        // Cập nhật hiển thị coin trong GameScene
        if (this.scene && this.scene.coinText) {
            (this.scene.coinText as I18nText).setI18nParams({ amount: this.coin });
            Log.info(`GameManager: UI coin updated to ${this.coin}`);
        } else {
            Log.warn(`GameManager: Cannot update coin UI - scene: ${!!this.scene}, coinText: ${!!this.scene?.coinText}`);
        }

        Log.info(`GameManager: Added ${points} coins, total: ${this.coin}`);
    }

    gameOver(): void {
        Log.info('gameOver!');
        this.emitter.emit('gameOver');
        this.isGameOver = true;
        if (this.scene.sellButton) {
            this.scene.sellButton.hideButton();
        }

        // Lấy tên character hiện tại (từ nameId hoặc config)
        const card = this.cardManager.CardCharacter as any;
        const characterName = card?.nameId ?? card?.constructor?.DEFAULT?.id;

        if (characterName) {
            const characterHighScores = dataManager.get<Record<string, number>>('characterHighScores') || {};

            // Kiểm tra và cập nhật highScore cho character
            if (!characterHighScores[characterName] || this.coin > characterHighScores[characterName]) {
                characterHighScores[characterName] = this.coin;
                dataManager.set('characterHighScores', characterHighScores);
                Log.info(`GameManager: New character high score for ${characterName}: ${this.coin}`);
            }
        }

        // Kiểm tra và cập nhật highScore cho stage hiện tại
        if (this.coin > this.highScore) {
            this.setHighScore(this.coin);
            this.highScore = this.coin; // Cập nhật highScore local
            Log.info(`GameManager: New high score for ${this.scene.stageId}: ${this.coin}`);
        }

        // Cộng dồn coin vào totalCoin
        const currentTotalCoin = dataManager.get<number>('totalCoin') ?? 0;
        const newTotalCoin = currentTotalCoin + this.coin;
        dataManager.set('totalCoin', newTotalCoin);

        this.animationManager
            .startGameOverAnimation(CalculatePositionCard.shuffleArray(this.cardManager.getAllCards()) as Card[])
            .then(() => this.showGameOverDialog());
    }

    /**
     * Thay thế card tại index (vd khi coin/enemy chết). Apply state + enqueue destroy/creation animation.
     */
    requestReplaceCard(index: number, newCard: Card | null): void {
        if (!newCard) return;
        const oldCard = this.cardManager.getCard(index) as Card | null;
        this.cardManager.removeCard(index);
        this.cardManager.addCard(newCard, index);
        const destroyPromise = oldCard?.view ? oldCard.view.playDestroy() : Promise.resolve();
        this.animationManager.addToQueue(8, () =>
            destroyPromise.then(() => newCard.view?.playCreation(this.isGameOver) ?? Promise.resolve())
        );
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
        const background = this.scene.add.rectangle(0, 0, width, height, themeManager.getBackgroundPhaser(), 0.8)
            .setOrigin(0, 0)
            .setInteractive();
        dialog.add(background);

        // Container chính cho dialog - đặt ở giữa màn hình
        const dialogContainer = this.scene.add.container(width / 2, height / 2);

        // Background cho dialog dùng theme
        const dialogBg = this.scene.add.graphics();
        dialogBg.fillStyle(themeManager.getSurfacePhaser(), 0.95);
        dialogBg.lineStyle(3, themeManager.getPrimaryPhaser(), 1);
        dialogBg.fillRoundedRect(-200, -150, 400, 300, 20);
        dialogBg.strokeRoundedRect(-200, -150, 400, 300, 20);
        dialogContainer.add(dialogBg);

        // Tiêu đề – Error (đỏ)
        const title = I18nText.create(this.scene, 0, -100, 'game_over', {
            fontSize: '32px',
            color: themeManager.getError(),
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5);
        dialogContainer.add(title);

        // Thông tin điểm số – Warning (vàng)
        const scoreText = new I18nText(this.scene, 0, -50, 'coin_amount', {
            fontSize: '24px',
            color: themeManager.getWarning(),
            fontFamily: 'Arial, sans-serif'
        }, { amount: this.coin });
        scoreText.setOrigin(0.5);
        dialogContainer.add(scoreText);

        // High score – Neutral/Text
        const highScoreText = I18nText.create(this.scene, 0, -10, 'high_score_label', {
            fontSize: '20px',
            color: themeManager.getNeutral(),
            fontFamily: 'Arial, sans-serif'
        }, { score: this.highScore });
        highScoreText.setOrigin(0.5);
        dialogContainer.add(highScoreText);

        // Nút Restart – Success (xanh)
        const restartButton = I18nText.create(this.scene, 0, 50, 'restart', {
            fontSize: '24px',
            color: themeManager.getSuccess(),
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
            restartButton.setTint(themeManager.getNeutralPhaser());
        });
        restartButton.on('pointerout', () => {
            restartButton.clearTint();
        });
        dialogContainer.add(restartButton);

        // Nút Menu – Text
        const menuButton = I18nText.create(this.scene, 0, 100, 'menu_button', {
            fontSize: '24px',
            color: themeManager.getText(),
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
            menuButton.setTint(themeManager.getNeutralPhaser());
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
