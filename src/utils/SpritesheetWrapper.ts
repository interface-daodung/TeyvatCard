import Phaser from 'phaser';

export interface AnimationFrames {
    start: number;
    end: number;
}

/** Sprite với pulseTimer (dùng cho stopPulseSprite) */
export interface SpriteWithPulseTimer extends Phaser.GameObjects.Sprite {
    pulseTimer?: Phaser.Time.TimerEvent;
}

export class SpritesheetWrapper {
    /**
     * Phát animation effect và tự động xóa khi hoàn thành
     */
    static animationEffect(
        scene: Phaser.Scene,
        x: number,
        y: number,
        textureKey: string,
        displayWidth: number | null = null,
        displayHeight: number | null = null,
        frames: AnimationFrames,
        frameRate: number = 10
    ): Phaser.GameObjects.Sprite {
        const sprite = scene.add.sprite(x, y, textureKey);

        if (displayWidth !== null) {
            sprite.setDisplaySize(displayWidth, displayHeight ?? displayWidth);
        }

        const animKey = `${textureKey}_effect_${frames.start}_${frames.end}`;

        if (!scene.anims.exists(animKey)) {
            scene.anims.create({
                key: animKey,
                frames: scene.anims.generateFrameNumbers(textureKey, {
                    start: frames.start,
                    end: frames.end
                }),
                frameRate: frameRate,
                repeat: 0
            });
        }
        sprite.setDepth(200);
        sprite.play(animKey);

        sprite.on('animationcomplete', () => {
            sprite.destroy();
        });

        return sprite;
    }

    /**
     * Phát animation slash effect với tham số cố định
     */
    static animationSlash(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Sprite {
        return this.animationEffect(
            scene,
            x,
            y,
            'slash-animations',
            170,
            170,
            { start: 0, end: 4 },
            12
        );
    }

    static animationBomb(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Sprite {
        return this.animationEffect(
            scene,
            x,
            y,
            'bomb-animations',
            170,
            170,
            { start: 0, end: 11 },
            24
        );
    }

    static animationBreatheFire(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Sprite {
        return this.animationEffect(
            scene,
            x,
            y,
            'breathe-fire-animations',
            170,
            170,
            { start: 0, end: 14 },
            30
        );
    }

    /**
     * Tạo character animation (thay thế SpritesheetCharacter.create)
     */
    static CharacterAnimation(
        scene: Phaser.Scene,
        x: number,
        y: number,
        textureKey: string,
        displayWidth: number | null = null,
        displayHeight: number | null = null,
        totalFrames: number = 76
    ): Phaser.GameObjects.Sprite {
        const sprite = scene.add.sprite(x, y, textureKey);

        if (displayWidth && displayHeight) {
            sprite.setDisplaySize(displayWidth, displayHeight);
        }

        const animKey = `${textureKey}-animation`;

        if (!scene.anims.exists(animKey)) {
            scene.anims.create({
                key: animKey,
                frames: scene.anims.generateFrameNumbers(textureKey, {
                    start: 0,
                    end: totalFrames - 1
                }),
                frameRate: 12,
                repeat: -1
            });
        }

        sprite.play(animKey);

        return sprite;
    }

    static setSpriteTint(sprite: Phaser.GameObjects.Sprite, color: number): Phaser.GameObjects.Sprite {
        sprite.setTint(color);
        return sprite;
    }

    static setSpriteTintWithAlpha(
        sprite: Phaser.GameObjects.Sprite,
        color: number,
        alpha: number
    ): Phaser.GameObjects.Sprite {
        sprite.setTintFill(color);
        sprite.setAlpha(alpha);
        return sprite;
    }

    static clearSpriteTint(sprite: Phaser.GameObjects.Sprite): Phaser.GameObjects.Sprite {
        sprite.clearTint();
        return sprite;
    }

    static flashSprite(
        sprite: Phaser.GameObjects.Sprite,
        color: number = 0xffffff,
        duration: number = 200
    ): Phaser.GameObjects.Sprite {
        const originalTint = sprite.tint;

        sprite.setTint(color);

        sprite.scene.time.delayedCall(duration, () => {
            sprite.setTint(originalTint);
        });

        return sprite;
    }

    static pulseSprite(
        sprite: Phaser.GameObjects.Sprite,
        color: number = 0xffffff,
        interval: number = 500,
        duration: number = 200
    ): Phaser.GameObjects.Sprite {
        const s = sprite as SpriteWithPulseTimer;
        const originalTint = sprite.tint;
        let isFlashing = false;

        const pulseTimer = sprite.scene.time.addEvent({
            delay: interval,
            callback: () => {
                if (!isFlashing) {
                    isFlashing = true;
                    sprite.setTint(color);

                    sprite.scene.time.delayedCall(duration, () => {
                        sprite.setTint(originalTint);
                        isFlashing = false;
                    });
                }
            },
            loop: true
        });

        s.pulseTimer = pulseTimer;

        return sprite;
    }

    static stopPulseSprite(sprite: Phaser.GameObjects.Sprite): Phaser.GameObjects.Sprite {
        const s = sprite as SpriteWithPulseTimer;
        if (s.pulseTimer) {
            s.pulseTimer.destroy();
            s.pulseTimer = undefined;
            sprite.clearTint();
        }
        return sprite;
    }
}
