import Phaser from 'phaser';
import { GradientText } from '../../utils/GradientText.js';
import { localizationManager } from '../../core/LocalizationManager.js';

/**
 * GameTitle - Tiêu đề gradient với i18n tích hợp.
 * Tự lắng nghe languageChanged, cập nhật text, cleanup listener khi destroy (tránh leak).
 */
export class GameTitle extends Phaser.GameObjects.Container {
    private i18nKey: string;
    private titleImage: Phaser.GameObjects.Image;
    private boundRefresh: () => void;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        i18nKey: string
    ) {
        super(scene, x, y);
        this.i18nKey = i18nKey;
        this.boundRefresh = this.refreshTitle.bind(this);

        // Image tại (0,0) local vì container đã ở (x,y)
        this.titleImage = GradientText.createGameTitle(
            scene,
            localizationManager.t(i18nKey),
            0,
            0
        );
        this.add(this.titleImage);

        scene.game.events.on('languageChanged', this.boundRefresh);
    }

    private refreshTitle(): void {
        if (!this.active || !this.scene?.scene?.isActive?.()) return;
        this.titleImage.destroy();
        this.titleImage = GradientText.createGameTitle(
            this.scene,
            localizationManager.t(this.i18nKey),
            0,
            0
        );
        this.add(this.titleImage);
    }

    override destroy(fromScene?: boolean): void {
        this.scene?.game?.events?.off('languageChanged', this.boundRefresh);
        super.destroy(fromScene);
    }

    /**
     * Tạo GameTitle và thêm vào scene.
     */
    static create(
        scene: Phaser.Scene,
        x: number,
        y: number,
        i18nKey: string
    ): GameTitle {
        const title = new GameTitle(scene, x, y, i18nKey);
        scene.add.existing(title);
        return title;
    }
}
