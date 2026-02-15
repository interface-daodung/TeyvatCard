import Phaser from 'phaser';
import { themeManager } from '../../core/ThemeManager.js';

/**
 * Tạo thanh volume (label, icon mute, track, fill, thumb). getValue/setValue/toggleMute từ soundManager.
 */
export function createVolumeSlider(
    scene: Phaser.Scene,
    width: number,
    height: number,
    sliderYRatio: number,
    label: string,
    getValue: () => number,
    setValue: (v: number) => void,
    toggleMute: () => void
): Phaser.GameObjects.Container {
    const sliderY = height * sliderYRatio;
    const totalWidth = width * 0.6;
    const iconZone = 52;
    const trackWidth = (totalWidth - iconZone) * 0.92;
    const trackHeight = 18;
    const thumbRadius = 18;
    const centerX = width / 2;
    const leftEdge = centerX - totalWidth / 2;
    const trackLeft = leftEdge + iconZone + 10;
    const trackCenterX = trackLeft + trackWidth / 2;

    let value = getValue();

    const container = scene.add.container(0, 0);

    const labelText = scene.add.text(leftEdge + iconZone / 2, sliderY - 14, label, {
        fontSize: '14px',
        color: themeManager.getNeutral(),
        fontFamily: 'Arial'
    }).setOrigin(0.5).setAlpha(0.85);
    container.add(labelText);

    const iconLeft = scene.add.text(leftEdge + iconZone / 2, sliderY, value === 0 ? '🔇' : '🔊', {
        fontSize: '32px',
        fontFamily: 'Arial'
    }).setOrigin(0.5);
    iconLeft.setInteractive({ useHandCursor: true });
    iconLeft.on('pointerdown', () => {
        toggleMute();
        value = getValue();
        syncUI();
    });
    container.add(iconLeft);

    const track = scene.add.rectangle(trackCenterX, sliderY, trackWidth, trackHeight, themeManager.getSurfacePhaser());
    track.setStrokeStyle(2, themeManager.getSecondaryPhaser());
    track.setInteractive({ useHandCursor: true });
    track.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
        value = Math.max(0, Math.min(1, (ptr.worldX - trackLeft) / trackWidth));
        setValue(value);
        syncUI();
        startHold();
    });
    container.add(track);

    const fillWidth = trackWidth * value;
    const fill = scene.add.rectangle(trackLeft, sliderY, fillWidth, trackHeight - 4, themeManager.getPrimaryPhaser()).setOrigin(0, 0.5);
    container.add(fill);

    const thumbX = trackLeft + value * trackWidth;
    const thumbSize = thumbRadius * 2;
    const thumb = scene.add.rectangle(thumbX, sliderY, thumbSize, thumbSize, themeManager.getTextPhaser());
    thumb.setStrokeStyle(2, themeManager.getPrimaryPhaser());
    thumb.setInteractive({ useHandCursor: true });
    scene.input.setDraggable(thumb);
    thumb.on('drag', (_ptr: Phaser.Input.Pointer, _go: Phaser.GameObjects.GameObject, dragX: number) => {
        value = Math.max(0, Math.min(1, (dragX - trackLeft) / trackWidth));
        setValue(value);
        syncUI();
    });
    thumb.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
        value = Math.max(0, Math.min(1, (ptr.worldX - trackLeft) / trackWidth));
        setValue(value);
        syncUI();
    });
    container.add(thumb);

    function syncUI(): void {
        value = getValue();
        const t = trackLeft + value * trackWidth;
        thumb.setPosition(t, sliderY);
        fill.setSize(trackWidth * value, trackHeight - 4);
        fill.setPosition(trackLeft, sliderY);
        fill.setOrigin(0, 0.5);
        iconLeft.setText(value === 0 ? '🔇' : '🔊');
    }

    function startHold(): void {
        const moveHandler = (ptr: Phaser.Input.Pointer) => {
            if (ptr.isDown) {
                value = Math.max(0, Math.min(1, (ptr.worldX - trackLeft) / trackWidth));
                setValue(value);
                syncUI();
            }
        };
        const upHandler = () => {
            scene.input.off('pointermove', moveHandler);
            scene.input.off('pointerup', upHandler);
        };
        scene.input.on('pointermove', moveHandler);
        scene.input.once('pointerup', upHandler);
    }

    syncUI();
    return container;
}
