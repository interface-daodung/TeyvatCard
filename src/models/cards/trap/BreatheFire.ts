import Phaser from 'phaser';
import Trap from '../../../modules/typeCard/trap.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

type ArrowDirection = 'top' | 'bottom' | 'left' | 'right';

interface ArrowText extends Phaser.GameObjects.Text {
    direction: ArrowDirection;
    cardWidth: number;
    cardHeight: number;
    pause: () => void;
    resume: () => void;
    moveTween?: Phaser.Tweens.Tween;
}

export default class BreatheFire extends Trap {
    static DEFAULT = {
        id: 'breathe-fire',
        name: 'Breathe Fire',
        type: 'trap',
        description: 'Breathe Fire - Bẫy thở lửa gây damage cho người chơi khi kích hoạt.',
        rarity: 2
    };

    arrowDisplay!: ArrowText[];
    isTransforming!: boolean;
    trapId!: string;

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, BreatheFire.DEFAULT.name, BreatheFire.DEFAULT.id);
        (this as any).rarity = BreatheFire.DEFAULT.rarity;
        this.description = BreatheFire.DEFAULT.description;
        this.damage = this.GetRandom(1, 7);
        this.trapId = `breathe-fire-${Date.now()}-${Math.random()}`;

        const unsub = this.scene.gameManager?.emitter.on(
            'completeMove',
            this.transformationAgency.bind(this),
            4
        );
        if (unsub) this.unsubscribeList.push(unsub);

        this.createCard();
        this.initializeArrows();
        scene.add.existing(this);
    }

    CardEffect(): boolean {
        this.scene.sound.play('breathe-fire-sound');
        this.scene.gameManager?.animationManager.startBreatheFireAnimation(
            this.damage,
            this.findAdjacentTargets(),
            () => {}
        );
        return false;
    }

    initializeArrows(): void {
        const random = Math.random() * 100;
        const arrowCount = random < 50 ? 2 : random < 90 ? 1 : 3;
        const directions: ArrowDirection[] = ['top', 'bottom', 'left', 'right'];
        this.arrowDisplay = [];
        const dirs = [...directions];
        for (let i = 0; i < arrowCount; i++) {
            const randomIndex = this.GetRandom(0, dirs.length - 1);
            this.arrowDisplay.push(this.createArrowDisplay('#ff0000', dirs[randomIndex]));
            dirs.splice(randomIndex, 1);
        }
    }

    transformationAgency(): void {
        if (this.isTransforming) return;
        this.scene.gameManager!.OnCompleteMoveCount++;
        this.isTransforming = true;

        this.arrowDisplay.forEach(arrow => arrow.pause());

        let completedCount = 0;
        const totalArrows = this.arrowDisplay.length;

        this.arrowDisplay.forEach(arrow => {
            let newAngle: number;
            switch (arrow.direction) {
                case 'top':
                    newAngle = 0;
                    arrow.direction = 'right';
                    break;
                case 'right':
                    newAngle = 90;
                    arrow.direction = 'bottom';
                    break;
                case 'bottom':
                    newAngle = 180;
                    arrow.direction = 'left';
                    break;
                case 'left':
                    newAngle = -90;
                    arrow.direction = 'top';
                    break;
                default:
                    newAngle = arrow.angle;
            }

            this.scene.tweens.add({
                targets: arrow,
                angle: newAngle,
                duration: 300,
                ease: 'Power2',
                onUpdate: () => {
                    const rad = Phaser.Math.DegToRad(arrow.angle);
                    arrow.x = (arrow.cardWidth + 18) * Math.cos(rad);
                    arrow.y = (arrow.cardHeight + 18) * Math.sin(rad);
                },
                onComplete: () => {
                    arrow.resume();
                    completedCount++;
                    if (completedCount >= totalArrows) {
                        this.isTransforming = false;
                        this.scene.gameManager!.OnCompleteMoveCount--;
                    }
                }
            });
        });
    }

    findAdjacentTargets(): number[] {
        const targets: number[] = [];
        const trapIndex = this.index;
        const trapPos = { row: Math.floor(trapIndex / 3), col: trapIndex % 3 };

        if (this.arrowDisplay.some(a => a.direction === 'top') && trapPos.row > 0) {
            targets.push((trapPos.row - 1) * 3 + trapPos.col);
        }
        if (this.arrowDisplay.some(a => a.direction === 'bottom') && trapPos.row < 2) {
            targets.push((trapPos.row + 1) * 3 + trapPos.col);
        }
        if (this.arrowDisplay.some(a => a.direction === 'left') && trapPos.col > 0) {
            targets.push(trapPos.row * 3 + (trapPos.col - 1));
        }
        if (this.arrowDisplay.some(a => a.direction === 'right') && trapPos.col < 2) {
            targets.push(trapPos.row * 3 + (trapPos.col + 1));
        }
        return targets;
    }

    createArrowDisplay(Color: string, direction: ArrowDirection): ArrowText {
        const arrowText = this.scene.add
            .text(0, 0, '➤', {
                fontSize: '42px',
                color: Color,
                fontFamily: 'Arial'
            })
            .setOrigin(0.5)
            .setDepth(999) as ArrowText;

        arrowText.scaleX = 0.45;
        arrowText.cardWidth = 57;
        arrowText.cardHeight = 113;
        arrowText.direction = direction;

        let moveX = 0;
        let moveY = 0;
        let angle = 0;

        switch (direction) {
            case 'top':
                moveY = -5;
                arrowText.setPosition(0, -arrowText.cardHeight - 18);
                angle = -90;
                break;
            case 'bottom':
                moveY = 5;
                arrowText.setPosition(0, arrowText.cardHeight + 18);
                angle = 90;
                break;
            case 'left':
                moveX = -5;
                arrowText.setPosition(-arrowText.cardWidth - 18, 0);
                angle = 180;
                break;
            default:
                moveX = 5;
                arrowText.setPosition(arrowText.cardWidth + 18, 0);
                angle = 0;
        }
        arrowText.setAngle(angle);

        const moveTween = this.scene.tweens.add({
            targets: arrowText,
            x: arrowText.x + moveX,
            y: arrowText.y + moveY,
            duration: 1000,
            ease: 'Linear',
            yoyo: true,
            repeat: -1
        });

        arrowText.pause = () => moveTween.pause();
        arrowText.resume = () => {
            if (arrowText.moveTween) arrowText.moveTween.stop();
            let newAngle = 0;
            let newX = 0;
            let newY = 0;
            let mX = 0;
            let mY = 0;
            switch (arrowText.direction) {
                case 'top':
                    newAngle = -90;
                    newX = 0;
                    newY = -arrowText.cardHeight - 18;
                    mY = -5;
                    break;
                case 'bottom':
                    newAngle = 90;
                    newX = 0;
                    newY = arrowText.cardHeight + 18;
                    mY = 5;
                    break;
                case 'left':
                    newAngle = 180;
                    newX = -arrowText.cardWidth - 18;
                    newY = 0;
                    mX = -5;
                    break;
                default:
                    newAngle = 0;
                    newX = arrowText.cardWidth + 18;
                    newY = 0;
                    mX = 5;
            }
            arrowText.setPosition(newX, newY);
            arrowText.setAngle(newAngle);
            arrowText.moveTween = this.scene.tweens.add({
                targets: arrowText,
                x: newX + mX,
                y: newY + mY,
                duration: 1000,
                ease: 'Linear',
                yoyo: true,
                repeat: -1
            });
        };
        arrowText.moveTween = moveTween;
        this.add(arrowText);
        return arrowText;
    }

    override destroy(fromScene?: boolean): void {
        if (this.arrowDisplay) {
            this.arrowDisplay.forEach(arrow => {
                if (arrow.moveTween) arrow.moveTween.stop();
            });
        }
        super.destroy(fromScene);
    }
}
