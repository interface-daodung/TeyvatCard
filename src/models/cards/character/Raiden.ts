import Phaser from 'phaser';
import Character from '../../../modules/typeCard/character.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import Enemy from '@/src/modules/typeCard/enemy.js';
import { animationRaidenSkill } from '@/src/animations/Sprites/animationRaidenSkill.js';
import { showFrameLayerOnce } from '@/src/modules/card/cardDisplay.js';

/** Texture của token gắn lên quái khi dùng burst — dùng để nhận diện thẻ bị đánh lan. */
const RAIDEN_TOKEN_TEXTURE_KEY = 'raiden-skill-token';

export default class Raiden extends Character {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('raiden') ?? { id: 'raiden', name: 'fallback Raiden', description: '', hp: 10, element: 'electro' };
        super(scene, x, y, index, config.name!, config.id!);

        this.elementalBurstCooldown = this.elementalBurstCooldownMax;

        this.applyConfig(config);
        this.createCard();
        scene.add.existing(this);
    }

    private readonly elementalBurstCooldownMax = 3; // Số lượt cooldown cho elemental burst   

    override elementalBurst(): void {
        this.elementalBurstCooldown = this.elementalBurstCooldownMax;;
        let enemyCount = 0;
        this.scene.gameManager.cardManager.getAllCards().forEach(card => {
            if (card?.type === 'enemy') enemyCount++;
        });
        if (enemyCount === 0) return;

        this.scene.gameManager.cardManager.getAllCards().forEach(card => {
            if (card?.type === 'enemy' && (card as Enemy).takeDamage) {
                showFrameLayerOnce(this.scene, card, { textureKey: 'raiden-skill' });
                card.add(tokenRaiden(this.scene, -45, 110).setDepth(10).setScale(0.5));
            }//-60, 90
        });
    }

    override reduceDurability(damage: number): void {
        super.reduceDurability(damage);
        if (damage <= 0) return;
        const splash = Math.max(1, Math.ceil(damage / 3));
        const gm = this.scene.gameManager;
        if (!gm) return;
        for (const card of gm.cardManager.getAllCards()) {
            if (!cardHasRaidenToken(card)) continue;
            if (card.type === 'enemy') {
                (card as Enemy).takeDamage(splash, 'damage', 'electro');
                (card as Enemy).add(animationRaidenSkill(this.scene, 0, 0).setDepth(10));
            }
        }
    }
}

function cardHasRaidenToken(card: Phaser.GameObjects.Container): boolean {
    for (const child of card.list) {
        if (child instanceof Phaser.GameObjects.Image && child.texture?.key === RAIDEN_TOKEN_TEXTURE_KEY) {
            return true;
        }
    }
    return false;
}

function tokenRaiden(scene: SceneWithGameManager, x: number, y: number): Phaser.GameObjects.Image {
    return scene.add.image(x, y, RAIDEN_TOKEN_TEXTURE_KEY);
}
