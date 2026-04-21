import type Phaser from 'phaser';
import TextureManager from '../../core/TextureManager.js';
import { themeManager } from '../../core/ThemeManager.js';

export interface FrameLayerOptions {
    textureKey: string;
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    depth?: number;
    alpha?: number;
    scale?: number;
}

export interface FrameFlashLayerOptions extends FrameLayerOptions {
    durationMs?: number;
    startScale?: number;
    endScale?: number;
    ease?: string;
}

const DEFAULT_FRAME_LAYER_WIDTH = 160;
const DEFAULT_FRAME_LAYER_HEIGHT = 274.3;

export function setFrameLayer(
    parent: Phaser.GameObjects.Container,
    referenceImage: Phaser.GameObjects.Image,
    options: FrameLayerOptions,
): () => void {
    const {
        textureKey,
        width = DEFAULT_FRAME_LAYER_WIDTH,
        height = DEFAULT_FRAME_LAYER_HEIGHT,
        x = 0,
        y = 0,
        depth = 20,
        alpha = 1,
        scale
    } = options;

    const layer = TextureManager.image(parent, x, y, textureKey);
    layer
        .setOrigin(0.5)
        .setDisplaySize(width, height)
        .setDepth(depth)
        .setAlpha(alpha)
        .setVisible(true);
    if (scale != null) {
        layer.setScale(scale);
    }

    const cardImageIndex = parent.getIndex(referenceImage);
    if (cardImageIndex >= 0) {
        parent.moveTo(layer, cardImageIndex + 1);
    }

    return () => {
        layer.destroy();
    };
}

export function showFrameLayerOnce(
    scene: Phaser.Scene,
    parent: Phaser.GameObjects.Container,
    options: FrameFlashLayerOptions,
): void {
    const {
        textureKey,
        width = DEFAULT_FRAME_LAYER_WIDTH,
        height = DEFAULT_FRAME_LAYER_HEIGHT,
        x = 0,
        y = 0,
        depth = 20,
        alpha = 1,
        durationMs = 250,
        startScale = 1,
        endScale = 1.5,
        ease = 'Sine.easeOut'
    } = options;

    const layer = TextureManager.image(parent, x, y, textureKey)
        .setOrigin(0.5)
        .setScale(startScale)
        .setAlpha(0)
        .setDepth(depth)
        .setVisible(true);

    scene.tweens.add({
        targets: layer,
        alpha,
        duration: durationMs,
        ease,
        yoyo: true,
        onUpdate: () => {
            const currentScale = startScale + (endScale - startScale) * layer.alpha;
            layer.setDisplaySize(width * currentScale, height * currentScale);
        },
        onComplete: () => {
            layer.destroy();
        }
    });
}

export interface CardImageInput {
    scene: Phaser.Scene;
    nameId: string;
}

export function createCardImage(input: CardImageInput): Phaser.GameObjects.Image {
    if (TextureManager.has(input.nameId)) {
        return TextureManager.image(input.scene, 0, 0, input.nameId);
    }

    return TextureManager.image(input.scene, 0, 0, 'empty');
}

/** Kích thước icon token (element) ở giữa phần trên thẻ. */
export const TOKEN_SIZE = 40;

/** Bảy nguyên tố dùng trong logic game (không kèm hậu tố frame). */
export type CardElement =
    | 'anemo'
    | 'cryo'
    | 'dendro'
    | 'electro'
    | 'geo'
    | 'hydro'
    | 'pyro';

/** Alias tương thích ngược cho các nơi đang import tên cũ. */
export type CardTokenElement = CardElement;

const DAMAGE_ELEMENT_KEYS = new Set<string>([
    'anemo',
    'cryo',
    'dendro',
    'electro',
    'geo',
    'hydro',
    'pyro'
]);

/** Chuỗi config / `CardCharacter.element` → một trong bảy nguyên tố sát thương, hoặc null. */
export function toDamageElement(value: string | undefined | null): CardElement | null {
    if (value == null || value === '') return null;
    const key = value.toLowerCase();
    return DAMAGE_ELEMENT_KEYS.has(key) ? (key as CardElement) : null;
}

/** Tọa độ local trong container thẻ: giữa theo X, phía trên mặt thẻ. */
const TOKEN_TOP_CENTER_X = 0;
const TOKEN_TOP_CENTER_Y = -118;

/** Giữ reference `Image` do `setTokenElement` tạo; gắn lên instance Card (ví dụ `{ image: null }`). */
export type CardTokenImageHolder = { image: Phaser.GameObjects.Image | null };

/**
 * Đặt icon token nhỏ giữa phần trên thẻ (`TOKEN_SIZE` × `TOKEN_SIZE`).
 * Chỉ chấp nhận một trong bảy `CardTokenElement` (key `TextureManager` trùng tên frame atlas token).
 * `null` / `undefined` → ẩn; key thiếu sẽ hiện fallback texture từ `TextureManager`.
 */
