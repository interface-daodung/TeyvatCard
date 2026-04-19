import Phaser from 'phaser';
import { themeManager } from '../../core/ThemeManager.js';
import TextureManager from '../../core/TextureManager.js';
import { SpritesheetWrapper } from '../../utils/SpritesheetWrapper.js';
import type { CardCharacter } from './types.js';

const CARD_WIDTH = 260;
const CARD_HEIGHT = 445.7142;
const SPACING = -180;
const ROTATION_ANGLES = [-15, 0, 15];
const CARD_ORDER = [0, 2, 1];
const CHARACTER_SPRITESHEET_MIN_LEVEL = 10;

function resolveTextureCards(
    cards: CardCharacter[],
    selectedCharacterId: string | null,
    characterLevel: Record<string, number> | null
): string[] {
    let textureCard: string[] = [cards[cards.length - 1].id, cards[0].id, cards[1].id];
    if (selectedCharacterId != null) {
        const selectedIndex = cards.findIndex(card => card.id === selectedCharacterId);
        if (selectedIndex !== -1) {
            textureCard = [
                cards[(selectedIndex - 1 + cards.length) % cards.length].id,
                cards[selectedIndex].id,
                cards[(selectedIndex + 1) % cards.length].id
            ];
            if (characterLevel != null) {
                textureCard = textureCard.map(texture => {
                    const level = characterLevel[texture];
                    if (level == null || level === 0) {
                        const unlockTextureKey = `unlock${texture.charAt(0).toUpperCase()}${texture.slice(1)}`;
                        return TextureManager.has(unlockTextureKey) ? unlockTextureKey : texture;
                    }
                    return level >= CHARACTER_SPRITESHEET_MIN_LEVEL ? texture + '-sprite' : texture;
                });
            }
        }
    }
    return textureCard;
}

function createIndividualCard(
    scene: Phaser.Scene,
    i: number,
    textureCard: string,
    cardWidth: number,
    cardHeight: number,
    spacing: number,
    rotationAngles: number[]
): Phaser.GameObjects.Container {
    const offsetX = (i - 1) * (cardWidth + spacing);
    const offsetY = Math.abs(i - 1) * 10;
    const hasSpriteSuffix = textureCard.endsWith('-sprite');

    const cardBorder = scene.add.graphics();
    cardBorder.lineStyle(4, hasSpriteSuffix ? themeManager.getAccentPhaser() : themeManager.getTextPhaser(), 1);
    cardBorder.strokeRoundedRect(-(cardWidth + 2) / 2, -(cardHeight + 2) / 2, cardWidth + 2, cardHeight + 2, 20);

    let cardImage: Phaser.GameObjects.GameObject;
    if (hasSpriteSuffix) {
        cardImage = SpritesheetWrapper.CharacterAnimation(scene, 0, 0, textureCard, cardWidth, cardHeight);
    } else {
        cardImage = TextureManager.image(scene, 0, 0, textureCard).setDisplaySize(cardWidth, cardHeight);
    }

    const individualCardContainer = scene.add.container(offsetX, offsetY);
    if (i === 1) {
        individualCardContainer.setScale(1.02);
        individualCardContainer.setPosition(offsetX, offsetY - 10);
    }
    individualCardContainer.add([cardBorder, cardImage]);
    individualCardContainer.setRotation(Phaser.Math.DegToRad(rotationAngles[i]));
    return individualCardContainer;
}

/**
 * Tạo container 3 thẻ xòe bài, hover animation, click → LoadingScene(SelectCharacterScene).
 */
export function createCardSpreadContainer(
    scene: Phaser.Scene,
    x: number,
    y: number,
    cards: CardCharacter[],
    selectedCharacterId: string | null,
    characterLevel: Record<string, number> | null
): void {
    const cardContainer = scene.add.container(x, y);
    const textureCards = resolveTextureCards(cards, selectedCharacterId, characterLevel);
    const cardContainers: Phaser.GameObjects.Container[] = [];

    CARD_ORDER.forEach(i => {
        const individualCardContainer = createIndividualCard(
            scene,
            i,
            textureCards[i],
            CARD_WIDTH,
            CARD_HEIGHT,
            SPACING,
            ROTATION_ANGLES
        );
        cardContainer.add(individualCardContainer);
        cardContainers.push(individualCardContainer);
    });

    cardContainer.setInteractive(new Phaser.Geom.Rectangle(-200, -200, 400, 400), Phaser.Geom.Rectangle.Contains);

    cardContainer.on('pointerover', () => {
        const hoverRotationAngles = [-18, 18, 0];
        const newOffsetX = [-120, 120, 0];
        const newOffsetY = [0, 0, -30];
        const newScale = [1.02, 1.02, 1.02];
        cardContainers.forEach((cc, index) => {
            scene.tweens.add({
                targets: cc,
                x: newOffsetX[index],
                y: newOffsetY[index],
                rotation: Phaser.Math.DegToRad(hoverRotationAngles[index]),
                scale: newScale[index],
                duration: 300,
                ease: 'Power2'
            });
        });
    });

    cardContainer.on('pointerout', () => {
        const originalRotationAngles = [-15, 15, 0];
        const originalOffsetX = [-80, 80, 0];
        const originalOffsetY = [0, 0, -20];
        const originalScale = [1, 1, 1.02];
        cardContainers.forEach((cc, index) => {
            scene.tweens.add({
                targets: cc,
                rotation: Phaser.Math.DegToRad(originalRotationAngles[index]),
                x: originalOffsetX[index],
                y: originalOffsetY[index],
                scale: originalScale[index],
                duration: 300,
                ease: 'Power2'
            });
        });
    });

    cardContainer.on('pointerdown', () => {
        scene.scene.start('LoadingScene', { targetScene: 'SelectCharacterScene' });
    });
}
