import Phaser from 'phaser';
import Enemy from '../typeCard/enemy.js';

const HILICHURL_TOKEN_TEXTURE = 'hilichurlToken';
const SAMA_TOKEN_SPACING = 22;
const SAMA_TOKEN_SIZE = 20;
/** Vị trí dải token trên thẻ (tọa độ local, gần mép dưới). */
const SAMA_TOKEN_CONTAINER_Y = 118;

/**
 * Hilichurl Samachurl: mỗi `completeMove` tăng token; đủ `samaFullCount` lần
 * thì reset chu kỳ và gọi `onSamaThresholdReached` ở lớp con.
 */
export default abstract class Samachurl extends Enemy {
    samaCount = 0;
    protected samaTokenContainer!: Phaser.GameObjects.Container;

    /**
     * Số lần `completeMove` (số token hiển thị tối đa trước khi nổ) cần để gọi `onSamaThresholdReached`.
     * Ghi đè ở lớp con nếu cần ngưỡng khác (ví dụ Anemo = 3, mặc định = 6).
     */
    protected samaFullCount = 6;

    /** Gọi sau `createCard()` trong constructor của lớp con. */
    protected initSamachurlAbility(): void {
        this.samaTokenContainer = this.scene.add.container(0, SAMA_TOKEN_CONTAINER_Y);
        this.add(this.samaTokenContainer);
        this.refreshSamaTokens();
        const unsub = this.scene.gameManager?.emitter.on(
            'completeMove',
            this.onCompleteMoveSama.bind(this),
            7
        );
        if (unsub) this.unsubscribeList.push(unsub);
    }

    onCompleteMoveSama(): void {
        this.samaCount++;
        this.refreshSamaTokens();
        if (this.samaCount < this.samaFullCount) return;

        this.samaCount = -1;
        this.refreshSamaTokens();

        this.onSamaThresholdReached();
    }

    protected abstract onSamaThresholdReached(): void;

    /** Đồng bộ số ảnh token với `samaCount` (tăng/giảm đều cập nhật container). */
    protected refreshSamaTokens(): void {
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
