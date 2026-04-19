import Phaser from 'phaser';
import { themeManager } from '../core/ThemeManager.js';

export interface GradientTextOptions {
    text?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fontSize?: number;
    fontFamily?: string;
    gradientColors?: string[];
    /** Hex string "#rrggbb" hoặc số màu (0xrrggbb). */
    strokeColor?: string | number;
    strokeWidth?: number;
}

/**
 * Utility class để tạo gradient text đẹp mắt có thể tái sử dụng
 */
export class GradientText {
    private static normalizeColorForKey(color: string): string {
        return color.trim().replace(/^#/, '').toLowerCase();
    }
    private static hexToHsl(hex: string): [number, number, number] {
        const h6 = hex.replace('#', '').slice(0, 6);
        const r = parseInt(h6.slice(0, 2), 16) / 255;
        const g = parseInt(h6.slice(2, 4), 16) / 255;
        const b = parseInt(h6.slice(4, 6), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        let h = 0;
        let s = 0;
        const l = (max + min) / 2;

        if (delta !== 0) {
            s = delta / (1 - Math.abs(2 * l - 1));
            if (max === r) h = 60 * (((g - b) / delta) % 6);
            else if (max === g) h = 60 * (((b - r) / delta + 2));
            else h = 60 * (((r - g) / delta + 4));
            if (h < 0) h += 360;
        }

        return [h, s * 100, l * 100];
    }

    private static hslToHex(h: number, s: number, l: number): string {
        h = ((h % 360) + 360) % 360;
        s = Math.max(0, Math.min(100, s));
        l = Math.max(0, Math.min(100, l));

        const sn = s / 100;
        const ln = l / 100;
        const c = (1 - Math.abs(2 * ln - 1)) * sn;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = ln - c / 2;

        let r: number;
        let g: number;
        let b: number;
        if (h < 60) [r, g, b] = [c, x, 0];
        else if (h < 120) [r, g, b] = [x, c, 0];
        else if (h < 180) [r, g, b] = [0, c, x];
        else if (h < 240) [r, g, b] = [0, x, c];
        else if (h < 300) [r, g, b] = [x, 0, c];
        else [r, g, b] = [c, 0, x];

        const toHex = (v: number): string => Math.round((v + m) * 255).toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    private static generateWarmColors(hexInput: string): [string, string] {
        const raw = hexInput.replace('#', '');
        const alpha = raw.length === 8 ? raw.slice(6) : 'ff';
        const [h, s, l] = this.hexToHsl(raw);
        const c2 = this.hslToHex(h - 24, s - 9, l + 1);
        const c3 = this.hslToHex(h - 33, s + 5, l - 15);
        return [`${c2}${alpha}`, `${c3}${alpha}`];
    }

    private static getGameTitleGradientColors(): [string, string, string] {
        const fallback: [string, string, string] = ['#cbbd1bff', '#c57826ff', '#8c3c0eff'];
        try {
            const accent = themeManager.getAccent();
            const [warm1, warm2] = this.generateWarmColors(accent);
            return [accent, warm1, warm2];
        } catch {
            return fallback;
        }
    }

    /**
     * Tạo gradient text với các tùy chọn linh hoạt
     * @param scene - Scene hiện tại
     * @param options - Các tùy chọn
     * @returns Image object của gradient text
     */
    static createGradientText(scene: Phaser.Scene, options: GradientTextOptions): Phaser.GameObjects.Image {
        const {
            text = 'text default',
            x = 0,
            y = 0,
            width,
            height,
            fontSize,
            fontFamily = 'Arial',
            gradientColors = ['#cbbd1bff', '#c57826ff', '#8c3c0eff'],
            strokeWidth
        } = options;
        const rawStroke = options.strokeColor ?? '#1f0612ff';
        const strokeColor = typeof rawStroke === 'number'
            ? '#' + rawStroke.toString(16).padStart(6, '0')
            : rawStroke;

        // Lấy kích thước game nếu không truyền width/height
        const gameWidth = width || scene.scale.width;
        const gameHeight = height || scene.scale.height;

        // Tính toán kích thước canvas tự động
        const titleWidth = Math.max(100, Math.floor(gameWidth * 0.8));
        const titleHeight = Math.max(50, Math.floor(gameHeight * 0.15));

        // Tính toán font size tự động nếu không truyền
        const finalFontSize = fontSize || Math.max(32, Math.min(64, Math.floor(titleWidth / 10)));

        // Tính toán stroke width tự động nếu không truyền
        const finalStrokeWidth = strokeWidth || Math.max(2, Math.floor(finalFontSize / 18));

        // Key cache theo text + style/màu để tránh dùng nhầm texture khi đổi theme
        const colorsKey = gradientColors.map((color) => this.normalizeColorForKey(color)).join('-');
        const strokeKey = this.normalizeColorForKey(strokeColor);
        const safeText = text.replace(/\s+/g, '_').slice(0, 64);
        const key = `gradientText_${safeText}_${finalFontSize}_${fontFamily}_${finalStrokeWidth}_${strokeKey}_${colorsKey}`;

        // Kiểm tra texture đã tồn tại chưa
        if (!scene.textures.exists(key)) {
            // Tạo canvas texture mới chỉ khi chưa có
            const titleCanvas = scene.textures.createCanvas(key, titleWidth, titleHeight);
            // Fix: Phaser.Textures.CanvasTexture exposes context property, not getContext method
            const canvasContext = titleCanvas.context;

            // Xóa canvas trước khi vẽ
            canvasContext.clearRect(0, 0, titleWidth, titleHeight);

            // Tạo gradient dọc từ trên xuống dưới
            const titleGradient = canvasContext.createLinearGradient(0, 0, 0, titleHeight);
            titleGradient.addColorStop(0, gradientColors[0]);      // Màu trên
            titleGradient.addColorStop(0.5, gradientColors[1]);    // Màu giữa
            titleGradient.addColorStop(1, gradientColors[2]);      // Màu dưới

            // Thiết lập style cho chữ
            canvasContext.font = `bold ${finalFontSize}px ${fontFamily}`;
            canvasContext.textAlign = 'center';
            canvasContext.textBaseline = 'middle';

            // Vẽ viền trước
            canvasContext.lineWidth = finalStrokeWidth;
            canvasContext.strokeStyle = strokeColor;
            canvasContext.strokeText(text, titleWidth / 2, titleHeight / 2);

            // Vẽ chữ với gradient
            canvasContext.fillStyle = titleGradient;
            canvasContext.fillText(text, titleWidth / 2, titleHeight / 2);

            // Cập nhật texture
            titleCanvas.refresh();
        }

        // Tạo và trả về image object
        const gradientImage = scene.add.image(x, y, key).setOrigin(0.5);

        return gradientImage;
    }

    /**
     * Tạo gradient text với preset mặc định cho tiêu đề game
     * @param scene - Scene hiện tại
     * @param text - Nội dung text
     * @param x - Vị trí X
     * @param y - Vị trí Y
     * @returns Image object của gradient text
     */
    static createGameTitle(scene: Phaser.Scene, text: string, x: number, y: number): Phaser.GameObjects.Image {
        return this.createGradientText(scene, {
            text,
            x,
            y,
            gradientColors: this.getGameTitleGradientColors(),
            strokeColor: '#1f0612ff' // Cam đậm
        });
    }
}
