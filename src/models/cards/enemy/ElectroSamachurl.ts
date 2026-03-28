import Phaser from 'phaser';
import Enemy from '../../../modules/typeCard/enemy.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import type Character from '../../../modules/typeCard/character.js';

const HILICHURL_TOKEN_TEXTURE = 'hilichurlToken';
const SAMA_TOKEN_SPACING = 22;
const SAMA_TOKEN_SIZE = 20;
/** Vị trí dải token trên thẻ (tọa độ local, gần mép dưới). */
const SAMA_TOKEN_CONTAINER_Y = 118;

export default class ElectroSamachurl extends Enemy {
    /** Đếm số lần `completeMove`; đủ ngưỡng thì gây sát thương cho Character. */
    samaCount = 0;
    private samaTokenContainer!: Phaser.GameObjects.Container;

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('ElectroSamachurl') ?? { id: 'electro-samachurl', name: 'Electro Samachurl', description: '', element: 'electro', clan: 'hilichurl', rarity: 3 };
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

        const character = this.scene.gameManager?.cardManager?.CardCharacter as Character | undefined;
        if (!character) return;

        const damage = Math.floor(character.hp / 2);
        if (damage <= 0) return;

        character.takeDamage(damage, 'damage', 'electro');
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
