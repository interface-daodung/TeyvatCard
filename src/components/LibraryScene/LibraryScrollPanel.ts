import Phaser from 'phaser';
import { themeManager } from '../../core/ThemeManager.js';
import type { ContainerWithCardData } from './types.js';

/** GameObject that has a list of child GameObjects (e.g. Container list or RexUI sizer children). */
export type GameObjectWithChildren = Phaser.GameObjects.GameObject & {
    children: Phaser.GameObjects.GameObject[];
};

/**
 * Tạo scrollable panel chứa cardPanel, cuộn dọc, và gọi onCardClick khi click vào child có cardData.
 */
export function createLibraryScrollPanel(
    scene: Phaser.Scene,
    cardPanel: GameObjectWithChildren,
    onCardClick: (child: ContainerWithCardData) => void
): unknown {
    const { width, height } = scene.scale;
    const rexUI = (scene as any).rexUI;

    const panel = rexUI.add.scrollablePanel({
        x: width / 2,
        y: height * 0.52,
        height: height * 0.7,
        width: width * 0.9,
        scrollMode: 'y',
        background: rexUI.add.roundRectangle({
            strokeColor: themeManager.getSecondaryPhaser(),
            radius: 10
        }),
        panel: {
            child: cardPanel,
            mask: { padding: 10 }
        },
        slider: {
            track: rexUI.add.roundRectangle({
                width: 20,
                radius: 10,
                color: themeManager.getSurfacePhaser()
            }),
            thumb: rexUI.add.roundRectangle({
                radius: 13,
                color: themeManager.getSecondaryPhaser()
            })
        },
        mouseWheelScroller: { focus: false, speed: 0.1 },
        touchScroll: true,
        touchScrollBehavior: 'pan',
        space: { left: 20, right: 20, top: 20, bottom: 20, panel: 5 }
    })
        .layout()
        .setChildrenInteractive({ targets: cardPanel.children })
        .on('child.click', (child: ContainerWithCardData) => {
            onCardClick(child);
        });

    return panel;
}