export function setTokenElement(
    scene: Phaser.Scene,
    parent: Phaser.GameObjects.Container,
    holder: CardTokenImageHolder,
    element: CardElement | null | undefined,
): void {
    if (element == null) {
        holder.image?.setVisible(false);
        return;
    }
    const key = `${element}-token`;

    if (!holder.image) {
        holder.image = TextureManager.image(parent, TOKEN_TOP_CENTER_X, TOKEN_TOP_CENTER_Y, key);
        holder.image.setOrigin(0.5);
        holder.image.setDepth(10);
    } else {
        TextureManager.setImageTexture(holder.image, key);
    }
    // Luôn ép size để tránh image cũ/phép scale trước đó làm token quá lớn.
    holder.image.setDisplaySize(TOKEN_SIZE, TOKEN_SIZE);
    holder.image.setPosition(TOKEN_TOP_CENTER_X, TOKEN_TOP_CENTER_Y);
    holder.image.setVisible(true);
}

export interface CreateDisplayOptions {
    fillColor?: number;
    text?: string;
    /**
     * Emoji / ký tự làm nền (ví dụ 🛡️). Vẽ trước số nên nằm phía sau.
     * Khi có `backgroundIcon`, không vẽ hình tròn `graphics` để icon làm nền rõ ràng.
     */
    backgroundIcon?: string;
    /** `fontSize` CSS cho icon nền (mặc định `36px`). */
    backgroundIconSize?: string;
}

export type DisplayPosition = 'leftTop' | 'rightTop' | 'rightBottom' | 'leftBottom';

export interface CreateDisplayResult {
    container: Phaser.GameObjects.Container;
    text: Phaser.GameObjects.Text;
    updateText: (newText: string | number) => void;
    updateColor: (newColor: number) => void;
    destroy: () => void;
}

interface CreateCardDisplayInput {
    scene: Phaser.Scene;
    parent: Phaser.GameObjects.Container;
    options?: CreateDisplayOptions;
    position: DisplayPosition;
}

/*
* Tạo display HUD cho card (tròn + số, hoặc icon nền + số nếu có `backgroundIcon`).
* `updateText`: ẩn cả container khi giá trị parse ra số === 0 (giống HP).
*/
export function createCardDisplay(input: CreateCardDisplayInput): CreateDisplayResult {
    const { scene, parent, options = {}, position } = input;
    const {
        fillColor = 0x00ff00,
        text = '0',
        backgroundIcon,
        backgroundIconSize = '36px'
    } = options;

    const iconKey = backgroundIcon?.trim();
    const useIconBackground = Boolean(iconKey);

    let backgroundGraphics: Phaser.GameObjects.Graphics | null = null;
    let iconBackground: Phaser.GameObjects.Text | null = null;
    const stack: Phaser.GameObjects.GameObject[] = [];

    if (useIconBackground && iconKey) {
        iconBackground = scene.add.text(0, 0, iconKey, {
            fontSize: backgroundIconSize,
            fontFamily: 'Arial, sans-serif'
        });
        iconBackground.setOrigin(0.5);
        stack.push(iconBackground);
    } else {
        backgroundGraphics = scene.add.graphics();
        backgroundGraphics.fillStyle(fillColor);
        backgroundGraphics.fillCircle(0, 0, 18);
        stack.push(backgroundGraphics);
    }

    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
        fontSize: '20px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
    };
    if (useIconBackground) {
        textStyle.stroke = '#000000';
        textStyle.strokeThickness = 3;
    }

    const textDisplay = scene.add.text(0, 0, text.toString(), textStyle);
    textDisplay.setOrigin(0.5);
    stack.push(textDisplay);

    const display = scene.add.container(0, 0, stack);

    if (position === 'leftTop') display.setPosition(-57, -113);
    else if (position === 'rightTop') display.setPosition(57, -113);
    else if (position === 'rightBottom') display.setPosition(57, 113);
    else if (position === 'leftBottom') display.setPosition(-57, 113);

    parent.add(display);

    if (parseInt(text, 10) === 0) {
        display.setVisible(false);
    }

    return {
        container: display,
        text: textDisplay,
        updateText: (newText: string | number) => {
            if (textDisplay?.setText) {
                textDisplay.setText(String(newText));
                display.setVisible(parseInt(String(newText), 10) !== 0);
            }
        },
        updateColor: (newColor: number) => {
            if (backgroundGraphics) {
                backgroundGraphics.clear();
                backgroundGraphics.fillStyle(newColor, 1);
                backgroundGraphics.fillCircle(0, 0, 18);
            }
            if (iconBackground) {
                iconBackground.setTint(newColor);
            }
        },
        destroy: () => {
            display?.destroy();
        }
    };
}
