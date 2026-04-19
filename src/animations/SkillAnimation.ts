import type { AnimationManager } from './types.js';

const PRIORITY = 7;

export class SkillAnimation {
    static run(
        manager: AnimationManager,
        itemImage: string,
        onComplete?: () => void
    ): void {
        manager.addToQueue(PRIORITY, (completeCallback) => {
            if (!manager.scene.gameManager) {
                onComplete?.();
                completeCallback();
                return;
            }

            const coordinates = manager.scene.gameManager.cardManager
                .getGridPositionCoordinates(4);

            if (!coordinates) {
                onComplete?.();
                completeCallback();
                return;
            }

            // Tạo skill image
            const skill = manager.scene.add.image(
                coordinates.x,
                coordinates.y,
                itemImage + '-skill'
            );

            skill.setDisplaySize(420, 720);
            const baseScaleX = skill.scaleX;
            const baseScaleY = skill.scaleY;

            skill.setDepth(200);

            // Khởi tạo: Ẩn và thu nhỏ một chút để chuẩn bị "co bóp" hiện ra
            skill.setAlpha(0);
            skill.setScale(baseScaleX * 0.4, baseScaleY * 0.4);

            // --- PHASER 3.60+ CHAINING ---
            manager.scene.tweens.add({
                targets: skill,
                // Giai đoạn 1: Fade In + Phình to ra (Co bóp xuất hiện)
                alpha: 1,
                scaleX: baseScaleX * 1.8, // Phình to hơn mức bình thường một chút
                scaleY: baseScaleY * 1.5, // Phình to hơn mức bình thường một chút
                duration: 80,
                ease: 'Back.easeOut',
                onComplete: () => {
                    // Giai đoạn 2: Co về kích thước chuẩn và đứng yên một lát
                    manager.scene.tweens.add({
                        targets: skill,
                        scaleX: baseScaleX * 1.2,
                        scaleY: baseScaleY * 1.2,
                        duration: 80,
                        ease: 'Linear',
                        completeDelay: 100, // Đợi 100ms trước khi chạy onComplete
                        onComplete: () => {
                            // Giai đoạn 3: Co bóp nhẹ rồi biến mất (Fade Out)
                            manager.scene.tweens.add({
                                targets: skill,
                                alpha: 0,
                                scaleX: baseScaleX * 0.5,
                                scaleY: baseScaleY * 0.8,
                                duration: 50,
                                ease: 'Back.easeIn',
                                onComplete: () => {
                                    skill.destroy();
                                    onComplete?.();
                                    completeCallback();
                                }
                            });
                        }
                    });
                }
            });
        });
    }

    static async runAsync(
        manager: AnimationManager,
        itemImage: string
    ): Promise<void> {
        return manager.animationAsync(
            (cb) => SkillAnimation.run(manager, itemImage, cb)
        );
    }
}