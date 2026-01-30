import Phaser from 'phaser';

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

        // Tạo key cố định theo text để tái sử dụng
        const key = `gradientText_${text}`;

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
            gradientColors: ['#cbbd1bff', '#c57826ff', '#8c3c0eff'], // Gold gradient
            strokeColor: '#1f0612ff' // Cam đậm
        });
    }
}
