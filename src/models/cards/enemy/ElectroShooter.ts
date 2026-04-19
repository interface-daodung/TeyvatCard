import Phaser from 'phaser';
import Enemy from '../../../modules/typeCard/enemy.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import Character, { type DamageElement } from '../../../modules/typeCard/character.js';
import { animationArrow } from '@/src/animations/Sprites/animationArrow.js';

const HILICHURL_TOKEN_TEXTURE = 'hilichurlToken';
const SHOOT_TOKEN_SPACING = 22;
const SHOOT_TOKEN_SIZE = 20;
const SHOOT_TOKEN_CONTAINER_Y = 118;
/** Số lần `completeMove` cần tích lũy trước khi gây 1 damage cho nhân vật (chỉnh tại đây). */
const SHOOT_COUNT_MAX = 5;
/** Nguyên tố truyền vào `takeDamage` khi đủ đếm. */
const DAMAGE_ELEMENT: DamageElement = 'electro';

export default class ElectroShooter extends Enemy {
    shootCount = 0;

    private shootTokenContainer!: Phaser.GameObjects.Container;

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('ElectroShooter') ?? { id: 'electro-shooter', name: 'Electro Shooter', description: '', element: 'electro', clan: 'hilichurl', rarity: 2 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        // this.health = this.GetRandom(3, 10);
        // this.score = this.GetRandom(1, 9);
        this.createCard();
        this.shootTokenContainer = this.scene.add.container(0, SHOOT_TOKEN_CONTAINER_Y);
        this.add(this.shootTokenContainer);
        this.refreshShootTokens();
        const unsub = this.scene.gameManager?.emitter.on(
            'completeMove',
            this.onCompleteMoveShoot.bind(this),
            7
        );
        if (unsub) this.unsubscribeList.push(unsub);
        scene.add.existing(this);
    }

    onCompleteMoveShoot(): void {
        this.shootCount++;
        this.refreshShootTokens();
        if (this.shootCount < SHOOT_COUNT_MAX) return;
        this.shootCount = 0;
        this.refreshShootTokens();
        const cardCharacter = this.scene.gameManager?.cardManager.CardCharacter as Character | undefined;
        cardCharacter?.takeDamage(1, 'damage', DAMAGE_ELEMENT);
        cardCharacter?.add(animationArrow(this.scene, 0, 0).setDepth(10));
    }

    private refreshShootTokens(): void {
        this.shootTokenContainer.removeAll(true);
        const n = this.shootCount;
        if (n <= 0) return;
        const totalWidth = (n - 1) * SHOOT_TOKEN_SPACING;
        const startX = -totalWidth / 2;
        for (let i = 0; i < n; i++) {
            const img = this.scene.add.image(startX + i * SHOOT_TOKEN_SPACING, 0, HILICHURL_TOKEN_TEXTURE);
            img.setDisplaySize(SHOOT_TOKEN_SIZE, SHOOT_TOKEN_SIZE);
            this.shootTokenContainer.add(img);
        }
    }
}
