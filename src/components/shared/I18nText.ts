import Phaser from 'phaser';
import { localizationManager } from '../../core/LocalizationManager.js';

export type I18nParams = Record<string, string | number>;

/** Một cặp key-value để thay thế placeholder trong text (vd: '{basePower}' -> "5"). value có thể là số. */
export type InterpolationEntry = { key: string; value: string | number };

/**
 * Text kế thừa Phaser.GameObjects.Text, tự cập nhật nội dung khi đổi ngôn ngữ (languageChanged).
 * Lưu i18n key và params trong instance; khi event emit thì refresh mà không cần scene gọi update.
 */
export class I18nText extends Phaser.GameObjects.Text {
    private i18nKey: string;
    private i18nParams: I18nParams;
    private interpolation: InterpolationEntry[];
    private boundRefresh: () => void;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        i18nKey: string,
        style?: Phaser.Types.GameObjects.Text.TextStyle,
        i18nParams: I18nParams = {},
        interpolation?: InterpolationEntry[]
    ) {
        const initialText = I18nText.applyInterpolation(
            localizationManager.t(i18nKey, i18nParams),
            interpolation ?? []
        );
        super(scene, x, y, initialText, style ?? {});
        this.i18nKey = i18nKey;
        this.i18nParams = { ...i18nParams };
        this.interpolation = interpolation ? [...interpolation] : [];
        this.boundRefresh = this.refreshText.bind(this);

        scene.game.events.on('languageChanged', this.boundRefresh);
        this.refreshText();
    }

    /** Thay thế các placeholder {key} trong text bằng value từ mảng interpolation. */
    private static applyInterpolation(text: string, interpolation: InterpolationEntry[]): string {
        if (!interpolation.length) return text;
        let result = text;
        for (const { key, value } of interpolation) {
            const placeholder = `{${key}}`;
            result = result.split(placeholder).join(String(value));
        }
        return result;
    }

    /** Cập nhật lại text từ key + params hiện tại (gọi khi đổi ngôn ngữ hoặc khi params thay đổi). */
    refreshText(): void {
        if (!this.active || this.scene?.scene?.isActive?.() === false) return;

        // Cập nhật wordWrap nếu có (quan trọng cho ja vs vi/en)
        if (this.style.wordWrapWidth) {
            const wrap = localizationManager.getWordWrapOptions(this.style.wordWrapWidth);
            this.setWordWrapWidth(wrap.width, wrap.useAdvancedWrap);
        }

        this.setText(
            I18nText.applyInterpolation(
                localizationManager.t(this.i18nKey, this.i18nParams),
                this.interpolation
            )
        );
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

    setInterpolation(interpolation: InterpolationEntry[]): this {
        this.interpolation = [...interpolation];
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
        i18nParams?: I18nParams,
        interpolation?: InterpolationEntry[]
    ): I18nText {
        const text = new I18nText(scene, x, y, i18nKey, style, i18nParams ?? {}, interpolation);
        scene.add.existing(text);
        return text;
    }
}
