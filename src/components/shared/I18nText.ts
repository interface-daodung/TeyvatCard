import Phaser from 'phaser';
import { localizationManager } from '../../core/LocalizationManager.js';

export type I18nParams = Record<string, string | number>;

/**
 * Text kế thừa Phaser.GameObjects.Text, tự cập nhật nội dung khi đổi ngôn ngữ (languageChanged).
 * Lưu i18n key và params trong instance; khi event emit thì refresh mà không cần scene gọi update.
 */
export class I18nText extends Phaser.GameObjects.Text {
    private i18nKey: string;
    private i18nParams: I18nParams;
    private boundRefresh: () => void;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        i18nKey: string,
        style?: Phaser.Types.GameObjects.Text.TextStyle,
        i18nParams: I18nParams = {}
    ) {
        const initialText = localizationManager.t(i18nKey, i18nParams);
        super(scene, x, y, initialText, style ?? {});
        this.i18nKey = i18nKey;
        this.i18nParams = { ...i18nParams };
        this.boundRefresh = this.refreshText.bind(this);

        scene.game.events.on('languageChanged', this.boundRefresh);
    }

    /** Cập nhật lại text từ key + params hiện tại (gọi khi đổi ngôn ngữ hoặc khi params thay đổi). */
    refreshText(): void {
        if (!this.active || this.scene?.scene?.isActive?.() === false) return;
        this.setText(localizationManager.t(this.i18nKey, this.i18nParams));
    }

    setI18nKey(key: string): this {
        this.i18nKey = key;
        this.refreshText();
        return this;
    }

    setI18nParams(params: I18nParams): this {
        this.i18nParams = { ...this.i18nParams, ...params };
        this.refreshText();
        return this;
    }

    override destroy(fromScene?: boolean): void {
        this.scene?.game?.events?.off('languageChanged', this.boundRefresh);
        super.destroy(fromScene);
    }

    /**
     * Tạo I18nText và add vào scene (thay cho scene.add.text khi cần i18n).
     */
    static create(
        scene: Phaser.Scene,
        x: number,
        y: number,
        i18nKey: string,
        style?: Phaser.Types.GameObjects.Text.TextStyle,
        i18nParams?: I18nParams
    ): I18nText {
        const text = new I18nText(scene, x, y, i18nKey, style, i18nParams);
        scene.add.existing(text);
        return text;
    }
}
