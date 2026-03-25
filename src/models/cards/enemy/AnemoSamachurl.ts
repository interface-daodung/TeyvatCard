import Phaser from 'phaser';
import Enemy from '../../../modules/typeCard/enemy.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import { ShuffleAllCardsAnimation } from '@/src/animations/ShuffleAllCardsAnimation.js';
import { SkillAnimation } from '@/src/animations/SkillAnimation.js';

const HILICHURL_TOKEN_TEXTURE = 'hilichurlToken';
const SAMA_TOKEN_SPACING = 22;
const SAMA_TOKEN_SIZE = 20;
/** Vị trí dải token trên thẻ (tọa độ local, gần mép dưới). */
const SAMA_TOKEN_CONTAINER_Y = 118;

export default class AnemoSamachurl extends Enemy {
    /** Đếm số lần `completeMove` (cùng sự kiện Nahida dùng cho burst); mỗi 3 lần gọi shuffle một lần. */
    samaCount = 0;

    private samaTokenContainer!: Phaser.GameObjects.Container;

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('AnemoSamachurl') ?? { id: 'anemo-samachurl', name: 'Anemo Samachurl', description: '', element: 'anemo', clan: 'hilichurl', rarity: 3 };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);
        // this.health = this.GetRandom(3, 10);
        // this.score = this.GetRandom(1, 9);
        this.createCard();
        this.samaTokenContainer = this.scene.add.container(0, SAMA_TOKEN_CONTAINER_Y);
        this.add(this.samaTokenContainer);
        this.refreshSamaTokens();
        const unsub = this.scene.gameManager?.emitter.on(
            'completeMove',
            this.onCompleteMoveSama.bind(this),
            7
        );
        if (unsub) this.unsubscribeList.push(unsub);
        scene.add.existing(this);
    }

    onCompleteMoveSama(): void {
        this.samaCount++;
        this.refreshSamaTokens();
        if (this.samaCount <= 5) return;
        this.samaCount = -1;
        this.refreshSamaTokens();
        this.scene.gameManager?.emitter.once(
            'completeMove',
            () => {
                void ShuffleAllCardsAnimation.runAsync(this.scene.gameManager!.animationManager);
                void SkillAnimation.runAsync(this.scene.gameManager.animationManager, this.nameId);
            },
            15
        );

    }

    /** Đồng bộ số ảnh token với `samaCount` (tăng/giảm đều cập nhật container). */
    private refreshSamaTokens(): void {
        this.samaTokenContainer.removeAll(true);
        const n = this.samaCount;
        if (n <= 0) return;
        const totalWidth = (n - 1) * SAMA_TOKEN_SPACING;
        const startX = -totalWidth / 2;
        for (let i = 0; i < n; i++) {
            const img = this.scene.add.image(startX + i * SAMA_TOKEN_SPACING, 0, HILICHURL_TOKEN_TEXTURE);
            img.setDisplaySize(SAMA_TOKEN_SIZE, SAMA_TOKEN_SIZE);
            this.samaTokenContainer.add(img);
        }
    }
}
