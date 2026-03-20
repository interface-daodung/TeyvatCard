import Phaser from 'phaser';
import { themeManager } from '../../core/ThemeManager.js';
import type { SkillButton } from './types.js';

export function createSkillButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    imageKey: string,
    initialCooldown: number,
    onUse: () => boolean,
    onNotReady: () => void
): SkillButton {
    const skillButton = scene.add.container(x, y);
    const buttonSize = 68;

    const background = scene.add.graphics();
    background.fillStyle(themeManager.getSurfacePhaser(), 1);
    background.fillRoundedRect(-buttonSize / 2, -buttonSize / 2, buttonSize, buttonSize, 20);
    background.setAlpha(0.5);

    const skillImage = scene.add.image(0, 0, imageKey);
    skillImage.setDisplaySize(80, 80);

    const countText = scene.add.text(buttonSize / 2, -buttonSize / 2, initialCooldown.toString(), {
        fontSize: '24px',
        color: themeManager.getText(),
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        stroke: themeManager.getBackground(),
        strokeThickness: 5
    }) as Phaser.GameObjects.Text;
    countText.setOrigin(0.5);

    skillButton.add([background, skillImage, countText]);
    skillButton.setSize(buttonSize, buttonSize);

    const applyCooldownState = (cooldown: number): void => {
        const normalizedCooldown = Math.max(0, cooldown);
        countText.setText(normalizedCooldown.toString());
        countText.setVisible(normalizedCooldown > 0);
        if (normalizedCooldown > 0) {
            skillImage.setTint(themeManager.getNeutralPhaser());
            skillButton.disableInteractive();
        } else {
            skillImage.clearTint();
            skillButton.setInteractive();
        }
    };
    applyCooldownState(initialCooldown);

    skillButton.on('pointerover', () => skillButton.setScale(1.1));
    skillButton.on('pointerout', () => skillButton.setScale(1));
    skillButton.on('pointerdown', () => {
        if (!skillButton.input?.enabled || !onUse()) {
            onNotReady();
        }
    });

    const skillButtonApi = {
        skillButton,
        setCooldown: applyCooldownState,
        /**
         * Đổi texture của icon skill real-time.
         * Không destroy/add lại để tránh lệch render order.
         */
        setTextureKey: (textureKey: string): void => {
            skillImage.setTexture(textureKey);
        }
    } as SkillButton;

    return skillButtonApi;
}
