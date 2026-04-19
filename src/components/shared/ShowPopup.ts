import Phaser from 'phaser';

export const POPUP_CONFIG = {
    heal: { color: '#00ff00', prefix: '+' },
    damage: { color: '#ff0000', prefix: '-' },
    poisoning: { color: '#800080', prefix: '-' },
    curse: { color: '#000000', prefix: '!' },
    error: { color: '#ffffff', prefix: '' }
} as const;

export type PopupPayload = keyof typeof POPUP_CONFIG | { color: string; prefix: string };

export class ShowPopup {
    /**
     * Tạo popup chữ (tương tự hiệu ứng dmg/heal) và tween bay lên rồi tự destroy.
     * popup được add như child của `parentContainer` để tự follow vị trí card.
     */
    static show(
        parentContainer: Phaser.GameObjects.Container,
        amount: number,
        type: PopupPayload = 'error'
    ): void {
        const scene = parentContainer.scene;

        const config =
            typeof type === 'string'
                ? POPUP_CONFIG[type as keyof typeof POPUP_CONFIG] ?? POPUP_CONFIG.error
                : type;

        const popupTextPosition = {
            x: (Math.random() * 2 - 1) * 30,
            y: (Math.random() * 2 - 1) * 30
        };

        const popupText = scene.add
            .text(popupTextPosition.x, popupTextPosition.y, `${config.prefix}${amount}`, {
                fontSize: '32px',
                color: config.color,
                fontFamily: 'Arial',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            })
            .setOrigin(0.5)
            .setDepth(2002);

        parentContainer.add(popupText);

        scene.tweens.add({
            targets: popupText,
            y: -50,
            alpha: 0.1,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => popupText.destroy()
        });
    }
}

