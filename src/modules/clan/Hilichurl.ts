import Phaser from 'phaser';
import type Character from '../typeCard/character.js';
import type { DamageElement } from '../typeCard/character.js';
import Enemy from '../typeCard/enemy.js';
import { animationArrow } from '@/src/animations/Sprites/animationArrow.js';
import TextureManager from '../../core/TextureManager.js';

const HILICHURL_TOKEN_TEXTURE = 'hilichurl-token';
const HILICHURL_TOKEN_SPACING = 22;
const HILICHURL_TOKEN_SIZE = 20;
const HILICHURL_TOKEN_CONTAINER_Y = 118;

type HilichurlAbilityOptions = {
    fullCount: number;
    resetValue: number;
    onThreshold: () => void;
};

export default abstract class Hilichurl extends Enemy {
    private hilichurlCount = 0;
    private hilichurlFullCount = 0;
    private hilichurlResetValue = 0;
    private onHilichurlThresholdReached: (() => void) | null = null;
    private hilichurlTokenContainer!: Phaser.GameObjects.Container;

    protected initHilichurlTokenCounter(options: HilichurlAbilityOptions): void {
        this.hilichurlFullCount = options.fullCount;
        this.hilichurlResetValue = options.resetValue;
        this.onHilichurlThresholdReached = options.onThreshold;

        this.hilichurlTokenContainer = this.scene.add.container(0, HILICHURL_TOKEN_CONTAINER_Y);
        this.add(this.hilichurlTokenContainer);
        this.refreshHilichurlTokens();

        const unsub = this.scene.gameManager?.emitter.on(
            'completeMove',
            this.onCompleteMoveHilichurl.bind(this),
            7
        );
        if (unsub) this.unsubscribeList.push(unsub);
    }

    private onCompleteMoveHilichurl(): void {
        this.hilichurlCount++;
        this.refreshHilichurlTokens();
        if (this.hilichurlCount < this.hilichurlFullCount) return;

        this.hilichurlCount = this.hilichurlResetValue;
        this.refreshHilichurlTokens();
        this.onHilichurlThresholdReached?.();
    }

    protected damageCharacterWithArrow(amount: number, element?: DamageElement): void {
        const cardCharacter = this.scene.gameManager?.cardManager?.CardCharacter as Character | undefined;
        cardCharacter?.takeDamage(amount, 'damage', element);
        cardCharacter?.add(animationArrow(this.scene, 0, 0).setDepth(10));
    }

    private refreshHilichurlTokens(): void {
        this.hilichurlTokenContainer.removeAll(true);
        const tokenCount = this.hilichurlCount;
        if (tokenCount <= 0) return;

        const totalWidth = (tokenCount - 1) * HILICHURL_TOKEN_SPACING;
        const startX = -totalWidth / 2;
        for (let i = 0; i < tokenCount; i++) {
            const img = TextureManager.image(
                this.hilichurlTokenContainer,
                startX + i * HILICHURL_TOKEN_SPACING,
                0,
                HILICHURL_TOKEN_TEXTURE
            );
            img.setDisplaySize(HILICHURL_TOKEN_SIZE, HILICHURL_TOKEN_SIZE);
        }
    }
}
