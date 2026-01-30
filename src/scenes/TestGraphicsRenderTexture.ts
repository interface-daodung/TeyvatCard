import Phaser from 'phaser';

export default class TestGraphicsRenderTexture extends Phaser.Scene {
    private currentAnimationIndex: number;
    private animations: string[];
    public animationSprite!: Phaser.GameObjects.Sprite;
    public animationNameText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'TestGraphicsRenderTexture' });
        this.currentAnimationIndex = 0;
        this.animations = [
            'Absorb', 'ArrowSpecial', 'Blow', 'Breath', 'Claw', 'ClawPhoton',
            'ClawSpecial1', 'ClawSpecial2', 'Cure1', 'Cure2', 'Cure3', 'Cure4',
            'Curse', 'Darkness1', 'Darkness2', 'Darkness3', 'Darkness4', 'Darkness5',
            'Earth1', 'Earth2', 'Earth3', 'Earth4', 'Earth5', 'Explosion1', 'Explosion2',
            'Fire1', 'Fire2', 'Fire3', 'Flash', 'Gun1', 'Gun2', 'Gun3', 'Hit1', 'Hit2',
            'HitFire', 'HitIce', 'HitPhoton', 'HitSpecial1', 'HitSpecial2', 'HitThunder',
            'Holy1', 'Holy2', 'Holy3', 'Holy4', 'Holy5', 'Howl', 'Ice1', 'Ice2', 'Ice3',
            'Ice4', 'Ice5', 'Laser1', 'Laser2', 'Light1', 'Light2', 'Light3', 'Light4',
            'Magic1', 'Magic2', 'Meteor', 'Mist', 'Pollen', 'PreSpecial1', 'PreSpecial2',
            'PreSpecial3', 'Recovery1', 'Recovery2', 'Recovery3', 'Recovery4', 'Recovery5',
            'Revival1', 'Revival2', 'Slash', 'SlashFire', 'SlashIce', 'SlashPhoton',
            'SlashSpecial1', 'SlashSpecial2', 'SlashSpecial3', 'SlashThunder', 'Song',
            'Sonic', 'Special1', 'Special2', 'Special3', 'StateChaos', 'StateDark',
            'StateDeath', 'StateDown1', 'StateDown2', 'StateDown3', 'StateParalys',
            'StatePoison', 'StateSilent', 'StateSleep', 'StateUp1', 'StateUp2',
            'Stick', 'StickPhoton', 'StickSpecial1'
        ];
    }

    preload(): void {
        // Load tất cả sprite sheets
        this.animations.forEach(animName => {
            this.load.spritesheet(animName, `assets/images/animations/${animName}.png`, {
                frameWidth: 192,
                frameHeight: 192
            });
        });
    }

    create(): void {
        // Lấy kích thước game
        const { width, height } = this.scale;

        // Tạo background đen
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000);

        // Tạo nút để quay lại MenuScene
        const backButton = this.add.text(width / 2, height * 0.9, 'QUAY LẠI MENU', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        backButton.setInteractive({ useHandCursor: true });
        backButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
        
        backButton.on('pointerover', () => {
            backButton.setStyle({ color: '#cccccc' });
        });
        
        backButton.on('pointerout', () => {
            backButton.setStyle({ color: '#ffffff' });
        });

        // Thêm text mô tả
        this.add.text(width / 2, height * 0.1, 'Kiểm Tra Sprite Animations', {
            fontSize: '32px',
            color: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Tạo nút Previous và Next
        this.createNavigationButtons(width, height);

        // Tạo sprite animation
        this.createAnimationSprite(width, height);

        // Tạo text hiển thị tên animation hiện tại
        this.animationNameText = this.add.text(width / 2, height * 0.85, '', {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);

        // Bắt đầu animation đầu tiên
        this.playCurrentAnimation();
    }

    createNavigationButtons(width: number, height: number): void {
        // Nút Previous
        const prevButton = this.add.text(width * 0.2, height * 0.8, '◀ PREV', {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        prevButton.setInteractive({ useHandCursor: true });
        prevButton.on('pointerdown', () => {
            this.previousAnimation();
        });
        
        prevButton.on('pointerover', () => {
            prevButton.setStyle({ color: '#cccccc' });
        });
        
        prevButton.on('pointerout', () => {
            prevButton.setStyle({ color: '#ffffff' });
        });

        // Nút Next
        const nextButton = this.add.text(width * 0.8, height * 0.8, 'NEXT ▶', {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        nextButton.setInteractive({ useHandCursor: true });
        nextButton.on('pointerdown', () => {
            this.nextAnimation();
        });
        
        nextButton.on('pointerover', () => {
            nextButton.setStyle({ color: '#cccccc' });
        });
        
        nextButton.on('pointerout', () => {
            nextButton.setStyle({ color: '#ffffff' });
        });
    }

    createAnimationSprite(width: number, height: number): void {
        // Tạo sprite ở giữa màn hình
        this.animationSprite = this.add.sprite(width / 2, height / 2, 'Absorb');
        this.animationSprite.setScale(2); // Phóng to để dễ nhìn
    }

    playCurrentAnimation(): void {
        const currentAnim = this.animations[this.currentAnimationIndex];
        
        // Tạo animation nếu chưa có
        if (!this.anims.exists(currentAnim)) {
            // Lấy texture để kiểm tra frames
            const texture = this.textures.get(currentAnim);
            const frameTotal = texture.frameTotal;
            
            // Tạo danh sách frames, bỏ qua frame trống
            const validFrames: Array<{ key: string; frame: number }> = [];
            for (let i = 0; i < frameTotal; i++) {
                const frame = texture.get(i);
                // Kiểm tra frame có dữ liệu không (không trống)
                if (frame && frame.width > 0 && frame.height > 0) {
                    // Kiểm tra thêm xem frame có pixel data không
                    try {
                        const canvas = frame.source.image as HTMLCanvasElement;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            const imageData = ctx.getImageData(frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight);
                            const data = imageData.data;
                            
                            // Kiểm tra xem có pixel không trong suốt không
                            let hasVisiblePixels = false;
                            for (let j = 3; j < data.length; j += 4) { // Chỉ kiểm tra alpha channel
                                if (data[j] > 0) { // Alpha > 0 nghĩa là có pixel
                                    hasVisiblePixels = true;
                                    break;
                                }
                            }
                            
                            if (hasVisiblePixels) {
                                validFrames.push({ key: currentAnim, frame: i });
                            }
                        }
                    } catch (error) {
                        // Nếu không thể kiểm tra, thêm frame vào
                        validFrames.push({ key: currentAnim, frame: i });
                    }
                }
            }
            
            this.anims.create({
                key: currentAnim,
                frames: validFrames,
                frameRate: 10,
                repeat: -1
            });
        }
        
        // Chạy animation
        this.animationSprite.play(currentAnim);
        
        // Cập nhật text tên animation với số frames thực tế
        const texture = this.textures.get(currentAnim);
        const frameTotal = texture.frameTotal;
        this.animationNameText.setText(`${currentAnim} (${this.currentAnimationIndex + 1}/${this.animations.length}) - ${frameTotal} frames`);
    }

    nextAnimation(): void {
        this.currentAnimationIndex = (this.currentAnimationIndex + 1) % this.animations.length;
        this.playCurrentAnimation();
    }

    previousAnimation(): void {
        this.currentAnimationIndex = this.currentAnimationIndex === 0 ? 
            this.animations.length - 1 : this.currentAnimationIndex - 1;
        this.playCurrentAnimation();
    }
}
