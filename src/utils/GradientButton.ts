import Phaser from 'phaser';

export interface GradientButtonImage extends Phaser.GameObjects.Image {
    buttonText?: Phaser.GameObjects.Text;
    buttonContainer?: Phaser.GameObjects.Container;
}

/**
 * Utility class để tạo gradient button đẹp mắt có thể tái sử dụng
 */
export class GradientButton {
    /**
     * Tạo gradient button với text
     */
    static createGradientButton(
        scene: Phaser.Scene,
        text: string,
        x: number,
        y: number,
        width: number,
        height: number,
        colors: string[] = ['#ffb3d9', '#45162c', '#96576a'],
        buttonKey: string | null = null
    ): GradientButtonImage {
        // Tạo key cố định theo text và kích thước để tái sử dụng
        const key = buttonKey || `gradientButton_${text}_${width}x${height}`;
        const radius = 8;

        if (!scene.textures.exists(key)) {
            const texture = scene.textures.createCanvas(key, width, height);
            const context = texture.getContext();

            // Gradient top → bottom
            const gradient = context.createLinearGradient(0, 0, 0, height);
            const step = 1 / (colors.length - 1);
            colors.forEach((color, i) => {
                gradient.addColorStop(i * step, color);
            });

            // Hàm vẽ rounded rect
            function drawRoundedRect(
                ctx: CanvasRenderingContext2D,
                x: number,
                y: number,
                w: number,
                h: number,
                r: number
            ): void {
                ctx.beginPath();
                ctx.moveTo(x + r, y);
                ctx.lineTo(x + w - r, y);
                ctx.quadraticCurveTo(x + w, y, x + w, y + r);
                ctx.lineTo(x + w, y + h - r);
                ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
                ctx.lineTo(x + r, y + h);
                ctx.quadraticCurveTo(x, y + h, x, y + h - r);
                ctx.lineTo(x, y + r);
                ctx.quadraticCurveTo(x, y, x + r, y);
                ctx.closePath();
            }

            // Vẽ nút nền
            drawRoundedRect(context, 0, 0, width, height, radius);
            context.fillStyle = gradient;
            context.fill();

            // Vẽ viền
            context.lineWidth = 4;
            context.strokeStyle = '#1f0614';
            context.stroke();

            texture.refresh();
        }
        // Tạo button image
        const button = scene.add.image(x, y, key).setOrigin(0.5) as GradientButtonImage;

        // Thêm text trắng với viền đen bold
        const buttonText = scene.add.text(x, y, text, {
            fontSize: `${Math.max(16, Math.floor(height * 0.5))}px`,
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: Math.max(2, Math.floor(height * 0.05))
        }).setOrigin(0.5);

        // Tạo container để group button và text
        const buttonContainer = scene.add.container(x, y);
        buttonContainer.add([button, buttonText]);

        // Trả về button image để có thể setInteractive dễ dàng
        // và gán buttonText như một property để có thể truy cập sau này
        button.buttonText = buttonText;
        button.buttonContainer = buttonContainer;

        // Thêm interactive và hover effects
        button.setInteractive()
            .on('pointerover', () => {
                button.setTint(0xd1d1d1); // phủ màu vàng nhạt
            })
            .on('pointerout', () => {
                button.clearTint(); // trả về màu gốc
            });

        return button;
    }

    /**
     * Tạo gradient button với preset màu ruby
     */
    static createRubyButton(
        scene: Phaser.Scene,
        text: string,
        x: number,
        y: number,
        width: number,
        height: number
    ): GradientButtonImage {
        return this.createGradientButton(scene, text, x, y, width, height, ['#ffb3d9', '#96576a']);
    }

    /**
     * Tạo gradient button với preset màu gold
     */
    static createGoldButton(
        scene: Phaser.Scene,
        text: string,
        x: number,
        y: number,
        width: number,
        height: number
    ): GradientButtonImage {
        return this.createGradientButton(scene, text, x, y, width, height, ['#ffd700', '#ffb347', '#daa520']);
    }

    /**
     * Tạo gradient button với preset màu blue
     */
    static createBlueButton(
        scene: Phaser.Scene,
        text: string,
        x: number,
        y: number,
        width: number,
        height: number
    ): GradientButtonImage {
        return this.createGradientButton(scene, text, x, y, width, height, ['#87ceeb', '#4682b4', '#191970']);
    }

    /**
     * Tạo gradient button với preset màu green
     */
    static createGreenButton(
        scene: Phaser.Scene,
        text: string,
        x: number,
        y: number,
        width: number,
        height: number
    ): GradientButtonImage {
        return this.createGradientButton(scene, text, x, y, width, height, ['#90ee90', '#32cd32', '#228b22']);
    }
}
